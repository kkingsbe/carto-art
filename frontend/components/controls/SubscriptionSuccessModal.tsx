'use client';

import { useEffect } from 'react';
import { X, Sparkles, Check, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SubscriptionSuccessModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function SubscriptionSuccessModal({
    isOpen,
    onClose,
}: SubscriptionSuccessModalProps) {
    // Handle ESC key to close
    useEffect(() => {
        if (!isOpen) return;

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('keydown', handleEscape);
        document.body.style.overflow = 'hidden';

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = '';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            className={cn(
                "fixed inset-0 z-[100] flex items-center justify-center",
                "animate-in fade-in duration-200",
                "p-4"
            )}
            onClick={(e) => {
                if (e.target === e.currentTarget) {
                    onClose();
                }
            }}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" />

            {/* Modal Content */}
            <div
                className={cn(
                    "relative w-full max-w-sm flex flex-col z-10",
                    "bg-white dark:bg-gray-900",
                    "shadow-2xl shadow-indigo-500/20",
                    "border border-gray-200 dark:border-gray-800",
                    "rounded-2xl overflow-hidden",
                    "animate-in zoom-in-95 duration-300 transform"
                )}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 z-20 p-1.5 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 transition-colors"
                >
                    <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                </button>

                {/* Hero Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-8 text-white text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay"></div>
                    <div className="relative z-10 flex flex-col items-center">
                        <div className="bg-white/20 p-4 rounded-full flex items-center justify-center mb-4 backdrop-blur-sm shadow-xl">
                            <Sparkles className="w-8 h-8 text-white drop-shadow-md" />
                        </div>
                        <h2 className="text-2xl font-bold mb-2 tracking-tight">Welcome to Carto Plus!</h2>
                        <p className="text-indigo-100 font-medium">Your creative potential is now unlocked.</p>
                    </div>
                </div>

                {/* Body */}
                <div className="p-6">
                    <div className="space-y-4 mb-6">
                        <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                            <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                                <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                            </div>
                            <span>Unlimited GIF Exports</span>
                        </div>
                        <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                            <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                                <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                            </div>
                            <span>4K Video Resolution</span>
                        </div>
                        <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                            <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                                <Zap className="w-4 h-4 text-amber-500" />
                            </div>
                            <span>Faster Rendering Speed</span>
                        </div>
                    </div>

                    {/* CTA Button */}
                    <button
                        onClick={onClose}
                        className={cn(
                            "w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl font-bold",
                            "bg-gray-900 dark:bg-white text-white dark:text-gray-900",
                            "hover:scale-[1.02] active:scale-[0.98]",
                            "transition-all shadow-lg"
                        )}
                    >
                        Start Creating
                        <Sparkles className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
