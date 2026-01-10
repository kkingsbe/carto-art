import { Suspense } from 'react';
import { ActivityChart } from '@/components/admin/ActivityChart';
import { AddDonationDialog } from '@/components/admin/AddDonationDialog';
import { ReferrerLeaderboard } from '@/components/admin/ReferrerLeaderboard';
import { DashboardStats } from '@/components/admin/DashboardStats';
import { DashboardActivityFeed } from '@/components/admin/DashboardActivityFeed';
import { StatsSkeleton, ActivitySkeleton } from '@/components/admin/Skeletons';

export default function AdminDashboardPage() {
    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Dashboard Overview</h1>
                    <p className="text-gray-500 dark:text-gray-400">
                        Real-time metrics and platform status.
                    </p>
                </div>
                <AddDonationDialog />
            </div>

            {/* Quick Stats Grid */}
            <Suspense fallback={<StatsSkeleton />}>
                <DashboardStats />
            </Suspense>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                {/* Analytics Section */}
                <div className="lg:col-span-2">
                    <ActivityChart />
                </div>

                {/* Activity Feed Section */}
                <div className="space-y-6">
                    <Suspense fallback={<ActivitySkeleton />}>
                        <DashboardActivityFeed />
                    </Suspense>
                </div>
            </div>

            {/* Acquisition & Growth Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                <ReferrerLeaderboard />
            </div>
        </div>
    );
}
