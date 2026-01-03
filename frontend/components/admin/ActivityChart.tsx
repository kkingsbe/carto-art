'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area
} from 'recharts';
import { Loader2 } from 'lucide-react';

interface ActivityPoint {
    date: string;
    count?: number;
    value?: number;
}

const METRICS = [
    { id: 'all', label: 'Total Activity', color: '#3b82f6' },
    { id: 'page_view', label: 'Views', color: '#10b981' },
    { id: 'poster_export', label: 'Exports', color: '#f59e0b' },
    { id: 'api_request', label: 'API Requests', color: '#06b6d4' },
    { id: 'search_location', label: 'Searches', color: '#8b5cf6' },
    { id: 'style_change', label: 'Styles', color: '#ec4899' },
    { id: 'generation_latency', label: 'Generation Latency', color: '#ef4444' },
    { id: 'search_latency', label: 'Search Latency', color: '#f97316' },
];

const TIMEFRAMES = [
    { id: '0.25', label: '6 Hours' },
    { id: '1', label: '24 Hours' },
    { id: '7', label: '7 Days' },
    { id: '30', label: '30 Days' },
    { id: '90', label: '90 Days' },
];

export function ActivityChart() {
    const [data, setData] = useState<ActivityPoint[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedType, setSelectedType] = useState('all');
    const [selectedDays, setSelectedDays] = useState('1');
    const supabase = createClient();

    useEffect(() => {
        const fetchData = async (showLoading = true) => {
            if (showLoading) {
                setIsLoading(true);
            }
            try {
                // Determine if this is a latency metric
                const isLatencyMetric = selectedType === 'generation_latency' || selectedType === 'search_latency';

                let res;
                if (isLatencyMetric) {
                    // Map to API type
                    const latencyType = selectedType === 'generation_latency' ? 'generation' : 'search';
                    res = await fetch(`/api/admin/stats/latency?type=${latencyType}&days=${selectedDays}`);
                } else {
                    res = await fetch(`/api/admin/stats/activity?type=${selectedType}&days=${selectedDays}`);
                }

                if (res.ok) {
                    const stats = await res.json();
                    setData(stats);
                }
            } catch (err) {
                console.error('Failed to fetch activity stats');
            } finally {
                if (showLoading) {
                    setIsLoading(false);
                }
            }
        };

        fetchData();

        // Set up realtime subscriptions
        const pageEventsChannel = supabase
            .channel('page_events_activity')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'page_events'
                },
                async (payload) => {
                    // Refetch if the event type matches our filter, or if we're showing all
                    const isRelevantEvent = selectedType === 'all' || payload.new.event_type === selectedType;

                    // Special case: generation_latency now comes from both api_usage AND page_events (poster_export)
                    const isUiGenerationLatency = selectedType === 'generation_latency' && payload.new.event_type === 'poster_export';

                    if (isRelevantEvent || isUiGenerationLatency) {
                        console.log('ActivityChart: New page event detected, refetching data');
                        await fetchData(false);
                    }
                }
            )
            .subscribe();

        const apiUsageChannel = supabase
            .channel('api_usage_activity')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'api_usage'
                },
                async () => {
                    // Refetch if viewing generation latency or 'all' (if 'all' includes API usage)
                    // In current implementation 'all' comes from page_events, but generation_latency 
                    // comes from api_usage.
                    if (selectedType === 'all' || selectedType === 'generation_latency') {
                        console.log('ActivityChart: New API usage detected, refetching data');
                        await fetchData(false);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(pageEventsChannel);
            supabase.removeChannel(apiUsageChannel);
        };
    }, [selectedType, selectedDays]);

    const activeColor = METRICS.find(m => m.id === selectedType)?.color || '#3b82f6';
    const isHourly = parseFloat(selectedDays) <= 1;
    const isLatencyMetric = selectedType === 'generation_latency' || selectedType === 'search_latency';

    return (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
                <div>
                    <h3 className="text-sm font-semibold flex items-center gap-2 mb-1">
                        Platform Activity
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        {isHourly
                            ? (selectedDays === '0.25' ? 'Last 6 hours (hourly)' : 'Last 24 hours (hourly)')
                            : `Last ${selectedDays} days (daily)`}
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    {/* Metric Selector */}
                    <div className="flex p-1 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-800">
                        {METRICS.map((metric) => (
                            <button
                                key={metric.id}
                                onClick={() => setSelectedType(metric.id)}
                                className={`px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-tight rounded-md transition-all ${selectedType === metric.id
                                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm ring-1 ring-gray-200 dark:ring-gray-600'
                                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                    }`}
                            >
                                {metric.label}
                            </button>
                        ))}
                    </div>

                    {/* Timeframe Selector */}
                    <div className="flex p-1 bg-blue-50/50 dark:bg-blue-900/10 rounded-lg border border-blue-100/50 dark:border-blue-800/20">
                        {TIMEFRAMES.map((tf) => (
                            <button
                                key={tf.id}
                                onClick={() => setSelectedDays(tf.id)}
                                className={`px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-tight rounded-md transition-all ${selectedDays === tf.id
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'text-blue-600/60 hover:text-blue-600 dark:text-blue-400/60 dark:hover:text-blue-400'
                                    }`}
                            >
                                {tf.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {isLoading ? (
                <div className="h-[300px] flex items-center justify-center bg-gray-50/30 dark:bg-gray-800/10 rounded-lg">
                    <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                </div>
            ) : (
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data}>
                            <defs>
                                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={activeColor} stopOpacity={0.1} />
                                    <stop offset="95%" stopColor={activeColor} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888820" />
                            <XAxis
                                dataKey="date"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 10, fill: '#888' }}
                                minTickGap={30}
                                tickFormatter={(str) => {
                                    const date = new Date(str);
                                    if (isHourly) {
                                        return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false });
                                    }
                                    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                                }}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 10, fill: '#888' }}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'white',
                                    borderRadius: '8px',
                                    border: '1px solid #e5e7eb',
                                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                                    fontSize: '12px'
                                }}
                                itemStyle={{ color: activeColor, fontWeight: 600 }}
                                labelStyle={{ color: '#6b7280', marginBottom: '4px' }}
                                labelFormatter={(label) => {
                                    const date = new Date(label);
                                    if (isHourly) {
                                        return date.toLocaleString(undefined, {
                                            month: 'short',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        });
                                    }
                                    return date.toLocaleDateString(undefined, {
                                        month: 'long',
                                        day: 'numeric',
                                        year: 'numeric'
                                    });
                                }}
                                formatter={(value: any) => {
                                    if (isLatencyMetric) {
                                        return [`${value} ms`, 'Avg Latency'];
                                    }
                                    return [value, 'Count'];
                                }}
                            />
                            <Area
                                type="monotone"
                                dataKey={isLatencyMetric ? "value" : "count"}
                                stroke={activeColor}
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#colorCount)"
                                animationDuration={500}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
}
