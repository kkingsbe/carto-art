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

    // We can't use offset pagination efficiently for large datasets, 
    // but for < 100k rows with this volume, range-based or simple pagination is acceptable.
    // Given the hard 1000 row limit, we must paginate.

    // Optimize: Count first if too large? 
    // For this dashboard, we need all timestamps for the graph.
    // We will loop until we get < PAGE_SIZE or hit the end of our time window (implicit in query)

    while (hasMore) {
        let query = supabase
            .from('page_events')
            .select('created_at')
            .gte('created_at', startDate.toISOString())
            .order('created_at', { ascending: true })
            .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

        if (eventType !== 'all') {
            query = query.eq('event_type', eventType);
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

        // Safety Break: Stop if we somehow fetch excessively (>100k) to prevent OOM
        if (allEvents.length > 100000) {
            console.warn('Analytics: truncated at 100k events');
            break;
        }
    }

    const events = allEvents;

    // Grouping logic
    const counts: Record<string, number> = {};

    if (isSubDaily) {
        const intervalMs = intervalMinutes * 60 * 1000;
        const now = new Date();
        // Round down current time to nearest interval
        const roundedNow = Math.floor(now.getTime() / intervalMs) * intervalMs;

        // Initialize buckets
        const minutesToCover = days * 24 * 60;
        const numBuckets = Math.ceil(minutesToCover / intervalMinutes);

        for (let i = 0; i <= numBuckets; i++) {
            const t = new Date(roundedNow - (i * intervalMs));
            counts[t.toISOString()] = 0;
        }

        console.log(`[ActivityStats] Fetching ${days} days (sub-daily). Found ${events?.length} events.`);

        (events as any[]).forEach(event => {
            const t = new Date(event.created_at).getTime();
            const rounded = Math.floor(t / intervalMs) * intervalMs;
            const key = new Date(rounded).toISOString();

            // If key doesn't exist (e.g. slight future skew), initialize it
            if (counts[key] === undefined) {
                counts[key] = 0;
            }
            counts[key]++;
        });
    } else {
        // Initialize last X days with 0
        for (let i = 0; i <= days; i++) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            counts[d.toISOString().split('T')[0]] = 0;
        }

        console.log(`[ActivityStats] Fetching ${days} days (daily). Found ${events?.length} events.`);

        (events as any[]).forEach(event => {
            const date = (event.created_at as string).split('T')[0];
            if (counts[date] === undefined) {
                counts[date] = 0;
            }
            counts[date]++;
        });
    }

    const result = Object.entries(counts)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json(result);
}
