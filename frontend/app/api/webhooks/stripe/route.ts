import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe } from '@/lib/stripe/client';
import { printful } from '@/lib/printful/client';
import { createServiceRoleClient } from '@/lib/supabase/server';
import type { Database } from '@/types/database';
import Stripe from 'stripe';

type OrderRow = Database['public']['Tables']['orders']['Row'];

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request: Request) {
    const body = await request.text();
    const signature = (await headers()).get('stripe-signature') as string;

    let event: Stripe.Event;

    try {
        if (!WEBHOOK_SECRET) throw new Error('Missing Webhook Secret');
        event = stripe.webhooks.constructEvent(body, signature, WEBHOOK_SECRET);
        console.log(`[Webhook] Received event: ${event.id}, Type: ${event.type}`);
    } catch (err: any) {
        console.error(`Webhook signature verification failed: ${err.message}`);
        return NextResponse.json({ error: 'Webhook Error' }, { status: 400 });
    }

    const supabase = createServiceRoleClient();

    try {
        // Handle Subscription Events
        if (event.type.startsWith('customer.subscription.')) {
            const subscription = event.data.object as Stripe.Subscription;
            const customerId = typeof subscription.customer === 'string'
                ? subscription.customer
                : subscription.customer.id;

            // Map Stripe status to our DB status
            const status = subscription.status;
            let tier: 'free' | 'carto_plus' = 'free';

            // simple check: if active/trialing, grant access
            if (['active', 'trialing'].includes(status)) {
                tier = 'carto_plus';
            }

            console.log(`[Webhook] Processing subscription ${subscription.id} for customer ${customerId}: ${status} -> ${tier}`);

            // We ideally need to find the user by Stripe Customer ID.
            let userId: string | null = null;

            // 1. Try match by stripe_customer_id
            const { data: profileByCustId, error: fetchError } = await supabase
                .from('profiles')
                .select('id')
                .eq('stripe_customer_id', customerId)
                .single();

            if (fetchError) {
                console.log(`[Webhook] Could not find profile for customer ${customerId}: ${fetchError.message}`);
            }

            if (profileByCustId) {
                userId = (profileByCustId as any).id;
                console.log(`[Webhook] Found User ID ${userId} for Customer ${customerId}`);
            }
        }

        // Handle Checkout Session Completed - BETTER place to link User <-> Customer
        if (event.type === 'checkout.session.completed') {
            const session = event.data.object as Stripe.Checkout.Session;

            console.log(`[Checkout] Processing session ${session.id}. Mode: ${session.mode}, User: ${session.client_reference_id}, Cust: ${session.customer}`);

            // Is this a subscription checkout?
            const metadataUserId = session.metadata?.userId || (session as any).subscription_data?.metadata?.userId;
            const userId = session.client_reference_id || metadataUserId;

            if (session.mode === 'subscription' && session.subscription && userId) {
                const customerId = session.customer as string;
                const subscriptionId = typeof session.subscription === 'string'
                    ? session.subscription
                    : session.subscription.id;

                console.log(`[Checkout] Linking User ${userId} to Customer ${customerId} with Sub ${subscriptionId}`);

                const { error: updateError } = await (supabase.from('profiles') as any).update({
                    stripe_customer_id: customerId,
                    stripe_subscription_id: subscriptionId,
                    subscription_status: 'active', // optimistic
                    subscription_tier: 'carto_plus'
                }).eq('id', userId);

                if (updateError) {
                    console.error(`[Checkout] Error updating profile:`, updateError);
                } else {
                    console.log(`[Checkout] Successfully updated profile for user ${userId}`);
                }

                // Log Event
                const { error: eventError } = await (supabase.from('page_events') as any).insert({
                    user_id: userId,
                    event_type: 'subscription_upgrade',
                    event_name: 'Upgraded to Carto Plus',
                    page_url: 'checkout',
                    metadata: {
                        stripe_subscription_id: subscriptionId,
                        method: 'checkout_session'
                    }
                });

                if (eventError) {
                    console.error(`[Checkout] Error logging event:`, eventError);
                }
            } else {
                console.log(`[Checkout] Session ${session.id} not qualified: mode=${session.mode}, sub=${!!session.subscription}, user=${!!session.client_reference_id}`);
            }
        }

        // Handle Subscription Specifics
        if (
            event.type === 'customer.subscription.created' ||
            event.type === 'customer.subscription.updated' ||
            event.type === 'customer.subscription.deleted'
        ) {
            const subscription = event.data.object as Stripe.Subscription;
            const customerId = subscription.customer as string;
            const status = subscription.status; // active, past_due, canceled, unpaid...

            console.log(`[Subscription] Event: ${event.type}, Sub: ${subscription.id}, Cust: ${customerId}, Status: ${status}`);

            // Logic: if status is active or trialing => carto_plus, else free
            const tier = ['active', 'trialing'].includes(status) ? 'carto_plus' : 'free';

            const { error: updateError } = await (supabase.from('profiles') as any).update({
                stripe_subscription_id: subscription.id,
                subscription_status: status,
                subscription_tier: tier
            }).eq('stripe_customer_id', customerId);

            if (updateError) {
                console.error(`[Subscription] Error updating profile for customer ${customerId}:`, updateError);
            } else {
                console.log(`[Subscription] Successfully updated profile for customer ${customerId} to status ${status}`);
            }

            // Track event if upgrading to active
            if (tier === 'carto_plus' && status === 'active') {
                // Find user id again if needed, or rely on profile update?
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('id')
                    .eq('stripe_customer_id', customerId)
                    .single() as { data: { id: string } | null };

                if (profile) {
                    const { error: eventError } = await (supabase.from('page_events') as any).insert({
                        user_id: profile.id,
                        event_type: 'subscription_upgrade',
                        event_name: 'Upgraded to Carto Plus',
                        page_url: 'webhook',
                        metadata: {
                            stripe_subscription_id: subscription.id,
                            amount: subscription.items.data[0]?.price.unit_amount,
                            currency: subscription.items.data[0]?.price.currency
                        }
                    });

                    if (eventError) {
                        console.error(`[Subscription] Error logging upgrade event:`, eventError);
                    }
                } else {
                    console.warn(`[Subscription] No profile found for customer ${customerId} to log event.`);
                }
            }
        }

        // Existing Order Layout Logic
        if (event.type === 'payment_intent.succeeded') {
            const paymentIntent = event.data.object as Stripe.PaymentIntent;
            const { metadata, shipping } = paymentIntent;

            if (!metadata?.design_id) {
                return NextResponse.json({ received: true });
            }

            console.log(`[Order] Payment confirmed: ${paymentIntent.id}`);

            // Update Order in DB
            const { data: order, error: fetchError } = await (supabase as any)
                .from('orders')
                .select('*')
                .eq('stripe_payment_intent_id', paymentIntent.id)
                .single();

            if (fetchError || !order) {
                console.error('[Order] Order not found for payment_intent', paymentIntent.id);
                return NextResponse.json({ error: 'Order not found' }, { status: 404 });
            }

            const typedOrder = order as OrderRow;

            // Idempotency Check
            if (typedOrder.status === 'paid' || typedOrder.status === 'failed') {
                console.log(`[Order] ${typedOrder.id} already processed (status: ${typedOrder.status}). Skipping.`);
                return NextResponse.json({ received: true });
            }

            // Submit to Printful
            try {
                // Printful external_id limit is 32 chars, UUID is 36 - remove dashes
                const printfulOrder = await printful.createOrder({
                    external_id: typedOrder.id.replace(/-/g, ''),
                    recipient: {
                        name: shipping?.name,
                        address1: shipping?.address?.line1,
                        address2: shipping?.address?.line2,
                        city: shipping?.address?.city,
                        state_code: shipping?.address?.state,
                        country_code: shipping?.address?.country,
                        zip: shipping?.address?.postal_code,
                    },
                    items: [
                        {
                            variant_id: typedOrder.variant_id,
                            quantity: typedOrder.quantity,
                            files: [
                                /^\d+$/.test(typedOrder.design_id)
                                    ? { id: parseInt(typedOrder.design_id) }
                                    : { url: typedOrder.design_id }
                            ]
                        }
                    ],
                    confirm: false
                });

                await (supabase as any)
                    .from('orders')
                    .update({
                        status: 'paid',
                        printful_order_id: printfulOrder.id,
                        stripe_payment_status: 'succeeded'
                    })
                    .eq('id', typedOrder.id);

                // Track purchase completion
                await (supabase as any).from('page_events').insert({
                    user_id: typedOrder.user_id || null,
                    session_id: metadata?.session_id || null,
                    event_type: 'purchase_complete',
                    event_name: 'order_placed',
                    page_url: 'checkout',
                    metadata: {
                        order_id: typedOrder.id,
                        variant_id: typedOrder.variant_id,
                        amount_cents: paymentIntent.amount,
                        currency: paymentIntent.currency,
                        printful_order_id: printfulOrder.id,
                        shipping_country: shipping?.address?.country
                    }
                });

                console.log(`[Order] Successfully created Printful order ${printfulOrder.id} and tracked purchase_complete event`);

            } catch (err: any) {
                console.error('[Order] Failed to create Printful order', err);
                await (supabase as any)
                    .from('orders')
                    .update({
                        status: 'paid_fulfillment_failed',
                        shipping_name: `FAILED: ${err.message || 'Unknown error'}`.substring(0, 255)
                    })
                    .eq('id', typedOrder.id);
            }
        } else if (event.type === 'payment_intent.payment_failed') {
            const paymentIntent = event.data.object as Stripe.PaymentIntent;
            const { metadata } = paymentIntent;

            if (!metadata?.design_id) {
                return NextResponse.json({ received: true });
            }

            console.log(`[Order] Payment failed: ${paymentIntent.id}`);

            const { error: updateError } = await (supabase as any)
                .from('orders')
                .update({
                    status: 'failed',
                    stripe_payment_status: 'failed'
                })
                .eq('stripe_payment_intent_id', paymentIntent.id);

            if (updateError) {
                console.error('[Order] Failed to update order status to failed', updateError);
            }
        }

        return NextResponse.json({ received: true });
    } catch (err: any) {
        console.error(`[Webhook Error] Critical failure:`, err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
