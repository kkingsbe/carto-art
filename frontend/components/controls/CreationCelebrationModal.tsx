'use client';

import { useEffect } from 'react';
import { X, Sparkles, Heart, Coffee } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CreationCelebrationModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const BUYMEACOFFEE_URL = 'https://buymeacoffee.com/kkingsbe';

export function CreationCelebrationModal({
    isOpen,
    onClose,
}: CreationCelebrationModalProps) {
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

    const handleDonate = () => {
        window.open(BUYMEACOFFEE_URL, '_blank', 'noopener,noreferrer');
        onClose();
    };

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
                    "shadow-2xl shadow-yellow-500/10",
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
                <div className="bg-gradient-to-r from-amber-500 to-yellow-500 p-6 text-white text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay"></div>
                    <div className="relative z-10">
                        <div className="mx-auto bg-white/20 w-14 h-14 rounded-full flex items-center justify-center mb-3 backdrop-blur-sm">
                            <Sparkles className="w-7 h-7 text-white" />
                        </div>
                        <h2 className="text-xl font-bold mb-1">Nice! You made something cool.</h2>
                        <p className="text-amber-100 text-sm">Your map has been saved.</p>
                    </div>
                </div>

                {/* Body */}
                <div className="p-5 text-center">
                    <p className="text-gray-600 dark:text-gray-300 mb-5 text-sm leading-relaxed">
                        CartoArt is free and supported by people like you.
                        If you're enjoying this, a small tip helps keep the project going!
                    </p>

                    {/* CTA Button */}
                    <button
                        onClick={handleDonate}
                        className={cn(
                            "w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold",
                            "bg-gradient-to-r from-amber-500 to-yellow-500 text-white",
                            "hover:from-amber-600 hover:to-yellow-600",
                            "transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                        )}
                    >
                        <Coffee className="w-5 h-5" />
                        Buy me a coffee
                    </button>

                    {/* Dismiss */}
                    <button
                        onClick={onClose}
                        className="mt-3 text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    >
                        Maybe later
                    </button>
                </div>
            </div>
        </div>
    );
}
