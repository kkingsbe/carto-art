import { createClient } from '@/lib/supabase/server';
import { isAdmin } from '@/lib/admin-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    if (!(await isAdmin())) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const metricType = searchParams.get('type') || 'all'; // 'generation' | 'search'
    const days = parseFloat(searchParams.get('days') || '30');

    // Determine interval in minutes
    let intervalMinutes = 1440;
    if (days <= 0.25) intervalMinutes = 15;
    else if (days <= 1.0) intervalMinutes = 30;

    const supabase = await createClient();

    // Calculate stable time boundaries
    const now = new Date();
    // Round down current time to the nearest interval for stability
    const endMs = Math.floor(now.getTime() / (intervalMinutes * 60 * 1000)) * (intervalMinutes * 60 * 1000);
    const endTime = new Date(endMs);

    const msToFetch = days * 24 * 60 * 60 * 1000;
    const startTime = new Date(endMs - msToFetch);

    // Cast to any to bypass missing database types for new RPC
    const { data, error } = await (supabase.rpc as any)('get_latency_stats', {
        p_metric_type: metricType,
        p_start_time: startTime.toISOString(),
        p_end_time: endTime.toISOString(),
        p_interval_minutes: intervalMinutes
    });

    if (error) {
        console.error('Error fetching latency stats:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Format for chart
    const result = (data as any[]).map((d: any) => ({
        date: d.bucket,
        value: Number(d.avg_value)
    }));

    return NextResponse.json(result);
}
