'use client';

import { X, Sparkles, Map as MapIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { createCheckoutSession } from '@/lib/actions/subscription';
import { trackEventAction } from '@/lib/actions/events';
import { getSessionId } from '@/lib/utils';

interface ProjectLimitModalProps {
    isOpen: boolean;
    onClose: () => void;
    usage: {
        used: number;
        limit: number;
    } | null;
}

export function ProjectLimitModal({ isOpen, onClose, usage }: ProjectLimitModalProps) {
    const router = useRouter();

    if (!isOpen) return null;

    const handleUpgrade = async () => {
        trackEventAction({
            eventType: 'paywall_cta_clicked',
            eventName: 'project_limit_modal_upgrade',
            sessionId: getSessionId(),
            metadata: {
                limit: usage?.limit,
                used: usage?.used
            }
        });
        // Pass current search params to preserve state on redirect if needed
        const searchParams = typeof window !== 'undefined' ? window.location.search.substring(1) : '';
        await createCheckoutSession(searchParams);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 z-10">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 transition-colors z-20"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="p-6 pt-10 text-center space-y-6">
                    {/* Icon Header */}
                    <div className="flex justify-center">
                        <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                            <MapIcon className="w-8 h-8 text-amber-600 dark:text-amber-400" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Project Limit Reached
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400">
                            You've used {usage?.used} of {usage?.limit} free projects.
                            <br />
                            Upgrade to create unlimited maps.
                        </p>
                    </div>

                    {/* Progress Bar */}
                    {usage && (
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

                    {/* Upgrade Card */}
                    <div className="bg-gradient-to-r from-indigo-500 from-10% via-sky-500 via-30% to-emerald-500 to-90% p-[1px] rounded-xl text-left">
                        <div className="bg-white dark:bg-gray-900 rounded-[11px] p-5">
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-amber-500 fill-amber-500" />
                                    <h4 className="font-bold text-gray-900 dark:text-white">
                                        Upgrade to Carto Plus
                                    </h4>
                                </div>
                                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                                    <li className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                        Unlimited projects
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                        Custom markers & routes
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                        Commercial license
                                    </li>
                                </ul>
                                <button
                                    onClick={handleUpgrade}
                                    className="w-full py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-semibold hover:scale-[1.02] active:scale-[0.98] transition-transform"
                                >
                                    Upgrade Now
                                </button>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="text-sm font-medium text-gray-500 hover:text-gray-900 dark:hover:text-gray-300 transition-colors"
                    >
                        Maybe later
                    </button>
                </div>
            </div>
        </div>
    );
}
