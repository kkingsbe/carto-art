'use client';

import { Coffee } from 'lucide-react';
import { cn } from '@/lib/utils';

export function BuyMeACoffeeWidget() {
    return (
        <a
            href="https://buymeacoffee.com/kkingsbe"
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
                "fixed md:bottom-4 md:right-4 z-40 hidden md:flex items-center gap-2",
                "bg-[#FFDD00] text-black font-semibold",
                "px-5 py-3 rounded-full shadow-lg",
                "transform transition-all duration-300 hover:scale-105 hover:shadow-xl hover:-translate-y-1",
                "active:scale-95 active:translate-y-0",
                "group"
            )}
            aria-label="Buy me a coffee"
        >
            <div className="relative">
                <Coffee className="w-5 h-5 md:w-6 md:h-6 fill-black/10" />
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse border-2 border-[#FFDD00] hidden group-hover:block" />
            </div>
            <span className="font-display font-bold tracking-wide text-sm">
                Buy me a coffee
            </span>
        </a>
    );
}
