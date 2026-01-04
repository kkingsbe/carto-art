import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe/client';
import { z } from 'zod';

// Define product prices (could be moved to DB or config)
const PRICES: Record<number, number> = {
    // Example IDs - REPLACE with actual Printful Variant IDs
    // 18x24
    12345: 9900, // $99.00
    // 24x36
    67890: 14900, // $149.00
};

const checkoutSchema = z.object({
    variant_id: z.number(),
    design_file_id: z.number(), // ID from Printful
    quantity: z.number().min(1),
    shipping: z.object({
        name: z.string(),
        address: z.object({
            line1: z.string(),
            line2: z.string().optional(),
            city: z.string(),
            state: z.string(),
            postal_code: z.string(),
            country: z.string().length(2),
        })
    })
});

export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { variant_id, design_file_id, quantity, shipping } = checkoutSchema.parse(body);

        // Calculate Amount
        // TODO: Fetch Real Price / Use Config
        // For now fallback to $99 defaults if ID not found, to allow testing
        const unitPrice = PRICES[variant_id] || 9900;
        const amount = unitPrice * quantity;

        // Create PaymentIntent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount,
            currency: 'usd',
            automatic_payment_methods: { enabled: true },
            metadata: {
                user_id: user.id,
                variant_id: variant_id.toString(),
                design_file_id: design_file_id.toString(),
                quantity: quantity.toString(),
            },
            shipping: {
                name: shipping.name,
                address: {
                    line1: shipping.address.line1,
                    line2: shipping.address.line2 || undefined,
                    city: shipping.address.city,
                    state: shipping.address.state,
                    postal_code: shipping.address.postal_code,
                    country: shipping.address.country,
                }
            }
        });

        // Create Order Record
        const { error: dbError } = await supabase.from('orders').insert({
            user_id: user.id,
            stripe_payment_intent_id: paymentIntent.id,
            amount_total: amount,
            status: 'pending',
            // Product
            variant_id: variant_id,
            design_id: design_file_id.toString(),
            quantity: quantity,
            // Shipping Snapshot
            shipping_name: shipping.name,
            shipping_address_line1: shipping.address.line1,
            shipping_address_line2: shipping.address.line2,
            shipping_city: shipping.address.city,
            shipping_state: shipping.address.state,
            shipping_zip: shipping.address.postal_code,
            shipping_country: shipping.address.country,
        });

        if (dbError) {
            console.error("DB Error", dbError);
            throw new Error('Failed to create order record');
        }

        return NextResponse.json({ clientSecret: paymentIntent.client_secret });

    } catch (error: any) {
        console.error('Checkout Error:', error);
        return NextResponse.json({ error: error.message || 'Checkout initialization failed', details: error }, { status: 500 });
    }
}
