import Stripe from 'stripe';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

if (!STRIPE_SECRET_KEY) {
    console.warn('Missing STRIPE_SECRET_KEY environment variable');
}

export const stripe = new Stripe(STRIPE_SECRET_KEY || '', {
    apiVersion: '2025-12-15.clover', // Use latest stable version or match user's version
    typescript: true,
});
