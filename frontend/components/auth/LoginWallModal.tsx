'use client';

import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LoginWall } from './LoginWall';

interface LoginWallModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function LoginWallModal({ isOpen, onClose }: LoginWallModalProps) {
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative w-full max-w-md z-10 animate-in zoom-in-95 duration-300">
                {/* Close Button - positioned outside strictly or inside depending on preference, 
                    using absolute positioning relative to this container */}
                <div className="absolute -top-12 right-0 md:-right-12 z-20">
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                        aria-label="Close"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <LoginWall
                    title="Sign in to Order Print"
                    description="Create a free account to order high-quality framed prints of your custom maps. Your design will be saved."
                    className="shadow-2xl shadow-blue-500/20 border-0 ring-1 ring-white/20"
                />
            </div>
        </div>
    );
}
