import { isAdmin } from '@/lib/admin-auth';
import { createClient } from '@/lib/supabase/server';
import { MetricCard } from '@/components/admin/MetricCard';
import { ActivityChart } from '@/components/admin/ActivityChart';
import Link from 'next/link';
import {
    Users,
    Map as MapIcon,
    Zap,
    MessageSquare,
    TrendingUp,
    Fingerprint,
    Download,
    Share2,
    Key
} from 'lucide-react';

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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Analytics Section */}
                <div className="lg:col-span-2">
                    <ActivityChart />
                </div>

                {/* Activity Feed Section */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 flex flex-col h-full">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-semibold flex items-center gap-2">
                                <Fingerprint className="w-4 h-4" />
                                Recent Activity
                            </h3>
                            <Link href="/admin/activity" className="text-xs text-blue-500 hover:underline">View All</Link>
                        </div>

                        <div className="space-y-6 flex-1">
                            {recentEvents && recentEvents.length > 0 ? (
                                recentEvents.map((event: any) => (
                                    <div key={event.id} className="flex gap-4">
                                        <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 shrink-0" />
                                        <div className="min-w-0">
                                            <p className="text-sm truncate">
                                                <span className="font-medium">
                                                    {event.profiles?.display_name || event.profiles?.username || 'Anonymous'}
                                                </span>
                                                {' '}{event.event_name?.toLowerCase() || event.event_type}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {new Date(event.created_at).toLocaleTimeString()}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-gray-500 text-center py-8">No recent activity</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
