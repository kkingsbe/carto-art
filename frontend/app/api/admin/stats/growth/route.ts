import { createClient } from '@/lib/supabase/server';
import { isAdmin } from '@/lib/admin-auth';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const isUserAdmin = await isAdmin();
        if (!isUserAdmin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = await createClient();

        // Fetch all growth metrics in parallel
        const [activationRes, revenueRes, stickinessRes] = await Promise.all([
            supabase.rpc('get_activation_metrics'),
            supabase.rpc('get_revenue_metrics'),
            supabase.rpc('get_stickiness_metrics')
        ]);

        if (activationRes.error) console.error('Activation RPC error:', activationRes.error);
        if (revenueRes.error) console.error('Revenue RPC error:', revenueRes.error);
        if (stickinessRes.error) console.error('Stickiness RPC error:', stickinessRes.error);

        return NextResponse.json({
            activation: activationRes.data || {
                avg_time_to_map_seconds: 0,
                median_time_to_map_seconds: 0,
                activation_rate_3d: 0
            },
            revenue: revenueRes.data || {
                total_revenue: 0,
                arpu: 0,
                arppu: 0,
                paying_users: 0
            },
            stickiness: stickinessRes.data || {
                dau: 0,
                mau: 0,
                stickiness_ratio: 0
            }
        });

    } catch (error) {
        console.error('Growth metrics error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
