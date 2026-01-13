'use client';

import { X, Sparkles, Map as MapIcon, Zap, Globe, Shield, Clock } from 'lucide-react';
import { useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { createCheckoutSession } from '@/lib/actions/subscription';
import { trackEventAction } from '@/lib/actions/events';
import { getSessionId } from '@/lib/utils';

export type PaywallVariant = 'soft' | 'project_limit' | 'export_limit';

interface PaywallModalProps {
    isOpen: boolean;
    onClose: () => void;
    variant: PaywallVariant;
    usage?: {
        used: number;
        limit: number;
    } | null;
    countdown?: string | null;
    inline?: boolean;
}

export function PaywallModal({ isOpen, onClose, variant, usage, countdown, inline = false }: PaywallModalProps) {
    const router = useRouter();
    const hasTrackedRef = useRef(false);

    // Track paywall shown event
    useEffect(() => {
        if (!isOpen && !inline) {
            hasTrackedRef.current = false;
            return;
        }

        if ((isOpen || inline) && !hasTrackedRef.current) {
            trackEventAction({
                eventType: 'paywall_shown',
                eventName: `${variant}_paywall_displayed`,
                sessionId: getSessionId(),
                metadata: {
                    variant,
                    limit: usage?.limit,
                    used: usage?.used
                }
            }).catch(() => { });
            hasTrackedRef.current = true;
        }
    }, [isOpen, variant, usage, inline]);

    if (!isOpen && !inline) return null;

    const handleUpgrade = async () => {
        trackEventAction({
            eventType: 'paywall_cta_clicked',
            eventName: `${variant}_paywall_upgrade`,
            sessionId: getSessionId(),
            metadata: usage ? { limit: usage.limit, used: usage.used } : {}
        });
        const searchParams = typeof window !== 'undefined' ? window.location.search.substring(1) : '';
        await createCheckoutSession(searchParams);
    };

    const handleClose = () => {
        if (variant === 'soft') {
            trackEventAction({
                eventType: 'interaction',
                eventName: 'soft_paywall_dismiss',
                sessionId: getSessionId(),
            });
        }
        onClose();
    };

    const getContent = () => {
        switch (variant) {
            case 'project_limit':
                return {
                    icon: <MapIcon className="w-8 h-8 text-amber-600 dark:text-amber-400" />,
                    iconBg: 'bg-amber-100 dark:bg-amber-900/30',
                    title: 'Project Limit Reached',
                    description: (
                        <>
                            You've used {usage?.used} of {usage?.limit} free projects.
                            <br />
                            Upgrade to create unlimited maps.
                        </>
                    )
                };
            case 'export_limit':
                return {
                    icon: <Clock className="w-8 h-8 text-amber-600 dark:text-amber-400" />,
                    iconBg: 'bg-amber-100 dark:bg-amber-900/30',
                    title: 'Daily Limit Reached',
                    description: (
                        <>
                            You've used your {usage?.limit} free exports for today.
                            {countdown && (
                                <div className="mt-2 text-sm font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-3 py-1 rounded-full border border-amber-100 dark:border-amber-900/30 inline-block">
                                    Next free export in {countdown}
                                </div>
                            )}
                        </>
                    )
                };
            case 'soft':
            default:
                return {
                    icon: <Sparkles className="w-8 h-8 text-blue-600 dark:text-blue-400" />,
                    iconBg: 'bg-blue-100 dark:bg-blue-900/30',
                    title: 'Unlock the Full Experience',
                    description: "You're doing great! Take your maps to the next level with Carto Plus."
                };
        }
    };

    const content = getContent();

    const modalContent = (
        <div className={cn(
            "relative w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 z-10",
            inline && "animate-none"
        )}>
            {/* Close Button */}
            <button
                onClick={handleClose}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 transition-colors z-20"
            >
                <X className="w-5 h-5" />
            </button>

            <div className="p-6 pt-10 text-center space-y-6">
                {/* Icon Header */}
                <div className="flex justify-center">
                    <div className={cn("w-16 h-16 rounded-full flex items-center justify-center", content.iconBg)}>
                        {content.icon}
                    </div>
                </div>

                <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {content.title}
                    </h2>
                    <div className="text-gray-500 dark:text-gray-400 text-sm md:text-base">
                        {content.description}
                    </div>
                </div>

                {/* Progress Bar for Limits */}
                {variant !== 'soft' && usage && (
                    <div className="bg-gray-100 dark:bg-gray-700/50 rounded-lg p-4">
                        <div className="flex justify-between text-sm mb-2">
                            <span className="font-medium text-gray-700 dark:text-gray-300">Free Plan Usage</span>
                            <span className="text-gray-500 dark:text-gray-400">{usage.used} / {usage.limit}</span>
                        </div>
                        <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-amber-500 rounded-full"
                                style={{ width: `${Math.min(100, (usage.used / usage.limit) * 100)}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* Plus Benefits */}
                <div className="grid grid-cols-1 gap-3 text-left">
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/30">
                        <div className="mt-1 w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                            <Zap className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">Unlimited Exports</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">High-resolution PNGs without daily limits.</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/30">
                        <div className="mt-1 w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                            <Globe className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">Advanced 3D Terrain</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Volumetric elevation and custom shading.</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/30">
                        <div className="mt-1 w-5 h-5 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                            <Shield className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">Commercial License</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Sell your designs and use them professionally.</p>
                        </div>
                    </div>
                </div>

                {/* Upgrade Card */}
                <div className="bg-gradient-to-r from-indigo-500 from-10% via-sky-500 via-30% to-emerald-500 to-90% p-[1px] rounded-xl text-left">
                    <div className="bg-white dark:bg-gray-900 rounded-[11px] p-1">
                        <button
                            onClick={handleUpgrade}
                            className="w-full py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg font-semibold hover:scale-[1.01] active:scale-[0.99] transition-transform flex items-center justify-center gap-2"
                        >
                            <Sparkles className="w-4 h-4 fill-current" />
                            Upgrade to Carto Plus
                        </button>
                    </div>
                </div>

                <button
                    onClick={handleClose}
                    className="text-sm font-medium text-gray-500 hover:text-gray-900 dark:hover:text-gray-300 transition-colors"
                >
                    Maybe later
                </button>
            </div>
        </div>
    );

    if (inline) return modalContent;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={handleClose}
            />

            {/* Modal Content */}
            {modalContent}
        </div>
    );
}
