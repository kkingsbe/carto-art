import { NextResponse } from 'next/server';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe/client';
import { printful } from '@/lib/printful/client';
import { getSiteConfig } from '@/lib/actions/usage';
import { CONFIG_KEYS } from '@/lib/actions/usage.types';
import { z } from 'zod';
import type { Database } from '@/types/database';





const checkoutSchema = z.object({
    variant_id: z.number(),
    design_file_id: z.union([z.number(), z.string()]), // ID from Printful OR signed URL
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
    }),
    mockup_data_url: z.string().optional().nullish(),
    email: z.string().email().optional()
});

export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        const body = await request.json();
        const { variant_id, design_file_id, quantity, shipping, mockup_data_url, email } = checkoutSchema.parse(body);

        if (!user && !email) {
            return NextResponse.json({ error: 'Email is required for guest checkout' }, { status: 400 });
        }

        const customerEmail = user ? user.email : email;


        // Calculate Amount from DB
        const { data: variant, error: variantError } = await supabase
            .from('product_variants')
            .select('price_cents')
            .eq('id', variant_id)
            .eq('is_active', true)
            .single<{ price_cents: number }>();

        if (variantError || !variant) {
            console.error("Variant lookup failed", variantError, variant_id);
            return NextResponse.json({ error: 'Invalid or inactive Variant ID' }, { status: 400 });
        }
        const basePrice = variant.price_cents;

        // Apply profit margin from site config
        const marginPercent = await getSiteConfig(CONFIG_KEYS.PRODUCT_MARGIN_PERCENT);
        const unitPrice = Math.round(basePrice * (1 + marginPercent / 100));
        const productAmount = unitPrice * quantity;

        // Fetch Shipping Rates
        let shippingCost = 0;
        try {
            const rates = await printful.getShippingRates({
                address: {
                    address1: shipping.address.line1,
                    city: shipping.address.city,
                    country_code: shipping.address.country,
                    state_code: shipping.address.state,
                    zip: shipping.address.postal_code,
                },
                items: [
                    {
                        variant_id: variant_id,
                        quantity: quantity
                    }
                ]
            });

            if (rates.length === 0) {
                throw new Error('No shipping rates found for this address');
            }

            // Find cheapest rate
            const cheaptestRate = rates.reduce((min: any, curr: any) => {
                return parseFloat(curr.rate) < parseFloat(min.rate) ? curr : min;
            });

            shippingCost = Math.round(parseFloat(cheaptestRate.rate) * 100);

        } catch (error: any) {
            console.error('Shipping Rate Error:', error);
            return NextResponse.json(
                { error: error.message || 'Unable to calculate shipping. Please check your address.' },
                { status: 400 }
            );
        }

        const amount = productAmount + shippingCost;
        let finalMockupUrl: string | null = null;

        // Create Admin Client for privileged operations (Storage & DB)
        const adminSupabase = createServiceRoleClient();

        // Upload mockup if provided
        if (mockup_data_url && mockup_data_url.startsWith('data:image/')) {
            try {
                const base64Data = mockup_data_url.split(',')[1];
                const buffer = Buffer.from(base64Data, 'base64');
                const userId = user ? user.id : 'guest';
                const path = `${userId}/mockups/${Date.now()}-${Math.random().toString(36).substring(7)}.png`;

                // Use adminSupabase for upload to bypass RLS policies on 'mockups' bucket
                const { data: uploadData, error: uploadError } = await adminSupabase.storage
                    .from('mockups')
                    .upload(path, buffer, {
                        contentType: 'image/png',
                        upsert: true
                    });

                if (uploadError) {
                    console.error("Mockup upload failed", uploadError);
                } else {
                    const { data: { publicUrl } } = adminSupabase.storage
                        .from('mockups')
                        .getPublicUrl(path);
                    finalMockupUrl = publicUrl;
                }
            } catch (e) {
                console.error("Failed to process mockup data URL", e);
            }
        }

        // Create PaymentIntent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount,
            currency: 'usd',
            automatic_payment_methods: { enabled: true },
            receipt_email: customerEmail,
            metadata: {
                user_id: user ? user.id : 'guest',
                variant_id: variant_id.toString(),
                design_id: typeof design_file_id === 'number'
                    ? design_file_id.toString()
                    : (design_file_id.length > 100 ? 'URL_PENDING' : design_file_id),
                quantity: quantity.toString(),
                customer_email: customerEmail || '',
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

        // Create Order Record - USE SERVICE ROLE to bypass RLS for guest users
        // Note: adminSupabase initialized above

        type OrdersInsert = Database['public']['Tables']['orders']['Insert'];
        const orderData: OrdersInsert = {
            user_id: user ? user.id : null,
            // customer_email: customerEmail, // Column missing in DB schema cache - temporarily disabled
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
            shipping_address_line2: shipping.address.line2 ?? null,
            shipping_city: shipping.address.city,
            shipping_state: shipping.address.state,
            shipping_zip: shipping.address.postal_code,
            shipping_country: shipping.address.country,
            mockup_url: finalMockupUrl as any, // Cast as any because TS types might not be updated yet
        };
        const { error: dbError } = await (adminSupabase as any)
            .from('orders')
            .insert(orderData);

        if (dbError) {
            console.error("DB Error", dbError);
            return NextResponse.json({
                error: 'Failed to create order record',
                details: dbError
            }, { status: 500 });
        }

        return NextResponse.json({
            clientSecret: paymentIntent.client_secret,
            breakdown: {
                subtotal: productAmount,
                shipping: shippingCost,
                tax: 0, // Tax handling to be added specifically if needed, currently 0
                total: amount
            }
        });

    } catch (error: any) {
        console.error('Checkout Error:', error);
        return NextResponse.json({ error: error.message || 'Checkout initialization failed', details: error }, { status: 500 });
    }
}
