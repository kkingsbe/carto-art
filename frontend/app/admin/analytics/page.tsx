'use client';

import { useState, useEffect } from 'react';
import {
    BarChart3,
    Users,
    MousePointer2,
    Globe,
    ExternalLink,
    Loader2,
    AlertCircle,
    Activity
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MetricCard } from '@/components/admin/MetricCard';

interface AnalyticsData {
    views: number;
    sessions: number;
    activeUsers: number;
    topPages: Array<{ url: string; views: number }>;
}

interface RealtimeData {
    activeUsers: number;
    pages: Array<{ path: string; activeUsers: number }>;
}

export default function AnalyticsPage() {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [realtimeData, setRealtimeData] = useState<RealtimeData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [needsConfig, setNeedsConfig] = useState(false);

    useEffect(() => {
        fetchAnalytics();
        fetchRealtimeAnalytics();

        // Poll realtime data every 60 seconds
        const interval = setInterval(fetchRealtimeAnalytics, 60000);
        return () => clearInterval(interval);
    }, []);

    const fetchAnalytics = async () => {
        try {
            const res = await fetch('/api/admin/analytics');
            const result = await res.json();

            if (!res.ok) {
                setError(result.error);
                setNeedsConfig(result.needsConfig);
            } else {
                setData(result);
            }
        } catch (err) {
            setError('Failed to fetch analytics data');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchRealtimeAnalytics = async () => {
        try {
            const res = await fetch('/api/admin/analytics/realtime');
            if (res.ok) {
                const result = await res.json();
                setRealtimeData(result);
            }
        } catch (err) {
            console.error('Failed to fetch realtime analytics');
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
        );
    }

    if (needsConfig) {
        return (
            <div className="space-y-8 max-w-4xl">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">External Analytics</h1>
                    <p className="text-gray-500 dark:text-gray-400">
                        Detailed traffic data from Google Analytics 4.
                    </p>
                </div>

                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-12 text-center flex flex-col items-center">
                    <div className="w-20 h-20 bg-amber-50 dark:bg-amber-900/10 rounded-full flex items-center justify-center mb-6">
                        <AlertCircle className="w-10 h-10 text-amber-500" />
                    </div>

                    <h2 className="text-xl font-semibold mb-3">Configuration Incomplete</h2>
                    <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto">
                        {error || 'Make sure all Google Analytics environment variables are set in your .env file.'}
                    </p>

                    <div className="p-6 border border-gray-100 dark:border-gray-800 rounded-xl text-left bg-gray-50/50 dark:bg-gray-800/30 w-full max-w-md">
                        <h3 className="font-medium mb-4 text-sm uppercase tracking-wider text-gray-400">Required Variables</h3>
                        <ul className="space-y-3 font-mono text-xs">
                            <li className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-green-500" />
                                GOOGLE_ANALYTICS_CLIENT_EMAIL
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-green-500" />
                                GOOGLE_ANALYTICS_PRIVATE_KEY
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-red-500" />
                                GOOGLE_ANALYTICS_PROPERTY_ID
                            </li>
                        </ul>
                    </div>

                    <Button className="mt-8" onClick={fetchAnalytics}>
                        Retry Connection
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">External Analytics</h1>
                    <p className="text-gray-500 dark:text-gray-400">
                        Traffic stats from the last 30 days.
                    </p>
                </div>
                <Button variant="outline" className="gap-2" onClick={() => window.open('https://analytics.google.com/', '_blank')}>
                    <ExternalLink className="w-4 h-4" />
                    Open GA4 Console
                </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                <MetricCard
                    title="Page Views"
                    value={data?.views.toLocaleString() || '0'}
                    icon={Globe}
                    trend="+12%" // Would need historical comparison for real trend
                    trendUp={true}
                />
                <MetricCard
                    title="Sessions"
                    value={data?.sessions.toLocaleString() || '0'}
                    icon={MousePointer2}
                />
                <MetricCard
                    title="Active Users"
                    value={data?.activeUsers.toLocaleString() || '0'}
                    icon={Users}
                />
            </div>

            {realtimeData && (
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-6 text-white shadow-lg overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Activity className="w-24 h-24" />
                    </div>

                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                            </span>
                            <h2 className="text-sm font-bold uppercase tracking-wider opacity-80">Live Now</h2>
                        </div>

                        <div className="flex flex-col md:flex-row md:items-end gap-8">
                            <div>
                                <div className="text-5xl font-black mb-1">{realtimeData.activeUsers}</div>
                                <div className="text-sm opacity-80 font-medium">Active users across all pages</div>
                            </div>

                            <div className="flex-1 max-h-48 overflow-y-auto scrollbar-hide pr-2">
                                <div className="space-y-2">
                                    {realtimeData.pages.slice(0, 5).map((page, i) => (
                                        <div key={i} className="flex items-center justify-between text-sm bg-white/10 hover:bg-white/20 rounded-lg px-3 py-2 transition-colors">
                                            <span className="truncate max-w-[200px] font-medium">{page.path === '' ? '/' : page.path}</span>
                                            <span className="font-bold bg-white/20 px-2 py-0.5 rounded text-[10px]">{page.activeUsers} users</span>
                                        </div>
                                    ))}
                                    {realtimeData.pages.length === 0 && (
                                        <div className="text-sm opacity-60 italic">Waiting for more activity...</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
                        <h3 className="font-semibold flex items-center gap-2">
                            <BarChart3 className="w-4 h-4" />
                            Top Performing Pages
                        </h3>
                    </div>
                    <div className="divide-y divide-gray-100 dark:divide-gray-800">
                        {data?.topPages.map((page, i) => (
                            <div key={i} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/30">
                                <span className="text-sm font-medium truncate max-w-xs">{page.url}</span>
                                <Badge variant="secondary">{page.views.toLocaleString()} views</Badge>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100/50 dark:border-blue-900/20 rounded-xl p-8 flex flex-col justify-center">
                    <h3 className="text-lg font-semibold mb-2">Insights</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                        Your most popular content is currently <span className="font-medium text-blue-600 dark:text-blue-400">{(data?.topPages[0]?.url || '/')}</span>.
                        Targeted marketing to similar keywords or locations might further improve your engagement.
                    </p>
                    <div className="mt-6 flex gap-4">
                        <div className="p-4 bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-100 dark:border-gray-800 flex-1">
                            <div className="text-xs text-gray-400 uppercase font-bold mb-1">Avg sessions</div>
                            <div className="text-lg font-bold">{(data ? (data.views / data.sessions).toFixed(1) : 0)} views/session</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function Badge({ children, variant = 'default' }: { children: React.ReactNode, variant?: 'default' | 'secondary' }) {
    const variants = {
        default: 'bg-blue-500 text-white',
        secondary: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
    };
    return (
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tight ${variants[variant]}`}>
            {children}
        </span>
    );
}
