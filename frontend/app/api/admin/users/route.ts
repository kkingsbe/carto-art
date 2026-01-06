import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { ensureAdmin } from '@/lib/admin-auth';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        await ensureAdmin();
        const supabase = createServiceRoleClient();
        const [
            { data: profilesData, error: profileError },
            { data: mapsData },
            { data: exportEventsData }
        ] = await Promise.all([
            supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false }),
            supabase
                .from('maps')
                .select('user_id'),
            supabase
                .from('page_events')
                .select('user_id, metadata')
                .eq('event_type', 'poster_export')
        ]);

        if (profileError) throw profileError;

        const profiles = profilesData as any[];
        const maps = mapsData as any[];
        const exportEvents = exportEventsData as any[];

        // Aggregate saved projects (maps) count by user
        const mapCounts = (maps || []).reduce((acc: Record<string, number>, map: any) => {
            if (map.user_id) {
                acc[map.user_id] = (acc[map.user_id] || 0) + 1;
            }
            return acc;
        }, {});

        // Aggregate export stats by user
        const exportStats = (exportEvents || []).reduce((acc: Record<string, { count: number, formats: Record<string, number> }>, event: any) => {
            if (!event.user_id) return acc;

            if (!acc[event.user_id]) {
                acc[event.user_id] = { count: 0, formats: {} };
            }

            acc[event.user_id].count++;

            // Extract format (resolution name)
            const metadata = event.metadata as any;
            const format = metadata?.resolution?.name || 'Unknown';

            acc[event.user_id].formats[format] = (acc[event.user_id].formats[format] || 0) + 1;

            return acc;
        }, {});

        // Enrich profiles with stats
        const users = (profiles || []).map((profile: any) => {
            const stats = exportStats[profile.id] || { count: 0, formats: {} };

            // Find top export format
            let topFormat = 'None';
            let maxCount = 0;

            Object.entries(stats.formats).forEach(([format, count]) => {
                if ((count as number) > maxCount) {
                    maxCount = count as number;
                    topFormat = format;
                }
            });

            return {
                ...profile,
                saved_projects_count: mapCounts[profile.id] || 0,
                total_exports: stats.count,
                top_export_format: maxCount > 0 ? topFormat : null
            };
        });

        return NextResponse.json({ users });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 403 });
    }
}
