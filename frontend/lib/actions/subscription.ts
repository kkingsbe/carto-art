'use server';

import { stripe } from '@/lib/stripe/client';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { logger } from '@/lib/logger';

const STRIPE_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export async function createCheckoutSession(returnUrl?: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error('User not authenticated');
    }

    let url: string | null = null;
    try {

        if (!STRIPE_PRICE_ID) {
            console.error('Missing NEXT_PUBLIC_STRIPE_PRICE_ID');
            throw new Error('Stripe configuration error: Missing Price ID');
        }

        if (STRIPE_PRICE_ID.startsWith('prod_')) {
            console.error(`Invalid Stripe ID: ${STRIPE_PRICE_ID}. You provided a Product ID, but a Price ID (starting with 'price_') is required.`);
            throw new Error('Stripe configuration error: Expected Price ID, got Product ID');
        }

        if (!STRIPE_PRICE_ID.startsWith('price_')) {
            console.error(`Invalid Stripe Price ID format: ${STRIPE_PRICE_ID}`);
            throw new Error('Stripe configuration error: Invalid Price ID format');
        }

        // Get user email
        const { data: profile } = await supabase
            .from('profiles')
            .select('stripe_customer_id, username')
            .eq('id', user.id)
            .single();

        let customerId = (profile as any)?.stripe_customer_id;

        // Create Checkout Session
        const session = await stripe.checkout.sessions.create({
            customer: customerId || undefined,
            customer_email: !customerId ? user.email : undefined,
            client_reference_id: user.id, // Critical for webhook linkage
            payment_method_types: ['card'],
            line_items: [
                {
                    price: STRIPE_PRICE_ID,
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            success_url: `${APP_URL}/editor?success=true&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: returnUrl || `${APP_URL}/editor?canceled=true`,
            metadata: {
                userId: user.id,
            },
            subscription_data: {
                metadata: {
                    userId: user.id
                }
            }
        });

        if (!session.url) {
            throw new Error('Failed to create checkout session');
        }

        url = session.url;

    } catch (error: any) {
        // Next.js redirect throws a special error that should not be caught
        if (error.message === 'NEXT_REDIRECT') throw error;

        const keyHint = process.env.STRIPE_SECRET_KEY?.substring(0, 24);
        console.error(`[Stripe Error] Key: ${keyHint}..., Price: ${STRIPE_PRICE_ID}`);

        logger.error('Failed to create checkout session', {
            error: error.message,
            keyHint,
            priceId: STRIPE_PRICE_ID,
            userId: user.id
        });
        throw error;
    }

    if (url) {
        redirect(url);
    }
}

export async function createCustomerPortalSession() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('User not authenticated');

    const { data: profile } = await supabase
        .from('profiles')
        .select('stripe_customer_id')
        .eq('id', user.id)
        .single();

    if (!(profile as any)?.stripe_customer_id) {
        throw new Error('No subscription found');
    }

    const session = await stripe.billingPortal.sessions.create({
        customer: (profile as any).stripe_customer_id,
        return_url: `${APP_URL}/profile`,
    });

    redirect(session.url);
}
