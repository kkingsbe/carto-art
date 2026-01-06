
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Fetch Profile
    const { data: profile } = await (supabase as any)
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    // Fetch Recent Orders
    const { data: orders } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

    // Fetch Recent Events
    const { data: events } = await supabase
        .from('page_events')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

    return NextResponse.json({
        timestamp: new Date().toISOString(),
        user: { id: user.id, email: user.email },
        profile: {
            subscription_tier: profile?.subscription_tier,
            subscription_status: profile?.subscription_status,
            stripe_customer_id: profile?.stripe_customer_id,
            credits: 0 // Placeholder: credits field does not exist in profiles table
        },
        latest_orders: orders,
        recent_events: events
    }, { status: 200 });
}
