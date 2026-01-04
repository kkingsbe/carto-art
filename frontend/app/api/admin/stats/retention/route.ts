import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/types/database';
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

        // 1. Fetch Retention Rates via RPC
        const [day1Res, day7Res, day30Res] = await Promise.all([
            supabase.rpc('get_retention_rate', { days_since_signup: 1 } as any),
            supabase.rpc('get_retention_rate', { days_since_signup: 7 } as any),
            supabase.rpc('get_retention_rate', { days_since_signup: 30 } as any)
        ]);

        // 2. Calculate Churn/Risk metrics
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

        // Count active users (active in last 7 days)
        const { count: activeCount } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .gte('last_active_at', sevenDaysAgo);

        // Count at-risk users (inactive 7-30 days)
        const { count: atRiskCount } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .lt('last_active_at', sevenDaysAgo)
            .gte('last_active_at', thirtyDaysAgo);

        // Count churned users (inactive > 30 days)
        const { count: churnedCount } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .lt('last_active_at', thirtyDaysAgo);

        // Get total users to calculate percentages
        const { count: totalUsers } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true });

        const safeTotal = totalUsers || 1;

        return NextResponse.json({
            retentionRates: {
                day1: day1Res.data || 0,
                day7: day7Res.data || 0,
                day30: day30Res.data || 0
            },
            userHealth: {
                active: {
                    count: activeCount || 0,
                    percentage: ((activeCount || 0) / safeTotal) * 100
                },
                atRisk: {
                    count: atRiskCount || 0,
                    percentage: ((atRiskCount || 0) / safeTotal) * 100
                },
                churned: {
                    count: churnedCount || 0,
                    percentage: ((churnedCount || 0) / safeTotal) * 100
                }
            }
        });

    } catch (error) {
        console.error('Retention stats error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
