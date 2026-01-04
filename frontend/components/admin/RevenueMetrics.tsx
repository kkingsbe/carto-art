'use client';

import { DollarSign, TrendingUp, CreditCard } from 'lucide-react';
import { MetricCard } from '@/components/admin/MetricCard';

interface RevenueData {
    total_revenue: number;
    arpu: number;
    arppu: number;
    paying_users: number;
}

interface RevenueMetricsProps {
    data: RevenueData;
}

export function RevenueMetrics({ data }: RevenueMetricsProps) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount);
    };

    return (
        <div>
            <h3 className="text-sm font-semibold mb-3 text-gray-500 uppercase tracking-wider">Revenue & LTV</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <MetricCard
                    title="ARPU (All Users)"
                    value={formatCurrency(data.arpu)}
                    icon={DollarSign}
                    className="bg-red-50/30 dark:bg-red-900/10 border-red-100 dark:border-red-800"
                />
                <MetricCard
                    title="ARPPU (Paying Users)"
                    value={formatCurrency(data.arppu)}
                    icon={TrendingUp}
                    className="bg-orange-50/30 dark:bg-orange-900/10 border-orange-100 dark:border-orange-800"
                />
                <MetricCard
                    title="Paying Users"
                    value={data.paying_users.toString()}
                    icon={CreditCard}
                    className="bg-amber-50/30 dark:bg-amber-900/10 border-amber-100 dark:border-amber-800"
                />
            </div>
        </div>
    );
}
