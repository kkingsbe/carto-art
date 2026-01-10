import { createClient } from '@/lib/supabase/server';
import { MetricCard } from '@/components/admin/MetricCard';
import {
    Users,
    Map as MapIcon,
    Zap,
    MessageSquare,
    Download,
    Share2,
    Key,
    Eye,
    Coffee,
    Sparkles
} from 'lucide-react';

export async function DashboardStats() {
    const supabase = await createClient();
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const [
        { count: totalUsers },
        { count: totalMaps },
        { count: totalApiUsage },
        { count: totalFeedback },
        { count: totalExports },
        { count: publishedMaps },
        { count: activeApiKeys },
        { count: views24h },
        { data: donationStats },
        subscribers
    ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('maps').select('*', { count: 'exact', head: true }),
        supabase.from('api_usage').select('*', { count: 'exact', head: true }),
        supabase.from('feedback').select('*', { count: 'exact', head: true }),
        supabase.from('page_events').select('*', { count: 'exact', head: true }).eq('event_type', 'poster_export'),
        supabase.from('maps').select('*', { count: 'exact', head: true }).eq('is_published', true),
        supabase.from('api_keys').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('page_events').select('*', { count: 'exact', head: true }).eq('event_type', 'page_view').gte('created_at', twentyFourHoursAgo),
        (supabase as any).from('donations').select('amount').eq('status', 'success'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('subscription_tier', 'carto_plus')
    ]);

    const bmacRevenue = (donationStats || []).reduce((sum: number, d: any) => sum + Number(d.amount), 0);
    const subscriberCount = subscribers?.count || 0;

    return (
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
                title="Views (24h)"
                value={views24h?.toLocaleString() || '0'}
                icon={Eye}
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
            <MetricCard
                title="Monthly Donations"
                value={new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(bmacRevenue || 0)}
                icon={Coffee}
                className="bg-yellow-50/30 dark:bg-yellow-900/10 border-yellow-100 dark:border-yellow-800"
            />
            <MetricCard
                title="Active Subscribers"
                value={subscriberCount.toLocaleString()}
                icon={Sparkles}
                className="bg-indigo-50/30 dark:bg-indigo-900/10 border-indigo-100 dark:border-indigo-800"
            />
        </div>
    );
}
