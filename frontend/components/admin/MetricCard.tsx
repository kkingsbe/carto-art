import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricCardProps {
    title: string;
    value: string;
    icon: LucideIcon;
    trend?: string;
    trendUp?: boolean;
    className?: string;
}

export function MetricCard({
    title,
    value,
    icon: Icon,
    trend,
    trendUp,
    className
}: MetricCardProps) {
    return (
        <div className={cn(
            "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 transition-all hover:shadow-md",
            className
        )}>
            <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-lg text-gray-600 dark:text-gray-400">
                    <Icon className="w-5 h-5" />
                </div>
                {trend && (
                    <span className={cn(
                        "text-xs font-medium px-2 py-1 rounded-full",
                        trendUp
                            ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                            : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                    )}>
                        {trend}
                    </span>
                )}
            </div>
            <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
                <h3 className="text-2xl font-bold mt-1 tracking-tight">{value}</h3>
            </div>
        </div>
    );
}
