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

        // Fetch counts for each funnel step
        // We use the new first_* columns on profiles table

        const [
            { count: totalSignups },
            { count: createdMap },
            { count: publishedMap },
            { count: exportedPoster }
        ] = await Promise.all([
            supabase.from('profiles').select('*', { count: 'exact', head: true }),
            supabase.from('profiles').select('*', { count: 'exact', head: true }).not('first_map_at', 'is', null),
            supabase.from('profiles').select('*', { count: 'exact', head: true }).not('first_publish_at', 'is', null),
            supabase.from('profiles').select('*', { count: 'exact', head: true }).not('first_export_at', 'is', null)
        ]);

        const safeTotal = totalSignups || 1;

        const funnelData = [
            {
                step: 'Signup',
                count: totalSignups || 0,
                percentage: 100,
                dropOff: 0
            },
            {
                step: 'Created Map',
                count: createdMap || 0,
                percentage: Math.round(((createdMap || 0) / safeTotal) * 100),
                dropOff: Math.round(((safeTotal - (createdMap || 0)) / safeTotal) * 100)
            },
            {
                step: 'Published Map',
                count: publishedMap || 0,
                percentage: Math.round(((publishedMap || 0) / safeTotal) * 100),
                dropOff: Math.round((((createdMap || 0) - (publishedMap || 0)) / (createdMap || 1)) * 100)
            },
            {
                step: 'Exported Poster',
                count: exportedPoster || 0,
                percentage: Math.round(((exportedPoster || 0) / safeTotal) * 100),
                dropOff: Math.round((((createdMap || 0) - (exportedPoster || 0)) / (createdMap || 1)) * 100)
            }
        ];

        return NextResponse.json(funnelData);

    } catch (error) {
        console.error('Funnel stats error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
