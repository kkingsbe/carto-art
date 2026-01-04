'use client';

import { RetentionStatsCards } from '@/components/admin/RetentionStatsCards';
import { CohortRetentionChart } from '@/components/admin/CohortChart';
import { FunnelChart } from '@/components/admin/FunnelChart';

export default function RetentionAnalyticsPage() {
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Retention Analytics</h1>
                <p className="text-gray-500 dark:text-gray-400">
                    Track user lifecycle, churn risk, and activation funnels.
                </p>
            </div>

            {/* High Level Stats */}
            <RetentionStatsCards />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                {/* Cohort Analysis */}
                <div className="lg:col-span-2">
                    <CohortRetentionChart />
                </div>

                {/* Funnel Analysis */}
                <div className="h-full">
                    <FunnelChart />
                </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20 rounded-xl p-6">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Retention Insights</h3>
                <ul className="list-disc list-inside text-sm text-blue-800/80 dark:text-blue-200/80 space-y-1">
                    <li>Day 1 retention typically indicates first-impression quality.</li>
                    <li>Day 7 & 30 retention reflects long-term value and habit formation.</li>
                    <li>Users who are inactive for 7-30 days are in the "At Risk" window; re-engagement campaigns are most effective here.</li>
                </ul>
            </div>
        </div>
    );
}
