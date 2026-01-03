'use client';

import { useState, useEffect } from 'react';
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
    count: number;
}

const METRICS = [
    { id: 'all', label: 'Total Activity', color: '#3b82f6' },
    { id: 'page_view', label: 'Views', color: '#10b981' },
    { id: 'poster_export', label: 'Exports', color: '#f59e0b' },
    { id: 'search_location', label: 'Searches', color: '#8b5cf6' },
    { id: 'style_change', label: 'Styles', color: '#ec4899' },
];

export function ActivityChart() {
    const [data, setData] = useState<ActivityPoint[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedType, setSelectedType] = useState('all');

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const res = await fetch(`/api/admin/stats/activity?type=${selectedType}`);
                if (res.ok) {
                    const stats = await res.json();
                    setData(stats);
                }
            } catch (err) {
                console.error('Failed to fetch activity stats');
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [selectedType]);

    const activeColor = METRICS.find(m => m.id === selectedType)?.color || '#3b82f6';

    return (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                    Platform Activity (30 Days)
                </h3>

                <div className="flex flex-wrap gap-1 p-1 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-800">
                    {METRICS.map((metric) => (
                        <button
                            key={metric.id}
                            onClick={() => setSelectedType(metric.id)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${selectedType === metric.id
                                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm ring-1 ring-gray-200 dark:ring-gray-600'
                                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                }`}
                        >
                            {metric.label}
                        </button>
                    ))}
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
                            />
                            <Area
                                type="monotone"
                                dataKey="count"
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
