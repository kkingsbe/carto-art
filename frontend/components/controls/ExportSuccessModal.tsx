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
    exportCount?: number;
}

export function ExportSuccessModal({
    isOpen,
    onClose,
    onBuyPrint,
    onSave,
    isAuthenticated,
    currentMapName,
    hasUnsavedChanges,
    exportCount = 0
}: ExportSuccessModalProps) {
    const router = useRouter();
    const [copied, setCopied] = useState(false);

    // Personalized donation messaging based on export count
    const getDonationMessage = () => {
        if (exportCount >= 5) {
            return {
                title: `You've Created ${exportCount} Posters, All Free!`,
                description: "You're clearly getting value from CartoArt. This tool took 100+ hours to build and costs money to run.",
                cta: "Support the Project"
            };
        } else if (exportCount >= 3) {
            return {
                title: "Loving CartoArt? Keep It Free!",
                description: "You've created multiple posters for free. A small tip helps keep this project alive for everyone.",
                cta: "Buy Me a Coffee"
            };
        } else {
            return {
                title: "Keep CartoArt Free & Ad-Free",
                description: "You just created something awesome for free! This tool took 100+ hours to build and costs money to run.",
                cta: "Buy Me a Coffee"
            };
        }
    };

    const donationMessage = getDonationMessage();
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
                "fixed inset-0 z-[100] flex items-end md:items-center justify-center",
                "animate-in fade-in duration-200",
                "p-0 md:p-4"
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
                    "rounded-t-2xl md:rounded-2xl overflow-hidden",
                    "animate-in slide-in-from-bottom md:zoom-in-95 duration-300 transform",
                    "pb-safe",
                    "max-h-[85vh]"
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
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-3 md:p-6 text-white text-center relative overflow-hidden shrink-0">
                    <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay"></div>
                    <div className="relative z-10">
                        <div className="mx-auto bg-white/20 w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center mb-2 md:mb-3 backdrop-blur-sm">
                            <Check className="w-5 h-5 md:w-6 md:h-6 text-white" />
                        </div>
                        <h2 className="text-lg md:text-xl font-bold mb-0.5 md:mb-1">Export Complete!</h2>
                        <p className="text-xs md:text-sm text-blue-100">Your high-resolution poster is downloading...</p>
                    </div>
                </div>

                {/* Content Grid */}
                <div className="p-3 md:p-4 grid gap-3 md:gap-4 md:grid-cols-2 flex-1 overflow-y-auto overscroll-contain">

                    {/* Primary Action: Print (if enabled) */}
                    {onBuyPrint && (
                        <div className="col-span-1 md:col-span-2">
                            <div className="bg-gray-50 dark:bg-gray-800/50 p-3 md:p-4 rounded-xl border border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row items-center gap-3 md:gap-4">
                                <div className="flex-1 text-center sm:text-left">
                                    <h3 className="text-sm md:text-base font-semibold text-gray-900 dark:text-white mb-0.5 md:mb-1">
                                        Love your design?
                                    </h3>
                                    <p className="text-gray-500 dark:text-gray-400 text-xs md:text-sm">
                                        Get a museum-quality framed print shipped to your door.
                                    </p>
                                </div>
                                <button
                                    onClick={onBuyPrint}
                                    className={cn(
                                        "whitespace-nowrap flex items-center gap-2 px-4 md:px-5 py-2 md:py-2.5 rounded-xl font-bold text-white text-xs md:text-sm",
                                        "bg-gray-900 hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100",
                                        "transition-all shadow-lg hover:shadow-xl hover:scale-105"
                                    )}
                                >
                                    <ShoppingBag className="w-4 h-4" />
                                    Order Print
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Featured Donation CTA */}
                    <div className="col-span-1 md:col-span-2">
                        <div className="relative overflow-hidden rounded-xl border border-yellow-200 dark:border-yellow-900/50 bg-gradient-to-br from-amber-50 via-yellow-50 to-amber-100 dark:from-yellow-900/20 dark:via-amber-900/20 dark:to-yellow-800/20 p-3 md:p-4 shadow-lg">
                            {/* Decorative pattern */}
                            <div className="absolute inset-0 opacity-5 dark:opacity-10" style={{
                                backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)',
                                backgroundSize: '24px 24px'
                            }} />

                            <div className="relative flex flex-col sm:flex-row items-center gap-3 md:gap-4">
                                <div className="flex-shrink-0">
                                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-lg">
                                        <Heart className="w-5 h-5 md:w-6 md:h-6 text-white fill-white" />
                                    </div>
                                </div>
                                <div className="flex-1 text-center sm:text-left">
                                    <h3 className="text-sm md:text-base font-bold text-gray-900 dark:text-white mb-0.5 md:mb-1">
                                        {donationMessage.title}
                                    </h3>
                                    <p className="text-gray-700 dark:text-gray-300 text-xs md:text-sm leading-snug md:leading-relaxed">
                                        {donationMessage.description}
                                    </p>
                                </div>
                                <div className="flex-shrink-0">
                                    <a
                                        href="https://buymeacoffee.com/kkingsbe"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={cn(
                                            "inline-flex items-center gap-2 px-4 md:px-5 py-2 md:py-2.5 rounded-xl font-bold text-xs md:text-sm",
                                            "bg-gradient-to-r from-yellow-400 to-amber-500 text-gray-900",
                                            "hover:from-yellow-500 hover:to-amber-600",
                                            "transition-all shadow-lg hover:shadow-xl hover:scale-105 active:scale-95",
                                            "whitespace-nowrap"
                                        )}
                                    >
                                        <Heart className="w-4 h-4 fill-current" />
                                        {donationMessage.cta}
                                    </a>
                                </div>
                            </div>
                        </div>
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
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
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
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
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

                {/* Discord Community CTA */}
                <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 p-3 md:p-4 border-t border-indigo-500/20">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 md:gap-3">
                        <div className="flex items-center gap-2.5 md:gap-3 text-center sm:text-left">
                            <div className="flex-shrink-0 w-9 h-9 md:w-10 md:h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                                <MessageCircle className="w-4.5 h-4.5 md:w-5 md:h-5 text-white" />
                            </div>
                            <div>
                                <h4 className="text-white font-bold text-xs md:text-sm mb-0 md:mb-0.5">Join the CartoArt Community</h4>
                                <p className="text-indigo-100 text-[10px] md:text-xs leading-tight">Get help, share designs, and request features</p>
                            </div>
                        </div>
                        <button
                            onClick={() => window.open('https://discord.gg/UVKEfcfZVc', '_blank', 'noopener,noreferrer')}
                            className={cn(
                                "flex items-center gap-1.5 md:gap-2 px-4 md:px-5 py-2 md:py-2.5 rounded-xl font-bold text-xs md:text-sm whitespace-nowrap",
                                "bg-white text-indigo-600 hover:bg-indigo-50",
                                "transition-all shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
                            )}
                        >
                            <MessageCircle className="w-3.5 h-3.5 md:w-4 md:h-4" />
                            Join Discord
                            <ExternalLink className="w-2.5 h-2.5 md:w-3 md:h-3" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
