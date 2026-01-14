import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const trackingSchema = z.object({
    orderId: z.string().min(1),
    email: z.string().email()
});

export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const body = await request.json();
        const { orderId, email } = trackingSchema.parse(body);

        // Fetch order
        // We select minimal details for security if needed, or full details
        const { data: order, error } = await supabase
            .from('orders')
            .select('*')
            .eq('id', orderId)
            .single();

        if (error || !order) {
            // Return generic error to prevent enumeration/timing attacks?
            // For now, simple error.
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        // Verify email match
        // Check either registered user email OR guest email
        let authorized = false;

        if (order.customer_email && order.customer_email.toLowerCase() === email.toLowerCase()) {
            authorized = true;
        } else {
            // Fallback: check if the user owning this order has this email?
            // If order has user_id, check profiles?
            // For now, simpler: strict match on what was saved on order.
            // If the order was made by a logged-in user, we should probably check their email in auth or profile.
            // But for anonymous tracking, we rely on what is on the order record.
            // If we saved customer_email for logged-in users too (which we do now in route.ts), this works.
        }

        if (!authorized) {
            return NextResponse.json({ error: 'Order not found or access denied' }, { status: 404 });
        }

        return NextResponse.json({ order });

    } catch (error: any) {
        console.error('Tracking Error:', error);
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
}
