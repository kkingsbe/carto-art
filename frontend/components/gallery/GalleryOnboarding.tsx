'use client';

import { useState, useEffect } from 'react';
import { X, Sparkles, TrendingUp, Search, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export function GalleryOnboarding() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const hasSeenOnboarding = localStorage.getItem('hasSeenGalleryOnboarding');
        if (!hasSeenOnboarding) {
            // Small delay for better UX
            const timer = setTimeout(() => setIsVisible(true), 1000);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleDismiss = () => {
        setIsVisible(false);
        localStorage.setItem('hasSeenGalleryOnboarding', 'true');
    };

    if (!isVisible) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.5, ease: 'easeInOut' }}
                className="overflow-hidden"
            >
                <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 py-6">
                    <div className="relative group overflow-hidden rounded-3xl bg-gradient-to-br from-[#c9a962]/20 via-[#1a1a1a] to-[#b87333]/10 border border-white/10 backdrop-blur-sm">
                        {/* Animated Glows */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-[#c9a962]/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 group-hover:bg-[#c9a962]/20 transition-all duration-700" />
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/5 rounded-full blur-[60px] translate-y-1/2 -translate-x-1/4" />

                        <div className="relative z-10 p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 md:gap-10">
                            {/* Icon / Visual */}
                            <div className="hidden md:flex shrink-0 w-16 h-16 rounded-2xl bg-[#c9a962]/10 border border-[#c9a962]/20 items-center justify-center shadow-inner">
                                <Sparkles className="w-8 h-8 text-[#c9a962]" />
                            </div>

                            {/* Content */}
                            <div className="flex-1 text-center md:text-left">
                                <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                                    <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#c9a962]">Welcome to the Gallery</span>
                                    <div className="h-px w-8 bg-[#c9a962]/30 hidden sm:block" />
                                </div>
                                <h3 className="text-2xl md:text-3xl font-bold text-[#f5f0e8] mb-3">
                                    Find the <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#c9a962] to-[#e5c985]">Perfect Inspiration</span>
                                </h3>
                                <p className="text-[#d4cfc4]/70 max-w-2xl leading-relaxed text-sm md:text-base">
                                    Looking for the best examples? Switch to the <span className="text-[#c9a962] font-semibold flex inline-flex items-center gap-1 mx-1"><TrendingUp className="w-4 h-4" /> Top</span> filter to see highly-rated maps from our community creators. You can also search by style to find exactly what you're looking for.
                                </p>
                            </div>

                            {/* Action */}
                            <div className="shrink-0 flex items-center gap-4">
                                <button
                                    onClick={handleDismiss}
                                    className="px-6 py-2.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-white font-medium transition-all duration-300"
                                >
                                    Got it
                                </button>
                                <button
                                    onClick={handleDismiss}
                                    className="p-2 rounded-full hover:bg-white/5 text-white/40 hover:text-white transition-colors"
                                    aria-label="Dismiss"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Bottom Tip Bar */}
                        <div className="bg-white/5 border-t border-white/5 px-8 py-3 flex items-center gap-3">
                            <Info className="w-4 h-4 text-[#c9a962]" />
                            <p className="text-[10px] md:text-xs uppercase tracking-widest text-[#d4cfc4]/40 font-medium">
                                Tip: Click any map to open it in the editor and make it your own.
                            </p>
                        </div>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
