import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe } from '@/lib/stripe/client';
import { printful } from '@/lib/printful/client';
import { createServiceRoleClient } from '@/lib/supabase/server';
import Stripe from 'stripe';

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
        const { data: order, error: fetchError } = await supabase
            .from('orders')
            .select('*')
            .eq('stripe_payment_intent_id', paymentIntent.id)
            .single();

        if (fetchError || !order) {
            console.error('Order not found for payment_intent', paymentIntent.id);
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        // Submit to Printful
        try {
            const printfulOrder = await printful.createOrder({
                external_id: order.id,
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
                        variant_id: parseInt(order.variant_id),
                        quantity: order.quantity,
                        files: [
                            // Logic: If design_id is numeric, treat as File ID. If URL, treat as URL.
                            /^\d+$/.test(order.design_id)
                                ? { id: parseInt(order.design_id) }
                                : { url: order.design_id }
                        ]
                    }
                ],
                confirm: true // Automatically confirm? Or draft?
            });

            // Update DB
            await supabase.from('orders').update({
                status: 'paid',
                printful_order_id: printfulOrder.id,
                stripe_payment_status: 'succeeded'
            }).eq('id', order.id);

        } catch (err) {
            console.error('Failed to create Printful order', err);
            // Mark as paid but failed fulfillment
            await supabase.from('orders').update({
                status: 'paid', // Still paid
                shipping_name: 'FAILED_TO_FULFILL: ' + JSON.stringify(err) // HACK to store error
            }).eq('id', order.id);
        }
    } else if (event.type === 'payment_intent.payment_failed') {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log(`Payment failed: ${paymentIntent.id}`);

        // Update Order in DB to failed
        const { error: updateError } = await supabase
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
