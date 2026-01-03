import { createClient } from '@/lib/supabase/server';
import { isAdmin } from '@/lib/admin-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    if (!(await isAdmin())) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const metricType = searchParams.get('type') || 'all'; // 'generation' | 'search' | 'all'
    const days = parseFloat(searchParams.get('days') || '30');

    // Determine interval in minutes
    let intervalMinutes = 1440;
    if (days <= 0.25) intervalMinutes = 15;
    else if (days <= 1.0) intervalMinutes = 30;

    const isSubDaily = days <= 1;

    const supabase = await createClient();
    const startDate = new Date();

    // Calculate start date based on exact time needed
    const msToFetch = days * 24 * 60 * 60 * 1000;
    startDate.setTime(startDate.getTime() - msToFetch);

    // Initialize counts structure
    const latencies: Record<string, { sum: number; count: number }> = {};

    if (isSubDaily) {
        const intervalMs = intervalMinutes * 60 * 1000;
        const now = new Date();
        const roundedNow = Math.floor(now.getTime() / intervalMs) * intervalMs;

        const minutesToCover = days * 24 * 60;
        const numBuckets = Math.ceil(minutesToCover / intervalMinutes);

        for (let i = 0; i <= numBuckets; i++) {
            const t = new Date(roundedNow - (i * intervalMs));
            latencies[t.toISOString()] = { sum: 0, count: 0 };
        }
    } else {
        // Initialize last X days with 0
        for (let i = 0; i <= days; i++) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            latencies[d.toISOString().split('T')[0]] = { sum: 0, count: 0 };
        }
    }

    // Fetch generation latency from api_usage AND page_events
    if (metricType === 'generation' || metricType === 'all') {
        const fetchGenerationLatency = async () => {
            // 1. Fetch from api_usage (API exports)
            let page = 0;
            const PAGE_SIZE = 1000;
            let hasMore = true;

            while (hasMore) {
                const { data: apiUsage, error } = await supabase
                    .from('api_usage')
                    .select('created_at, response_time_ms')
                    .gte('created_at', startDate.toISOString())
                    .not('response_time_ms', 'is', null)
                    .order('created_at', { ascending: true })
                    .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

                if (error) return { error };

                if (apiUsage && apiUsage.length > 0) {
                    apiUsage.forEach((record: any) => {
                        const timestamp = new Date(record.created_at).getTime();
                        let key: string;

                        if (isSubDaily) {
                            const intervalMs = intervalMinutes * 60 * 1000;
                            const rounded = Math.floor(timestamp / intervalMs) * intervalMs;
                            key = new Date(rounded).toISOString();
                        } else {
                            key = record.created_at.split('T')[0];
                        }

                        if (latencies[key] === undefined) {
                            latencies[key] = { sum: 0, count: 0 };
                        }

                        latencies[key].sum += record.response_time_ms;
                        latencies[key].count += 1;
                    });

                    if (apiUsage.length < PAGE_SIZE) hasMore = false;
                    else page++;
                } else hasMore = false;

                if (page > 100) break;
            }

            // 2. Fetch from page_events (UI exports)
            page = 0;
            hasMore = true;
            while (hasMore) {
                const { data: uiExports, error } = await supabase
                    .from('page_events')
                    .select('created_at, metadata')
                    .eq('event_type', 'poster_export')
                    .gte('created_at', startDate.toISOString())
                    .order('created_at', { ascending: true })
                    .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

                if (error) return { error };

                if (uiExports && uiExports.length > 0) {
                    uiExports.forEach((record: any) => {
                        const latencyMs = record.metadata?.render_time_ms;
                        if (latencyMs === null || latencyMs === undefined) return;

                        const timestamp = new Date(record.created_at).getTime();
                        let key: string;

                        if (isSubDaily) {
                            const intervalMs = intervalMinutes * 60 * 1000;
                            const rounded = Math.floor(timestamp / intervalMs) * intervalMs;
                            key = new Date(rounded).toISOString();
                        } else {
                            key = record.created_at.split('T')[0];
                        }

                        if (latencies[key] === undefined) {
                            latencies[key] = { sum: 0, count: 0 };
                        }

                        latencies[key].sum += latencyMs;
                        latencies[key].count += 1;
                    });

                    if (uiExports.length < PAGE_SIZE) hasMore = false;
                    else page++;
                } else hasMore = false;

                if (page > 100) break;
            }
            return {};
        };

        const { error } = await fetchGenerationLatency();
        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }
    }

    // Fetch search latency from page_events
    if (metricType === 'search' || metricType === 'all') {
        let page = 0;
        const PAGE_SIZE = 1000;
        let hasMore = true;

        while (hasMore) {
            const { data: pageEvents, error } = await supabase
                .from('page_events')
                .select('created_at, metadata')
                .eq('event_type', 'search_location')
                .gte('created_at', startDate.toISOString())
                .order('created_at', { ascending: true })
                .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

            if (error) {
                return NextResponse.json({ error: error.message }, { status: 500 });
            }

            if (pageEvents && pageEvents.length > 0) {
                pageEvents.forEach((record: any) => {
                    const latencyMs = record.metadata?.latency_ms;
                    if (latencyMs === null || latencyMs === undefined) return;

                    const timestamp = new Date(record.created_at).getTime();
                    let key: string;

                    if (isSubDaily) {
                        const intervalMs = intervalMinutes * 60 * 1000;
                        const rounded = Math.floor(timestamp / intervalMs) * intervalMs;
                        key = new Date(rounded).toISOString();
                    } else {
                        key = record.created_at.split('T')[0];
                    }

                    if (latencies[key] === undefined) {
                        latencies[key] = { sum: 0, count: 0 };
                    }

                    latencies[key].sum += latencyMs;
                    latencies[key].count += 1;
                });

                if (pageEvents.length < PAGE_SIZE) {
                    hasMore = false;
                } else {
                    page++;
                }
            } else {
                hasMore = false;
            }

            // Safety break
            if (page > 100) break;
        }
    }

    // Calculate averages and format for chart
    const result = Object.entries(latencies)
        .map(([date, { sum, count }]) => ({
            date,
            value: count > 0 ? Math.round(sum / count) : 0
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json(result);
}
