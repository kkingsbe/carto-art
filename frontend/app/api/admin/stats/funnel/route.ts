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
            { count: viewedEditor },
            { count: createdMap },
            { count: publishedMap },
            { count: exportedPoster }
        ] = await Promise.all([
            supabase.from('profiles').select('*', { count: 'exact', head: true }),
            supabase.from('profiles').select('*', { count: 'exact', head: true }).not('first_view_editor_at', 'is', null),
            supabase.from('profiles').select('*', { count: 'exact', head: true }).not('first_map_at', 'is', null),
            supabase.from('profiles').select('*', { count: 'exact', head: true }).not('first_publish_at', 'is', null),
            supabase.from('profiles').select('*', { count: 'exact', head: true }).not('first_export_at', 'is', null)
        ]);

        // Calculate time metrics (avg time between steps)
        // We need to fetch actual data for this, not just counts
        // Taking a sample of recent activated users to keep it fast
        const { data: recentUsersData } = await supabase
            .from('profiles')
            .select('created_at, first_view_editor_at, first_map_at, first_publish_at')
            .not('first_map_at', 'is', null)
            .order('created_at', { ascending: false })
            .limit(100);

        // Cast to any to avoid typescript inference issues with the new columns
        const recentUsers = recentUsersData as any[];

        const calculateAvgTime = (start: string | null, end: string | null) => {
            if (!start || !end) return 0;
            const diff = new Date(end).getTime() - new Date(start).getTime();
            return diff > 0 ? diff / 1000 / 60 : 0; // minutes
        };

        let avgSignupToEditor = 0;
        let avgEditorToMap = 0;

        if (recentUsers && recentUsers.length > 0) {
            const signupToEditorTimes = recentUsers
                .filter(u => u.first_view_editor_at)
                .map(u => calculateAvgTime(u.created_at, u.first_view_editor_at));

            const editorToMapTimes = recentUsers
                .filter(u => u.first_view_editor_at && u.first_map_at)
                .map(u => calculateAvgTime(u.first_view_editor_at, u.first_map_at));

            avgSignupToEditor = signupToEditorTimes.length ? signupToEditorTimes.reduce((a, b) => a + b, 0) / signupToEditorTimes.length : 0;
            avgEditorToMap = editorToMapTimes.length ? editorToMapTimes.reduce((a, b) => a + b, 0) / editorToMapTimes.length : 0;
        }

        const safeTotal = totalSignups || 1;

        const funnelData = [
            {
                step: 'Signup',
                count: totalSignups || 0,
                percentage: 100,
                dropOff: 0,
                avgTimeNext: avgSignupToEditor
            },
            {
                step: 'Viewed Editor',
                count: viewedEditor || 0,
                percentage: Math.round(((viewedEditor || 0) / safeTotal) * 100),
                dropOff: Math.round(((safeTotal - (viewedEditor || 0)) / safeTotal) * 100),
                avgTimeNext: avgEditorToMap
            },
            {
                step: 'Created Map',
                count: createdMap || 0,
                percentage: Math.round(((createdMap || 0) / safeTotal) * 100),
                dropOff: Math.round((((viewedEditor || 0) - (createdMap || 0)) / (viewedEditor || 1)) * 100)
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
