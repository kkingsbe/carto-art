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
import { MultiMetricSelector } from './MultiMetricSelector';

interface ActivityPoint {
    date: string;
    [key: string]: any; // Allow dynamic metric keys
}

const METRICS = [
    { id: 'all', label: 'Total Activity', color: '#3b82f6' },
    { id: 'page_view', label: 'Views', color: '#10b981' },
    { id: 'unique_page_view', label: 'Unique Views', color: '#6366f1' },
    { id: 'poster_export', label: 'Exports', color: '#f59e0b' },
    { id: 'api_request', label: 'API Requests', color: '#06b6d4' },
    { id: 'total_users', label: 'Total Users', color: '#8b5cf6' },
    { id: 'search_location', label: 'Searches', color: '#8b5cf6' },
    { id: 'style_change', label: 'Styles', color: '#ec4899' },
    { id: 'donations', label: 'Donations', color: '#facc15' },
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
    const [selectedTypes, setSelectedTypes] = useState<string[]>(['all']);
    const [selectedDays, setSelectedDays] = useState('1');
    const supabase = createClient();

    useEffect(() => {
        let abortController: AbortController | null = null;
        let debounceTimer: NodeJS.Timeout | null = null;

        const fetchData = async (showLoading = true) => {
            if (abortController) {
                abortController.abort();
            }
            abortController = new AbortController();

            if (showLoading) {
                setIsLoading(true);
            }

            try {
                if (selectedTypes.length === 0) {
                    setData([]);
                    return;
                }

                // Fetch data for all selected metrics in parallel
                const promises = selectedTypes.map(async (type) => {
                    const isLatencyMetric = type === 'generation_latency' || type === 'search_latency';
                    let url = '';
                    if (isLatencyMetric) {
                        const latencyType = type === 'generation_latency' ? 'generation' : 'search';
                        url = `/api/admin/stats/latency?type=${latencyType}&days=${selectedDays}`;
                    } else {
                        url = `/api/admin/stats/activity?type=${type}&days=${selectedDays}`;
                    }

                    const res = await fetch(url, {
                        signal: abortController?.signal
                    });

                    if (!res.ok) throw new Error(`Failed to fetch ${type}`);
                    return { type, data: await res.json() };
                });

                const results = await Promise.all(promises);

                // Merge data
                // Assuming all APIs return sorted array of { date: string, count/value: number }
                // We need to merge them into a single array of objects keyed by date
                const mergedData: Record<string, ActivityPoint> = {};

                // Initialize with dates from the first result (assuming all have same date ranges roughly)
                // Actually, distinct metrics might have sparse data. It's safer to collect all unique dates first.
                // However, the API returns a continuous range including zeros for the requested period.
                // So we can iterate through the first one to set up structure, or just direct merge.
                // NOTE: The API returns `count` for activity and `value` for latency.

                results.forEach(({ type, data }) => {
                    data.forEach((point: any) => {
                        if (!mergedData[point.date]) {
                            mergedData[point.date] = { date: point.date };
                        }
                        // Determine value key based on metric type logic from API
                        const val = point.value !== undefined ? point.value : point.count;
                        mergedData[point.date][type] = val;
                    });
                });

                // Convert back to array and sort
                const finalData = Object.values(mergedData).sort((a, b) => a.date.localeCompare(b.date));
                setData(finalData);

            } catch (err: any) {
                if (err.name === 'AbortError') return;
                console.error('Failed to fetch stats:', err);
            } finally {
                if (showLoading && abortController && !abortController.signal.aborted) {
                    setIsLoading(false);
                }
            }
        };

        fetchData();

        const debouncedRefetch = () => {
            if (debounceTimer) clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                console.log('ActivityChart: Debounced refetch');
                fetchData(false);
            }, 1000);
        };

        // Realtime subscriptions
        // We subscribe to all relevant tables regardless of selection for simplicity, 
        // or we could optimize. For now, simple logic:
        const channels: any[] = [];

        const tables = ['page_events', 'api_usage', 'profiles', 'donations'];
        tables.forEach(table => {
            const channel = supabase
                .channel(`${table}_activity`)
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table }, () => {
                    debouncedRefetch();
                })
                .subscribe();
            channels.push(channel);
        });

        return () => {
            if (abortController) abortController.abort();
            if (debounceTimer) clearTimeout(debounceTimer);
            channels.forEach(ch => supabase.removeChannel(ch));
        };
    }, [selectedTypes, selectedDays]);

    const isHourly = parseFloat(selectedDays) <= 1;

    // Helper to get metric config
    const getMetric = (id: string) => METRICS.find(m => m.id === id);

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
                    {/* Multi Metric Selector */}
                    <MultiMetricSelector
                        metrics={METRICS}
                        selected={selectedTypes}
                        onChange={setSelectedTypes}
                    />

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
                                {selectedTypes.map(type => {
                                    const color = getMetric(type)?.color || '#3b82f6';
                                    return (
                                        <linearGradient key={type} id={`color-${type}`} x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={color} stopOpacity={0.1} />
                                            <stop offset="95%" stopColor={color} stopOpacity={0} />
                                        </linearGradient>
                                    );
                                })}
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
                                // Sort tooltip items by valuedescending
                                itemSorter={(item) => (item.value as number) * -1}
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
                                formatter={(value: any, name: any) => {
                                    const metric = getMetric(name as string);
                                    const isLatency = name === 'generation_latency' || name === 'search_latency';
                                    const suffix = isLatency ? ' ms' : '';
                                    return [`${value}${suffix}`, metric?.label || name];
                                }}
                            />
                            {selectedTypes.map(type => {
                                const metric = getMetric(type);
                                if (!metric) return null;
                                return (
                                    <Area
                                        key={type}
                                        type="monotone"
                                        dataKey={type}
                                        stroke={metric.color}
                                        strokeWidth={2}
                                        fillOpacity={1}
                                        fill={`url(#color-${type})`}
                                        animationDuration={500}
                                        connectNulls // In case some data points are missing for a metric
                                    />
                                );
                            })}
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
}

