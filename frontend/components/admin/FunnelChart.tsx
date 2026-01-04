'use client';

import { useState, useEffect } from 'react';
import { Loader2, ArrowDownRight, Clock } from 'lucide-react';

interface FunnelStep {
    step: string;
    count: number;
    percentage: number;
    dropOff: number;
    avgTimeNext?: number; // average time to next step in minutes
}

export function FunnelChart() {
    const [data, setData] = useState<FunnelStep[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchFunnel = async () => {
            try {
                const res = await fetch('/api/admin/stats/funnel');
                if (res.ok) {
                    const result = await res.json();
                    setData(result);
                }
            } catch (error) {
                console.error('Failed to load funnel', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchFunnel();
    }, []);

    const getMaxCount = () => {
        return Math.max(...data.map(d => d.count), 1);
    };

    if (isLoading) {
        return (
            <div className="h-[300px] flex items-center justify-center bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 h-full">
            <div className="mb-6">
                <h3 className="text-sm font-semibold">Activation Funnel</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Conversion from signup to first export
                </p>
            </div>

            <div className="space-y-4 relative">
                {data.map((step, index) => (
                    <div key={step.step} className="relative z-10">
                        <div className="flex items-center justify-between text-xs font-medium mb-1.5">
                            <span className="text-gray-700 dark:text-gray-300">{step.step}</span>
                            <span className="text-gray-500">{step.count.toLocaleString()} users</span>
                        </div>

                        <div className="relative group">
                            <div className="h-8 flex bg-gray-100 dark:bg-gray-800 rounded-md overflow-hidden relative">
                                <div
                                    className="bg-indigo-500 dark:bg-indigo-600 h-full transition-all duration-500 ease-out"
                                    style={{ width: `${(step.count / getMaxCount()) * 100}%` }}
                                />
                                <div className="absolute inset-0 flex items-center px-3">
                                    <span className="text-xs font-bold text-gray-900 dark:text-white drop-shadow-sm group-hover:hidden">
                                        {step.percentage}%
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Drop-off and Time indicator between steps */}
                        {index < data.length - 1 && (
                            <div className="pl-4 py-2 flex items-center justify-between text-[10px] pr-2">
                                <div className="flex items-center gap-2 text-red-500 font-medium">
                                    <ArrowDownRight className="w-3 h-3" />
                                    {data[index + 1].dropOff}% drop-off
                                </div>
                                {step.avgTimeNext && step.avgTimeNext > 0 && (
                                    <div className="text-gray-400 flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {step.avgTimeNext < 1 ? '<1m' : `${Math.round(step.avgTimeNext)}m`} avg
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}

                {/* Vertical connecting line */}
                <div className="absolute top-4 left-[21px] bottom-8 w-0.5 bg-gray-100 dark:bg-gray-800/50 -z-0" />
            </div>
        </div>
    );
}
