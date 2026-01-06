'use client';

import { Sparkles, CreditCard, ChevronRight } from 'lucide-react';
import { createCustomerPortalSession, createCheckoutSession } from '@/lib/actions/subscription';
import { useTransition } from 'react';
import { cn } from '@/lib/utils';

import { useFeatureFlag } from '@/hooks/useFeatureFlag';

interface SubscriptionStatusCardProps {
    tier: 'free' | 'carto_plus' | null;
    status: string | null;
}

export function SubscriptionStatusCard({ tier, status }: SubscriptionStatusCardProps) {
    const isEnabled = useFeatureFlag('carto_plus');
    const [isPending, startTransition] = useTransition();

    if (!isEnabled) return null;


    const handleManage = () => {
        startTransition(async () => {
            try {
                await createCustomerPortalSession();
            } catch (error) {
                console.error('Failed to open portal', error);
            }
        });
    };

    const handleUpgrade = () => {
        startTransition(async () => {
            try {
                // Return to profile after checkout (or canceled)
                await createCheckoutSession(`${window.location.origin}/profile`);
            } catch (error) {
                console.error('Failed to start checkout', error);
            }
        });
    };

    const isPlus = tier === 'carto_plus';

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700 overflow-hidden relative">
            {isPlus ? (
                <>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-indigo-500 fill-indigo-500" />
                        Carto Plus Active
                    </h3>
                    <p className="text-sm text-gray-500 mb-6">
                        You have full access to premium exports and features.
                    </p>

                    <button
                        onClick={handleManage}
                        disabled={isPending}
                        className={cn(
                            "w-full flex items-center justify-between px-4 py-2.5 bg-gray-50 dark:bg-gray-900",
                            "border border-gray-200 dark:border-gray-700 rounded-lg",
                            "text-sm font-medium text-gray-700 dark:text-gray-300",
                            "hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors",
                            isPending && "opacity-70 cursor-wait"
                        )}
                    >
                        <span className="flex items-center gap-2">
                            <CreditCard className="w-4 h-4 text-gray-400" />
                            Manage Subscription
                        </span>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                    </button>
                </>
            ) : (
                <>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        Subscription
                    </h3>
                    <p className="text-sm text-gray-500 mb-6">
                        Unlock video exports, unlimited GIFs, and more.
                    </p>

                    <button
                        onClick={handleUpgrade}
                        disabled={isPending}
                        className={cn(
                            "w-full flex items-center justify-center gap-2 px-4 py-2.5",
                            "bg-gradient-to-r from-indigo-600 to-purple-600 text-white",
                            "rounded-lg text-sm font-medium",
                            "hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-indigo-500/20",
                            isPending && "opacity-70 cursor-wait"
                        )}
                    >
                        <Sparkles className="w-4 h-4 fill-white/20" />
                        Upgrade to Plus
                    </button>
                </>
            )}
        </div>
    );
}
