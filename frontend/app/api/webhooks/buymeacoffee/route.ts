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

        const { type, response: rawResponse, data: rawData } = payload;

        // Support both old 'response' and new 'data' envelopes
        const response = rawData || rawResponse || {};

        // Log payload for debugging
        console.log('BMAC Webhook received:', JSON.stringify(payload));

        const externalId = response.id ||
            response.subscription_id ||
            response.donation_id ||
            response.item_id ||
            response.order_id;

        if (!externalId) {
            console.warn('No external ID found in BMAC payload:', payload);
            return NextResponse.json({ status: 'ignored' });
        }

        // Calculate amount
        let amount = 0;
        if (response.amount) {
            amount = parseFloat(response.amount);
        } else if (response.total_amount_charged) {
            amount = parseFloat(response.total_amount_charged);
        } else {
            const price = parseFloat(response.subscription_coffee_price || response.coffee_price || '0');
            const countStr = response.subscription_coffee_num || response.coffee_num;
            const count = countStr ? parseFloat(countStr) : 1;
            amount = price * count;
        }

        // Parse date - handle Unix timestamp in seconds (BMAC default) or ISO string
        let createdAt = new Date().toISOString();
        if (response.created_at) {
            // If it's a number (Unix timestamp in seconds), convert to ms
            if (typeof response.created_at === 'number') {
                createdAt = new Date(response.created_at * 1000).toISOString();
            } else {
                createdAt = response.created_at;
            }
        } else if (response.subscription_created_on) {
            createdAt = response.subscription_created_on;
        }

        const donationData = {
            id: externalId.toString(),
            amount: amount,
            currency: response.currency || response.subscription_currency || 'USD',
            sender_name: response.supporter_name || response.payer_name || response.name || 'Anonymous',
            sender_email: response.supporter_email || response.payer_email || response.email || null,
            message: response.support_note || response.subscription_message || response.message || response.supporter_message || '',
            type: type?.includes('subscription') ? 'subscription' : 'donation',
            status: 'success',
            created_at: createdAt,
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
