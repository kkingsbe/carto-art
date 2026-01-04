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
    } catch (err: any) {
        console.error(`Webhook signature verification failed: ${err.message}`);
        return NextResponse.json({ error: 'Webhook Error' }, { status: 400 });
    }

    const supabase = createServiceRoleClient();

    // Handle the event
    if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const { metadata, shipping } = paymentIntent;

        console.log(`Payment confirmed: ${paymentIntent.id}`);

        // Update Order in DB
        const { data: order, error: fetchError } = await (supabase as any)
            .from('orders')
            .select('*')
            .eq('stripe_payment_intent_id', paymentIntent.id)
            .single();

        if (fetchError || !order) {
            console.error('Order not found for payment_intent', paymentIntent.id);
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        const typedOrder = order as OrderRow;

        // Idempotency Check: Don't process if already paid or failed
        if (typedOrder.status === 'paid' || typedOrder.status === 'failed') {
            console.log(`Order ${typedOrder.id} already processed (status: ${typedOrder.status}). Skipping.`);
            return NextResponse.json({ received: true });
        }

        // Submit to Printful
        try {
            const printfulOrder = await printful.createOrder({
                external_id: typedOrder.id,
                recipient: {
                    name: shipping?.name,
                    address1: shipping?.address?.line1,
                    address2: shipping?.address?.line2,
                    city: shipping?.address?.city,
                    state_code: shipping?.address?.state, // Be precise with state codes if possible
                    country_code: shipping?.address?.country,
                    zip: shipping?.address?.postal_code,
                },
                items: [
                    {
                        variant_id: typedOrder.variant_id,
                        quantity: typedOrder.quantity,
                        files: [
                            // Logic: If design_id is numeric, treat as File ID. If URL, treat as URL.
                            /^\d+$/.test(typedOrder.design_id)
                                ? { id: parseInt(typedOrder.design_id) }
                                : { url: typedOrder.design_id }
                        ]
                    }
                ],
                confirm: true // Automatically confirm? Or draft?
            });

            // Update DB
            await (supabase as any)
                .from('orders')
                .update({
                    status: 'paid',
                    printful_order_id: printfulOrder.id,
                    stripe_payment_status: 'succeeded'
                })
                .eq('id', typedOrder.id);

        } catch (err: any) {
            console.error('Failed to create Printful order', err);
            // Mark as failed so admin can intervene
            await (supabase as any)
                .from('orders')
                .update({
                    status: 'failed',
                    // Store error context if possible, or assume logs will be checked
                    shipping_name: `FAILED: ${err.message || 'Unknown error'}`.substring(0, 255) // Fallback context storage
                })
                .eq('id', typedOrder.id);
        }
    } else if (event.type === 'payment_intent.payment_failed') {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log(`Payment failed: ${paymentIntent.id}`);

        // Update Order in DB to failed
        const { error: updateError } = await (supabase as any)
            .from('orders')
            .update({
                status: 'failed',
                stripe_payment_status: 'failed'
            })
            .eq('stripe_payment_intent_id', paymentIntent.id);

        if (updateError) {
            console.error('Failed to update order status to failed', updateError);
        }
    }

    return NextResponse.json({ received: true });
}
