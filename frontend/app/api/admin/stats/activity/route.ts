import { createClient } from '@/lib/supabase/server';
import { isAdmin } from '@/lib/admin-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    if (!(await isAdmin())) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const eventType = searchParams.get('type') || 'all';
    const days = parseFloat(searchParams.get('days') || '30');

    // Determine interval in minutes
    // <= 0.25 days (6h) -> 15 min
    // <= 1.0 days (24h) -> 30 min
    // > 1.0 days -> Daily (handled by else block)
    let intervalMinutes = 1440;
    if (days <= 0.25) intervalMinutes = 15;
    else if (days <= 1.0) intervalMinutes = 30;

    const isUniqueView = eventType === 'unique_page_view';
    const isSubDaily = days <= 1;

    const supabase = await createClient();
    const startDate = new Date();

    // Calculate start date based on exact time needed
    const msToFetch = days * 24 * 60 * 60 * 1000;
    startDate.setTime(startDate.getTime() - msToFetch);

    // Fetch events in the last period with pagination
    let allEvents: any[] = [];
    let page = 0;
    const PAGE_SIZE = 1000;
    let hasMore = true;

    while (hasMore) {
        let query;

        if (eventType === 'api_request') {
            query = supabase
                .from('api_usage')
                .select('created_at')
                .gte('created_at', startDate.toISOString())
                .order('created_at', { ascending: true })
                .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
        } else if (eventType === 'user_signup' || eventType === 'total_users') {
            query = supabase
                .from('profiles')
                .select('created_at')
                .gte('created_at', startDate.toISOString())
                .order('created_at', { ascending: true })
                .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
        } else {
            // Updated to fetch user_id and session_id for uniqueness tracking
            query = supabase
                .from('page_events')
                .select('created_at, user_id, session_id')
                .gte('created_at', startDate.toISOString())
                .order('created_at', { ascending: true })
                .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

            if (eventType !== 'all' && !isUniqueView) {
                query = query.eq('event_type', eventType);
            } else if (isUniqueView) {
                query = query.eq('event_type', 'page_view');
            }
        }

        const { data: events, error } = await query;

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        if (events) {
            allEvents = allEvents.concat(events);
            if (events.length < PAGE_SIZE) {
                hasMore = false;
            } else {
                page++;
            }
        } else {
            hasMore = false;
        }

        if (allEvents.length > 100000) {
            console.warn('Analytics: truncated at 100k events');
            break;
        }
    }

    const events = allEvents;

    // Grouping logic
    const counts: Record<string, number> = {};
    const uniqueIdentifiersPerBucket: Record<string, Set<string>> = {};

    if (isSubDaily) {
        const intervalMs = intervalMinutes * 60 * 1000;
        const now = new Date();
        const roundedNow = Math.floor(now.getTime() / intervalMs) * intervalMs;
        const minutesToCover = days * 24 * 60;
        const numBuckets = Math.ceil(minutesToCover / intervalMinutes);

        for (let i = 0; i <= numBuckets; i++) {
            const t = new Date(roundedNow - (i * intervalMs));
            const key = t.toISOString();
            counts[key] = 0;
            if (isUniqueView) {
                uniqueIdentifiersPerBucket[key] = new Set();
            }
        }

        (events as any[]).forEach(event => {
            const t = new Date(event.created_at).getTime();
            const rounded = Math.floor(t / intervalMs) * intervalMs;
            const key = new Date(rounded).toISOString();

            if (counts[key] === undefined) {
                counts[key] = 0;
                if (isUniqueView) uniqueIdentifiersPerBucket[key] = new Set();
            }

            if (isUniqueView) {
                const id = event.user_id || event.session_id || 'anon';
                uniqueIdentifiersPerBucket[key].add(id);
            } else {
                counts[key]++;
            }
        });

        if (isUniqueView) {
            Object.keys(counts).forEach(key => {
                counts[key] = uniqueIdentifiersPerBucket[key].size;
            });
        }
    } else {
        for (let i = 0; i <= days; i++) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const date = d.toISOString().split('T')[0];
            counts[date] = 0;
            if (isUniqueView) {
                uniqueIdentifiersPerBucket[date] = new Set();
            }
        }

        (events as any[]).forEach(event => {
            const date = (event.created_at as string).split('T')[0];
            if (counts[date] === undefined) {
                counts[date] = 0;
                if (isUniqueView) uniqueIdentifiersPerBucket[date] = new Set();
            }

            if (isUniqueView) {
                const id = event.user_id || event.session_id || 'anon';
                uniqueIdentifiersPerBucket[date].add(id);
            } else {
                counts[date]++;
            }
        });

        if (isUniqueView) {
            Object.keys(counts).forEach(key => {
                counts[key] = uniqueIdentifiersPerBucket[key].size;
            });
        }
    }

    const result = Object.entries(counts)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));

    if (eventType === 'total_users') {
        const { count: initialCount } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .lt('created_at', startDate.toISOString());

        let runningTotal = initialCount || 0;

        for (const point of result) {
            runningTotal += point.count;
            point.count = runningTotal;
        }
    }

    return NextResponse.json(result);
}
