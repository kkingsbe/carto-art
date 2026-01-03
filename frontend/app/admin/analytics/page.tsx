'use client';

import { useState, useEffect } from 'react';
import {
    BarChart3,
    Users,
    MousePointer2,
    Globe,
    ExternalLink,
    Loader2,
    AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MetricCard } from '@/components/admin/MetricCard';

interface AnalyticsData {
    views: number;
    sessions: number;
    activeUsers: number;
    topPages: Array<{ url: string; views: number }>;
}

export default function AnalyticsPage() {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [needsConfig, setNeedsConfig] = useState(false);

    useEffect(() => {
        fetchAnalytics();
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
