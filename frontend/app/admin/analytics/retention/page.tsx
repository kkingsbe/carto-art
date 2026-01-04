'use client';

import { RetentionStatsCards } from '@/components/admin/RetentionStatsCards';
import { CohortRetentionChart } from '@/components/admin/CohortChart';
import { FunnelChart } from '@/components/admin/FunnelChart';
import { GrowthMetrics } from '@/components/admin/GrowthMetrics';

export default function RetentionAnalyticsPage() {
    return (
        <div className="space-y-12">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Growth & Retention Analytics</h1>
                <p className="text-gray-500 dark:text-gray-400">
                    Track user activation, revenue, lifecycle, and churn risk.
                </p>
            </div>

            {/* Growth Metrics (Activation, Revenue, Stickiness) */}
            <section>
                <GrowthMetrics />
            </section>

            <div className="h-px bg-gray-200 dark:bg-gray-800" />

            {/* Retention Stats (Existing) */}
            <section className="space-y-6">
                <div>
                    <h2 className="text-lg font-semibold mb-4">Retention & Churn</h2>
                    <RetentionStatsCards />
                </div>

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
            </section>

            <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20 rounded-xl p-6">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Growth Insights</h3>
                <ul className="list-disc list-inside text-sm text-blue-800/80 dark:text-blue-200/80 space-y-1">
                    <li><strong>Activation:</strong> Measuring how quickly users reach their first "Aha!" moment (creating a map).</li>
                    <li><strong>Stickiness:</strong> A DAU/MAU ratio above 20% is considered good for SaaS; above 50% is world-class.</li>
                    <li><strong>Retention:</strong> Early retention (Day 1/7) is driven by Activation; Late retention (Day 30+) is driven by habit loops.</li>
                </ul>
            </div>
        </div>
    );
}
