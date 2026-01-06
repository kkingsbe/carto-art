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
        <div className="glass-card rounded-xl p-6 border border-white/5 bg-white/5 relative overflow-hidden group">
            {isPlus ? (
                <>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none group-hover:bg-indigo-500/20 transition-colors duration-500" />

                    <h3 className="text-lg font-semibold text-[#f5f0e8] mb-2 flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-indigo-400 fill-indigo-400/20" />
                        Carto Plus Active
                    </h3>
                    <p className="text-sm text-[#d4cfc4]/60 mb-6">
                        You have full access to premium exports and features.
                    </p>

                    <button
                        onClick={handleManage}
                        disabled={isPending}
                        className={cn(
                            "w-full flex items-center justify-between px-4 py-2.5 bg-[#0a0f1a]/50",
                            "border border-white/10 rounded-lg",
                            "text-sm font-medium text-[#d4cfc4] hover:text-[#f5f0e8]",
                            "hover:bg-[#0a0f1a]/80 hover:border-white/20 transition-all duration-300",
                            isPending && "opacity-70 cursor-wait"
                        )}
                    >
                        <span className="flex items-center gap-2">
                            <CreditCard className="w-4 h-4 text-[#c9a962]" />
                            Manage Subscription
                        </span>
                        <ChevronRight className="w-4 h-4 text-[#d4cfc4]/40" />
                    </button>
                </>
            ) : (
                <>
                    <h3 className="text-lg font-semibold text-[#f5f0e8] mb-2 flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-[#c9a962]" />
                        Subscription
                    </h3>
                    <p className="text-sm text-[#d4cfc4]/60 mb-6">
                        Unlock video exports, unlimited GIFs, and more.
                    </p>

                    <button
                        onClick={handleUpgrade}
                        disabled={isPending}
                        className={cn(
                            "w-full flex items-center justify-center gap-2 px-4 py-2.5",
                            "bg-[#c9a962] text-[#0a0f1a]",
                            "rounded-lg text-sm font-bold",
                            "hover:bg-[#d4b472] transition-all shadow-[0_0_20px_rgba(201,169,98,0.15)] hover:shadow-[0_0_25px_rgba(201,169,98,0.3)]",
                            isPending && "opacity-70 cursor-wait"
                        )}
                    >
                        <Sparkles className="w-4 h-4 text-[#0a0f1a]" />
                        Upgrade to Plus
                    </button>
                </>
            )}
        </div>
    );
}
