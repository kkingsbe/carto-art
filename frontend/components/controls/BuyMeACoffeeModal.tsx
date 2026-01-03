'use client';

import { useEffect, useState } from 'react';
import { X, MessageCircle, Heart, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface BuyMeACoffeeModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function BuyMeACoffeeModal({ isOpen, onClose }: BuyMeACoffeeModalProps) {
    const [isMobile, setIsMobile] = useState(false);

    // Detect mobile on mount and resize
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 640);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

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
                isMobile ? "p-4" : "p-4"
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
                    "relative w-full max-w-lg flex flex-col z-10",
                    "bg-white dark:bg-gray-900",
                    "shadow-2xl shadow-yellow-500/10",
                    "border border-gray-200 dark:border-gray-800",
                    "rounded-2xl overflow-hidden",
                    "animate-in fade-in zoom-in-95 duration-300 transform"
                )}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header with Close Button */}
                <div className="absolute top-4 right-4 z-20">
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    </button>
                </div>

                {/* Hero Image / decorative header */}
                <div className="h-32 bg-[#FFDD00] flex items-center justify-center relative overflow-hidden">
                    {/* Decorative pattern or logo could go here */}
                    <div className="absolute inset-0 opacity-10 pattern-dots" />
                    <div className="text-4xl font-black text-black tracking-tight transform -rotate-3">
                        Buy Me a Coffee
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 flex flex-col items-center text-center space-y-4">
                    <div className="-mt-16 bg-white dark:bg-gray-800 p-2 rounded-full shadow-lg">
                        <div className="bg-[#FFDD00] p-4 rounded-full">
                            <Heart className="w-8 h-8 text-black fill-black" />
                        </div>
                    </div>

                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Enjoying Carto-Art?
                    </h2>

                    <p className="text-gray-600 dark:text-gray-300 max-w-sm">
                        Carto-Art is free and open source. If you created something cool, consider supporting the development!
                    </p>

                    <a
                        href="https://buymeacoffee.com/kkingsbe"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                            "w-full max-w-sm flex items-center justify-center gap-2",
                            "px-6 py-4 rounded-xl font-bold text-lg",
                            "bg-[#FFDD00] hover:bg-[#ffea00] active:scale-[0.98]",
                            "text-black transition-all duration-200 shadow-md hover:shadow-lg",
                            "ring-offset-2 focus:ring-2 ring-[#FFDD00]"
                        )}
                    >
                        Support on Buy Me a Coffee
                        <ExternalLink className="w-5 h-5 opacity-60" />
                    </a>

                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700 w-full">
                        <button
                            onClick={() => window.open('https://discord.gg/UVKEfcfZVc', '_blank', 'noopener,noreferrer')}
                            className="flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-indigo-500 dark:text-gray-400 dark:hover:text-indigo-400 transition-colors mx-auto"
                        >
                            <MessageCircle className="w-4 h-4" />
                            Join our community on Discord
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
