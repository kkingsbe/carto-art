import { isAdmin } from '@/lib/admin-auth';
import { createClient } from '@/lib/supabase/server';
import { MetricCard } from '@/components/admin/MetricCard';
import { ActivityChart } from '@/components/admin/ActivityChart';
import {
    Users,
    Map as MapIcon,
    Zap,
    MessageSquare,
    TrendingUp,
    Download,
    Share2,
    Key
} from 'lucide-react';
import { RecentActivityFeed } from '@/components/admin/RecentActivityFeed';

export default async function AdminDashboardPage() {
    const supabase = await createClient();

    // Fetch baseline stats
    const [
        { count: totalUsers },
        { count: totalMaps },
        { count: totalApiUsage },
        { count: totalFeedback },
        { count: totalExports },
        { count: publishedMaps },
        { count: activeApiKeys },
        { data: recentEvents }
    ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('maps').select('*', { count: 'exact', head: true }),
        supabase.from('api_usage').select('*', { count: 'exact', head: true }),
        supabase.from('feedback').select('*', { count: 'exact', head: true }),
        supabase.from('page_events').select('*', { count: 'exact', head: true }).eq('event_type', 'poster_export'),
        supabase.from('maps').select('*', { count: 'exact', head: true }).eq('is_published', true),
        supabase.from('api_keys').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase
            .from('page_events')
            .select(`
                *,
                profiles:user_id (
                    username,
                    display_name
                )
            `)
            .order('created_at', { ascending: false })
            .limit(5)
    ]);

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Dashboard Overview</h1>
                <p className="text-gray-500 dark:text-gray-400">
                    Real-time metrics and platform status.
                </p>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <MetricCard
                    title="Total Users"
                    value={totalUsers?.toLocaleString() || '0'}
                    icon={Users}
                />
                <MetricCard
                    title="Total Maps"
                    value={totalMaps?.toLocaleString() || '0'}
                    icon={MapIcon}
                />
                <MetricCard
                    title="Published Maps"
                    value={publishedMaps?.toLocaleString() || '0'}
                    icon={Share2}
                />
                <MetricCard
                    title="Total Exports"
                    value={totalExports?.toLocaleString() || '0'}
                    icon={Download}
                />
                <MetricCard
                    title="API Requests"
                    value={totalApiUsage?.toLocaleString() || '0'}
                    icon={Zap}
                />
                <MetricCard
                    title="Active API Keys"
                    value={activeApiKeys?.toLocaleString() || '0'}
                    icon={Key}
                />
                <MetricCard
                    title="Feedback"
                    value={totalFeedback?.toLocaleString() || '0'}
                    icon={MessageSquare}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                {/* Analytics Section */}
                <div className="lg:col-span-2">
                    <ActivityChart />
                </div>

                {/* Activity Feed Section */}
                <div className="space-y-6">
                    <RecentActivityFeed initialEvents={recentEvents || []} />
                </div>
            </div>
        </div>
    );
}
