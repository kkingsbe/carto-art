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
        <div className={cn(
            "glass-card rounded-xl p-6 border transition-all duration-300 relative overflow-hidden group",
            isPlus
                ? "bg-gradient-to-br from-[#4f46e5]/20 via-[#0a0f1a] to-[#0a0f1a] border-[#4f46e5]/30 shadow-[0_0_30px_-10px_rgba(79,70,229,0.2)]"
                : "border-white/5 bg-white/5"
        )}>
            {isPlus ? (
                <>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#4f46e5]/20 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none group-hover:bg-[#4f46e5]/30 transition-colors duration-500" />

                    <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-[#818cf8] fill-[#818cf8]/20 animate-pulse-slow" />
                        Carto Plus Active
                    </h3>
                    <p className="text-sm text-[#e0e7ff]/70 mb-6 relative z-10">
                        You have full access to premium exports and features.
                    </p>

                    <button
                        onClick={handleManage}
                        disabled={isPending}
                        className={cn(
                            "w-full flex items-center justify-between px-4 py-2.5",
                            "bg-[#0a0f1a]/60 backdrop-blur-md",
                            "border border-[#4f46e5]/30 rounded-lg",
                            "text-sm font-medium text-[#c7d2fe] hover:text-white",
                            "hover:bg-[#4f46e5]/10 hover:border-[#4f46e5]/50 transition-all duration-300 group/btn",
                            isPending && "opacity-70 cursor-wait"
                        )}
                    >
                        <span className="flex items-center gap-2">
                            <CreditCard className="w-4 h-4 text-[#818cf8]" />
                            Manage Subscription
                        </span>
                        <ChevronRight className="w-4 h-4 text-[#818cf8]/50 group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                </>
            ) : (
                <>
                    <h3 className="text-lg font-semibold text-[#f5f0e8] mb-2 flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-[#c9a962]" />
                        Subscription
                    </h3>
                    <p className="text-sm text-[#d4cfc4]/60 mb-6">
                        Unlock custom markers, routes, video exports, and more.
                    </p>

                    <button
                        onClick={handleUpgrade}
                        disabled={isPending}
                        className={cn(
                            "w-full flex items-center justify-center gap-2 px-4 py-2.5",
                            "bg-gradient-to-r from-[#c9a962] to-[#e0c47c] text-[#0a0f1a]",
                            "rounded-lg text-sm font-bold",
                            "hover:shadow-[0_0_20px_rgba(201,169,98,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300",
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
