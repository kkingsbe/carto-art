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

export function ActivityChart() {
    const [data, setData] = useState<ActivityPoint[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch('/api/admin/stats/activity');
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
    }, []);

    if (isLoading) {
        return (
            <div className="h-[300px] flex items-center justify-center bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
            <h3 className="text-sm font-semibold mb-6 flex items-center gap-2">
                Platform Activity (30 Days)
            </h3>
            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
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
                            itemStyle={{ color: '#3b82f6', fontWeight: 600 }}
                            labelStyle={{ color: '#6b7280', marginBottom: '4px' }}
                        />
                        <Area
                            type="monotone"
                            dataKey="count"
                            stroke="#3b82f6"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorCount)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
