import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { printful } from '@/lib/printful/client';
import { z } from 'zod';

const shippingSchema = z.object({
    address: z.object({
        address1: z.string(),
        city: z.string(),
        country_code: z.string().length(2),
        state_code: z.string().optional(),
        zip: z.string().optional(),
    }),
    items: z.array(z.object({
        variant_id: z.number(),
        quantity: z.number().min(1),
    })),
});

export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { address, items } = shippingSchema.parse(body);

        const rates = await printful.getShippingRates({ address, items });

        return NextResponse.json({ rates });
    } catch (error) {
        console.error('Shipping Rates Error:', error);
        return NextResponse.json({ error: 'Failed to calculate shipping' }, { status: 500 });
    }
}
