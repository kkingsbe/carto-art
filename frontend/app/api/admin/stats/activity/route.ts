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
    const isHourly = days <= 1;

    const supabase = await createClient();
    const startDate = new Date();
    const hoursToFetch = Math.round(days * 24);

    if (isHourly) {
        startDate.setHours(startDate.getHours() - hoursToFetch);
    } else {
        startDate.setDate(startDate.getDate() - days);
    }

    // Fetch events in the last period
    let query = supabase
        .from('page_events')
        .select('created_at')
        .gte('created_at', startDate.toISOString());

    if (eventType !== 'all') {
        query = query.eq('event_type', eventType);
    }

    const { data: events, error } = await query
        .order('created_at', { ascending: true });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Grouping logic
    const counts: Record<string, number> = {};

    if (isHourly) {
        // Initialize last X hours with 0
        for (let i = 0; i < hoursToFetch; i++) {
            const d = new Date();
            d.setHours(d.getHours() - i, 0, 0, 0);
            counts[d.toISOString()] = 0;
        }

        (events as any[]).forEach(event => {
            const date = new Date(event.created_at);
            date.setMinutes(0, 0, 0);
            const key = date.toISOString();
            if (counts[key] !== undefined) {
                counts[key]++;
            }
        });
    } else {
        // Initialize last X days with 0
        for (let i = 0; i <= days; i++) {
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
    }

    const result = Object.entries(counts)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json(result);
}
