'use client';

import { Zap, Clock, MousePointerClick } from 'lucide-react';
import { MetricCard } from '@/components/admin/MetricCard';

interface ActivationData {
    avg_time_to_map_seconds: number;
    median_time_to_map_seconds: number;
    activation_rate_3d: number;
}

interface ActivationChartProps {
    data: ActivationData;
}

export function ActivationChart({ data }: ActivationChartProps) {
    const formatDuration = (seconds: number) => {
        if (!seconds) return 'N/A';
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);

        if (hours > 24) {
            return `${(hours / 24).toFixed(1)} days`;
        }
        if (hours > 0) {
            return `${hours}h ${minutes % 60}m`;
        }
        return `${minutes}m ${Math.floor(seconds % 60)}s`;
    };

    return (
        <div>
            <h3 className="text-sm font-semibold mb-3 text-gray-500 uppercase tracking-wider">Activation</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <MetricCard
                    title="Time to First Map (Avg)"
                    value={formatDuration(data.avg_time_to_map_seconds)}
                    icon={Clock}
                    className="bg-emerald-50/30 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-800"
                />
                <MetricCard
                    title="Time to First Map (Median)"
                    value={formatDuration(data.median_time_to_map_seconds)}
                    icon={Zap}
                    className="bg-emerald-50/30 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-800"
                />
                <MetricCard
                    title="3-Day Activation Rate"
                    value={`${data.activation_rate_3d.toFixed(1)}%`}
                    icon={MousePointerClick}
                    className="bg-teal-50/30 dark:bg-teal-900/10 border-teal-100 dark:border-teal-800"
                />
            </div>
        </div>
    );
}
