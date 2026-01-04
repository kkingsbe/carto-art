'use client';

import { useEffect, useState } from 'react';
import { X, MessageCircle, Heart, ExternalLink, Share2, Save, ShoppingBag, Check, Twitter, Facebook, Link as LinkIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { SaveButton } from './SaveButton';

interface ExportSuccessModalProps {
    isOpen: boolean;
    onClose: () => void;
    onBuyPrint?: () => void;
    onSave: (name: string) => Promise<void>;
    isAuthenticated: boolean;
    currentMapName?: string | null;
    hasUnsavedChanges?: boolean;
}

export function ExportSuccessModal({
    isOpen,
    onClose,
    onBuyPrint,
    onSave,
    isAuthenticated,
    currentMapName,
    hasUnsavedChanges
}: ExportSuccessModalProps) {
    const router = useRouter();
    const [isMobile, setIsMobile] = useState(false);
    const [copied, setCopied] = useState(false);

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

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy link', err);
        }
    };

    const handleShareTwitter = () => {
        const text = "Check out this map poster I designed with CartoArt! 🗺️✨";
        const url = window.location.href;
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
    };

    const handleSignUp = () => {
        // Redirect to register, preserving the current state via url if possible, 
        // but for now just register. The editor state is in the URL ?s=... so it should persist.
        const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
        router.push(`/register?next=${returnUrl}`);
    };

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
                    "relative w-full max-w-2xl flex flex-col z-10",
                    "bg-white dark:bg-gray-900",
                    "shadow-2xl shadow-blue-500/10",
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

                {/* Hero Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-white text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay"></div>
                    <div className="relative z-10">
                        <div className="mx-auto bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mb-4 backdrop-blur-sm">
                            <Check className="w-8 h-8 text-white" />
                        </div>
                        <h2 className="text-2xl font-bold mb-2">Export Complete!</h2>
                        <p className="text-blue-100">Your high-resolution poster is downloading...</p>
                    </div>
                </div>

                {/* Content Grid */}
                <div className="p-6 grid gap-6 md:grid-cols-2">

                    {/* Primary Action: Print (if enabled) or Save */}
                    <div className="col-span-1 md:col-span-2 space-y-4">
                        {onBuyPrint ? (
                            <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-xl border border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row items-center gap-6">
                                <div className="flex-1 text-center sm:text-left">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                                        Love your design?
                                    </h3>
                                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                                        Get a museum-quality framed print shipped to your door.
                                    </p>
                                </div>
                                <button
                                    onClick={onBuyPrint}
                                    className={cn(
                                        "whitespace-nowrap flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white",
                                        "bg-gray-900 hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100",
                                        "transition-all shadow-lg hover:shadow-xl hover:scale-105"
                                    )}
                                >
                                    <ShoppingBag className="w-4 h-4" />
                                    Order Print
                                </button>
                            </div>
                        ) : null}
                    </div>

                    {/* Secondary Actions */}
                    <div className="space-y-4">
                        <div className="p-4 rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 h-full">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                    <Save className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div className="font-semibold text-gray-900 dark:text-white">
                                    {isAuthenticated ? 'Save to Profile' : 'Don\'t Lose This!'}
                                </div>
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 h-10">
                                {isAuthenticated
                                    ? "Save this map to your collection to edit it later."
                                    : "Create a free account to save your design and edit it anytime."}
                            </p>

                            {isAuthenticated ? (
                                <SaveButton
                                    onSave={onSave}
                                    isAuthenticated={isAuthenticated}
                                    currentMapName={currentMapName}
                                    hasUnsavedChanges={hasUnsavedChanges}
                                    className="w-full justify-center py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-600 border-none shadow-none dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30"
                                />
                            ) : (
                                <button
                                    onClick={handleSignUp}
                                    className={cn(
                                        "w-full py-2.5 rounded-lg font-medium text-sm transition-colors",
                                        "bg-blue-50 text-blue-600 hover:bg-blue-100",
                                        "dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30"
                                    )}
                                >
                                    Sign Up to Save
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="p-4 rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 h-full">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                    <Share2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                </div>
                                <div className="font-semibold text-gray-900 dark:text-white">
                                    Share Design
                                </div>
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 h-10">
                                Show off your map creation with friends.
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={handleCopyLink}
                                    className="flex flex-col items-center justify-center p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                >
                                    {copied ? <Check className="w-5 h-5 text-green-500 mb-1" /> : <LinkIcon className="w-5 h-5 text-gray-600 dark:text-gray-400 mb-1" />}
                                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{copied ? 'Copied!' : 'Copy Link'}</span>
                                </button>
                                <button
                                    onClick={handleShareTwitter}
                                    className="flex flex-col items-center justify-center p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                >
                                    <Twitter className="w-5 h-5 text-blue-400 mb-1" />
                                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Tweet</span>
                                </button>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Footer Links */}
                <div className="bg-gray-50 dark:bg-gray-800/50 p-4 flex flex-wrap items-center justify-center gap-4 border-t border-gray-100 dark:border-gray-700 text-sm">
                    <a
                        href="https://buymeacoffee.com/kkingsbe"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-gray-600 hover:text-yellow-600 dark:text-gray-400 dark:hover:text-yellow-400 transition-colors"
                    >
                        <Heart className="w-4 h-4" />
                        <span>Buy me a coffee</span>
                    </a>
                    <div className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                    <button
                        onClick={() => window.open('https://discord.gg/UVKEfcfZVc', '_blank', 'noopener,noreferrer')}
                        className="flex items-center gap-2 text-gray-600 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition-colors"
                    >
                        <MessageCircle className="w-4 h-4" />
                        <span>Join Discord</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
