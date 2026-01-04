'use client';

import { useState, useEffect } from 'react';
import { Loader2, Info } from 'lucide-react';
import { Tooltip } from '@/components/ui/tooltip';

interface CohortRow {
    cohort_week: string;
    total_users: number;
    week_0: number;
    week_1: number;
    week_2: number;
    week_3: number;
    week_4: number;
}

export function CohortRetentionChart() {
    const [data, setData] = useState<CohortRow[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchCohorts = async () => {
            try {
                const res = await fetch('/api/admin/stats/cohorts');
                if (res.ok) {
                    const result = await res.json();
                    setData(result);
                }
            } catch (error) {
                console.error('Failed to load cohorts', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchCohorts();
    }, []);

    const getCellColor = (percentage: number) => {
        if (percentage === 0) return 'bg-gray-50 dark:bg-gray-800/50 text-gray-400';
        if (percentage < 10) return 'bg-blue-50 text-blue-700 dark:bg-blue-900/10 dark:text-blue-400';
        if (percentage < 30) return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
        if (percentage < 50) return 'bg-blue-200 text-blue-900 dark:bg-blue-800/50 dark:text-blue-200';
        if (percentage < 70) return 'bg-blue-300 text-blue-900 dark:bg-blue-700/60 dark:text-blue-100';
        return 'bg-blue-400 text-blue-950 font-bold dark:bg-blue-600 dark:text-white';
    };

    if (isLoading) {
        return (
            <div className="h-[300px] flex items-center justify-center bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                        Cohort Retention
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Percentage of users returning weeks after signup
                    </p>
                </div>
                <Tooltip content="Rows show users grouped by signup week. Columns show the percentage of those users who were active in subsequent weeks." side="left">
                    <Info className="w-4 h-4 text-gray-400 cursor-help" />
                </Tooltip>
            </div>

            <div className="overflow-x-auto">
                <div className="min-w-[500px]">
                    {/* Header */}
                    <div className="grid grid-cols-7 mb-2 text-xs font-semibold text-gray-500 text-center">
                        <div className="col-span-2 text-left pl-2">Cohort</div>
                        <div>Users</div>
                        <div>Week 0</div>
                        <div>Week 1</div>
                        <div>Week 2</div>
                        <div>Week 3+</div>
                    </div>

                    {/* Rows */}
                    <div className="space-y-1">
                        {data.map((row) => (
                            <div key={row.cohort_week} className="grid grid-cols-7 text-xs items-center gap-1">
                                <div className="col-span-2 pl-2 font-medium text-gray-700 dark:text-gray-300">
                                    {new Date(row.cohort_week).toLocaleDateString(undefined, {
                                        month: 'short',
                                        day: 'numeric'
                                    })}
                                </div>
                                <div className="text-center text-gray-500">
                                    {row.total_users}
                                </div>
                                {[row.week_0, row.week_1, row.week_2, row.week_3].map((val, i) => (
                                    <div
                                        key={i}
                                        className={`h-8 flex items-center justify-center rounded ${getCellColor(val)}`}
                                    >
                                        {val > 0 ? `${val.toFixed(0)}%` : '-'}
                                    </div>
                                ))}
                            </div>
                        ))}
                        {data.length === 0 && (
                            <div className="text-center py-8 text-sm text-gray-500 italic bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                                Not enough data for cohort analysis yet.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
