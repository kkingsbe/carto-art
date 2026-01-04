'use client';

import { useState, useEffect } from 'react';
import { Layers } from 'lucide-react';
import { ActivationChart } from './ActivationChart';
import { RevenueMetrics } from './RevenueMetrics';
import { MetricCard } from './MetricCard';

interface GrowthData {
    activation: {
        avg_time_to_map_seconds: number;
        median_time_to_map_seconds: number;
        activation_rate_3d: number;
    };
    revenue: {
        total_revenue: number;
        arpu: number;
        arppu: number;
        paying_users: number;
    };
    stickiness: {
        dau: number;
        mau: number;
        stickiness_ratio: number;
    };
}

export function GrowthMetrics() {
    const [data, setData] = useState<GrowthData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch('/api/admin/stats/growth');
                if (res.ok) {
                    const result = await res.json();
                    setData(result);
                }
            } catch (error) {
                console.error('Failed to load growth stats', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (isLoading) {
        return <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[200px] animate-pulse">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-xl" />
            <div className="bg-gray-100 dark:bg-gray-800 rounded-xl" />
        </div>;
    }

    if (!data) return null;

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <ActivationChart data={data.activation} />
                <RevenueMetrics data={data.revenue} />
            </div>

            <div>
                <h3 className="text-sm font-semibold mb-3 text-gray-500 uppercase tracking-wider">Engagement & Stickiness</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <MetricCard
                        title="DAU / MAU Ratio"
                        value={`${data.stickiness.stickiness_ratio.toFixed(1)}%`}
                        icon={Layers}
                        className="bg-pink-50/30 dark:bg-pink-900/10 border-pink-100 dark:border-pink-800"
                        trend="Daily vs Monthly Active Users"
                    />
                    <MetricCard
                        title="DAU (24h)"
                        value={data.stickiness.dau.toString()}
                        icon={Layers}
                        className="bg-gray-50 dark:bg-gray-800/30"
                    />
                    <MetricCard
                        title="MAU (30d)"
                        value={data.stickiness.mau.toString()}
                        icon={Layers}
                        className="bg-gray-50 dark:bg-gray-800/30"
                    />
                </div>
            </div>
        </div>
    );
}
