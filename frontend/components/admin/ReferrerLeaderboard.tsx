'use client';

import { useState, useEffect } from 'react';
import { Globe, TrendingUp, Loader2, ExternalLink } from 'lucide-react';

interface ReferrerSource {
    source: string;
    users: number;
    percentage: number;
}

interface LeaderboardData {
    sources: ReferrerSource[];
    utm_sources: ReferrerSource[];
    total_users: number;
}

const TIME_RANGES = [
    { label: '7d', value: 7 },
    { label: '30d', value: 30 },
    { label: 'All', value: 0 },
] as const;

export function ReferrerLeaderboard() {
    const [data, setData] = useState<LeaderboardData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [days, setDays] = useState(30);

    useEffect(() => {
        fetchData();
    }, [days]);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const res = await fetch(`/api/admin/stats/referrers?days=${days}`);
            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || 'Failed to fetch');
            }
            const result = await res.json();
            setData(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load data');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-8">
                <div className="flex items-center justify-center h-48">
                    <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-8">
                <div className="text-center text-gray-500">
                    <p>{error}</p>
                    <button onClick={fetchData} className="mt-2 text-blue-500 hover:underline text-sm">
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    const sources = data?.sources || [];
    const maxUsers = Math.max(...sources.map(s => s.users), 1);

    return (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-blue-500" />
                    <h3 className="font-semibold">Acquisition Sources</h3>
                    <span className="text-xs text-gray-400 ml-2">
                        {data?.total_users.toLocaleString()} users
                    </span>
                </div>
                <div className="flex gap-1">
                    {TIME_RANGES.map((range) => (
                        <button
                            key={range.value}
                            onClick={() => setDays(range.value)}
                            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${days === range.value
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                                }`}
                        >
                            {range.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Leaderboard */}
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {sources.length === 0 ? (
                    <div className="px-6 py-8 text-center text-gray-400 text-sm">
                        No referrer data available yet
                    </div>
                ) : (
                    sources.slice(0, 10).map((source, i) => (
                        <div key={source.source} className="px-6 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                            <div className="flex items-center gap-4">
                                {/* Rank */}
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                        i === 1 ? 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' :
                                            i === 2 ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                                                'bg-gray-50 text-gray-500 dark:bg-gray-800/50 dark:text-gray-500'
                                    }`}>
                                    {i + 1}
                                </div>

                                {/* Source name and bar */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="font-medium text-sm truncate max-w-[200px] flex items-center gap-1">
                                            {source.source}
                                            {source.source !== 'Direct / Unknown' && (
                                                <ExternalLink className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100" />
                                            )}
                                        </span>
                                        <div className="flex items-center gap-2 text-xs">
                                            <span className="font-bold">{source.users.toLocaleString()}</span>
                                            <span className="text-gray-400">({source.percentage}%)</span>
                                        </div>
                                    </div>
                                    {/* Progress bar */}
                                    <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all duration-500"
                                            style={{ width: `${(source.users / maxUsers) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* UTM Sources (if available) */}
            {data?.utm_sources && data.utm_sources.length > 0 && (
                <>
                    <div className="px-6 py-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="w-3.5 h-3.5 text-green-500" />
                            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">UTM Sources</span>
                        </div>
                    </div>
                    <div className="px-6 py-3 flex flex-wrap gap-2">
                        {data.utm_sources.map((utm) => (
                            <span
                                key={utm.source}
                                className="px-2.5 py-1 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-xs font-medium rounded-full"
                            >
                                {utm.source}: {utm.users}
                            </span>
                        ))}
                    </div>
                </>
            )}

            {/* Insights footer */}
            <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-blue-50/30 dark:bg-blue-900/5">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                    <span className="font-medium text-gray-700 dark:text-gray-300">Tip:</span> Add{' '}
                    <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-[10px]">?utm_source=X</code>{' '}
                    to your marketing links to track campaign performance.
                </p>
            </div>
        </div>
    );
}
