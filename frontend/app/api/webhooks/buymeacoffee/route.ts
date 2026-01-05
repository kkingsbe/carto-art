import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Use service role to bypass RLS for writes
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
    try {
        const payload = await req.json();
        const signature = req.headers.get('x-signature-sha256');

        // Optional: Verify signature if secret is provided in env
        // BMAC provides a secret in the dashboard
        const secret = process.env.BUY_ME_A_COFFEE_WEBHOOK_SECRET;
        if (secret && signature) {
            const hmac = crypto.createHmac('sha256', secret);
            const digest = hmac.update(JSON.stringify(payload)).digest('hex');

            if (signature !== digest) {
                return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
            }
        }

        const { type, response } = payload;

        // Map BMAC types to our schema
        // response object varies by type, but common fields:
        // subscription_id or donation_id, payer_email, payer_name, coffee_amount, etc.

        const externalId = response.subscription_id || response.donation_id || response.item_id || response.order_id;

        if (!externalId) {
            console.warn('No external ID found in BMAC payload:', payload);
            return NextResponse.json({ status: 'ignored' });
        }

        // Calculate amount
        // For donations: coffee_price * coffee_num
        // For subscriptions: subscription_coffee_price * subscription_coffee_num
        const amount = parseFloat(response.subscription_coffee_price || response.coffee_price || '0') *
            (response.subscription_coffee_num || response.coffee_num || 0);

        const donationData = {
            id: externalId.toString(),
            amount: amount,
            currency: response.subscription_currency || response.currency || 'USD',
            sender_name: response.payer_name || response.name || 'Anonymous',
            sender_email: response.payer_email || response.email || null,
            message: response.subscription_message || response.message || '',
            type: type?.includes('subscription') ? 'subscription' : 'donation',
            status: 'success', // We usually receive success events
            created_at: response.subscription_created_on || response.created_at || new Date().toISOString(),
        };

        const { error } = await supabaseAdmin
            .from('donations')
            .upsert(donationData, { onConflict: 'id' });

        if (error) {
            console.error('Error saving donation to Supabase:', error);
            return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
        }

        return NextResponse.json({ status: 'ok' });
    } catch (error) {
        console.error('Webhook handler error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
