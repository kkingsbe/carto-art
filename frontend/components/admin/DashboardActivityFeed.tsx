import { createClient } from '@/lib/supabase/server';
import { RecentActivityFeed } from '@/components/admin/RecentActivityFeed';

export async function DashboardActivityFeed() {
    const supabase = await createClient();

    const { data: recentEvents } = await supabase
        .from('page_events')
        .select(`
            *,
            profiles:user_id (
                username,
                display_name,
                avatar_url
            )
        `)
        .order('created_at', { ascending: false })
        .limit(20);

    return <RecentActivityFeed initialEvents={recentEvents || []} />;
}
