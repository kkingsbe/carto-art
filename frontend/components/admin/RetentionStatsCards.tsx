'use client';

import { useState, useEffect } from 'react';
import { Users, AlertTriangle, UserX, CalendarCheck, CalendarDays, CalendarClock } from 'lucide-react';
import { MetricCard } from '@/components/admin/MetricCard';

interface RetentionStats {
    retentionRates: {
        day1: number;
        day7: number;
        day30: number;
    };
    userHealth: {
        active: { count: number; percentage: number };
        atRisk: { count: number; percentage: number };
        churned: { count: number; percentage: number };
    };
}

export function RetentionStatsCards() {
    const [data, setData] = useState<RetentionStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch('/api/admin/stats/retention');
                if (res.ok) {
                    const result = await res.json();
                    setData(result);
                }
            } catch (error) {
                console.error('Failed to load retention stats', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (isLoading) {
        return <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-4 h-[120px] animate-pulse">
            {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-gray-100 dark:bg-gray-800 rounded-xl" />
            ))}
        </div>;
    }

    if (!data) return null;

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-sm font-semibold mb-3 text-gray-500 uppercase tracking-wider">Retention Rates</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <MetricCard
                        title="Day 1 Retention"
                        value={`${data.retentionRates.day1.toFixed(1)}%`}
                        icon={CalendarCheck}
                        className="bg-blue-50/30 dark:bg-blue-900/10 border-blue-100 dark:border-blue-800"
                    />
                    <MetricCard
                        title="Day 7 Retention"
                        value={`${data.retentionRates.day7.toFixed(1)}%`}
                        icon={CalendarDays}
                        className="bg-indigo-50/30 dark:bg-indigo-900/10 border-indigo-100 dark:border-indigo-800"
                    />
                    <MetricCard
                        title="Day 30 Retention"
                        value={`${data.retentionRates.day30.toFixed(1)}%`}
                        icon={CalendarClock}
                        className="bg-purple-50/30 dark:bg-purple-900/10 border-purple-100 dark:border-purple-800"
                    />
                </div>
            </div>

            <div>
                <h3 className="text-sm font-semibold mb-3 text-gray-500 uppercase tracking-wider">Churn Risk</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <MetricCard
                        title="Active Users (7d)"
                        value={data.userHealth.active.count.toString()}
                        icon={Users}
                        trend={`${data.userHealth.active.percentage.toFixed(0)}%`}
                        trendUp={true}
                    />
                    <MetricCard
                        title="At Risk (7-30d)"
                        value={data.userHealth.atRisk.count.toString()}
                        icon={AlertTriangle}
                        className="border-amber-200 dark:border-amber-800"
                        trend={`${data.userHealth.atRisk.percentage.toFixed(0)}%`}
                        trendUp={false}
                    />
                    <MetricCard
                        title="Inactive (>30d)"
                        value={data.userHealth.churned.count.toString()}
                        icon={UserX}
                        className="bg-gray-50 dark:bg-gray-800/30"
                        trend={`${data.userHealth.churned.percentage.toFixed(0)}%`}
                    />
                </div>
            </div>
        </div>
    );
}
