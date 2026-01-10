import { createClient } from '@/lib/supabase/server';
import { isAdmin } from '@/lib/admin-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    if (!(await isAdmin())) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');

    const supabase = await createClient();

    // Fetch saved maps
    const { data: maps, error: mapsError } = await supabase
        .from('maps')
        .select('id, title, config, created_at, is_published')
        .order('created_at', { ascending: false })
        .limit(limit);

    // Fetch exports from page_events
    const { data: events, error: eventsError } = await supabase
        .from('page_events')
        .select('id, event_type, metadata, created_at')
        .eq('event_type', 'poster_export')
        .order('created_at', { ascending: false })
        .limit(limit);

    if (mapsError || eventsError) {
        console.error('Error fetching data:', mapsError || eventsError);
        return NextResponse.json({ error: (mapsError || eventsError)?.message }, { status: 500 });
    }

    const mapResults = (maps || []).map((map: any) => {
        const config = typeof map.config === 'string' ? JSON.parse(map.config) : map.config;
        const center = config?.location?.center;

        if (!center || !Array.isArray(center) || center.length < 2) return null;

        return {
            id: map.id,
            title: map.title || 'Untitled Map',
            lat: center[1],
            lng: center[0],
            created_at: map.created_at,
            is_published: map.is_published,
            source: 'map'
        };
    }).filter(Boolean);

    const exportResults = (events || []).map((event: any) => {
        const metadata = typeof event.metadata === 'string' ? JSON.parse(event.metadata) : event.metadata;
        const coords = metadata?.location_coords;

        if (!coords || !Array.isArray(coords) || coords.length < 2) return null;

        return {
            id: event.id,
            title: metadata?.location_name || 'Exported Map',
            lat: coords[1],
            lng: coords[0],
            created_at: event.created_at,
            source: 'export'
        };
    }).filter(Boolean);

    return NextResponse.json([...mapResults, ...exportResults]);
}
