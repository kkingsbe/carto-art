import { createClient } from '@/lib/supabase/server';
import { isAdmin } from '@/lib/admin-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    if (!(await isAdmin())) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const eventType = searchParams.get('type') || 'all';

    const supabase = await createClient();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Fetch events in the last 30 days
    let query = supabase
        .from('page_events')
        .select('created_at')
        .gte('created_at', thirtyDaysAgo.toISOString());

    if (eventType !== 'all') {
        query = query.eq('event_type', eventType);
    }

    const { data: events, error } = await query
        .order('created_at', { ascending: true });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Group by date
    const counts: Record<string, number> = {};

    // Initialize last 30 days with 0
    for (let i = 0; i <= 30; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        counts[d.toISOString().split('T')[0]] = 0;
    }

    (events as any[]).forEach(event => {
        const date = (event.created_at as string).split('T')[0];
        if (counts[date] !== undefined) {
            counts[date]++;
        }
    });

    const result = Object.entries(counts)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json(result);
}
