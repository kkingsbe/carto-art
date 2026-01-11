import { useEffect, useState, useCallback } from 'react';
import { trackEventAction } from '@/lib/actions/events';
import { getSessionId } from '@/lib/utils';
import { X, MessageCircle, Heart, ExternalLink, Share2, Save, ShoppingBag, Check, Twitter, Link as LinkIcon, Upload, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { SaveButton } from './SaveButton';
import { Button } from '@/components/ui/control-components';

interface ExportSuccessModalProps {
    isOpen: boolean;
    onClose: () => void;
    onBuyPrint?: () => void;
    onSave: (name: string) => Promise<void>;
    isAuthenticated: boolean;
    currentMapName?: string | null;
    hasUnsavedChanges?: boolean;
    exportCount?: number;
    previewUrl?: string | null;
    onPublish?: () => void;
    subscriptionTier?: 'free' | 'carto_plus';
}

export function ExportSuccessModal({
    isOpen,
    onClose,
    onBuyPrint,
    onSave,
    isAuthenticated,
    currentMapName,
    hasUnsavedChanges,
    exportCount = 0,
    previewUrl,
    onPublish,
    subscriptionTier = 'free'
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
                description: "You just created something awesome for free. Help us keep it that way!",
                cta: "Buy Me a Coffee"
            };
        }
    };

    const donationMessage = getDonationMessage();

    // Track modal view
    useEffect(() => {
        if (isOpen) {
            trackEventAction({
                eventType: 'export_modal_view',
                eventName: 'export_success_modal_viewed',
                sessionId: getSessionId(),
                metadata: {
                    exportCount,
                    hasUnsavedChanges
                }
            });
        }
    }, [isOpen, exportCount, hasUnsavedChanges]);

    const handleClose = useCallback(() => {
        trackEventAction({
            eventType: 'export_modal_dismiss',
            eventName: 'export_modal_closed',
            sessionId: getSessionId(),
            metadata: { method: 'button' }
        });
        onClose();
    }, [onClose]);

    // Handle ESC key to close
    useEffect(() => {
        if (!isOpen) return;

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                trackEventAction({
                    eventType: 'export_modal_dismiss',
                    eventName: 'export_modal_closed',
                    sessionId: getSessionId(),
                    metadata: { method: 'escape_key' }
                });
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

            trackEventAction({
                eventType: 'export_modal_share_click',
                eventName: 'share_link_copied',
                sessionId: getSessionId()
            });
        } catch (err) {
            console.error('Failed to copy link', err);
        }
    };

    const handleShareTwitter = () => {
        const text = "Check out this map poster I designed with CartoArt! 🗺️✨";
        const url = window.location.href;

        trackEventAction({
            eventType: 'export_modal_share_click',
            eventName: 'share_twitter_clicked',
            sessionId: getSessionId()
        });

        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
    };

    const handleSignUp = () => {
        trackEventAction({
            eventType: 'export_modal_save_click',
            eventName: 'signup_to_save_clicked',
            sessionId: getSessionId()
        });

        const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
        router.push(`/register?next=${returnUrl}`);
    };

    const handleDonateClick = () => {
        trackEventAction({
            eventType: 'export_modal_donate_click',
            eventName: 'donate_button_clicked',
            sessionId: getSessionId(),
            metadata: {
                messageTitle: donationMessage.title
            }
        });
    };

    // Helper to wrap save with tracking
    const handleSaveWithTracking = async (name: string) => {
        trackEventAction({
            eventType: 'export_modal_save_click',
            eventName: 'save_project_clicked',
            sessionId: getSessionId()
        });
        await onSave(name);
    };

    // Helper to wrap publish with tracking
    const handlePublishWithTracking = () => {
        if (onPublish) {
            trackEventAction({
                eventType: 'export_modal_publish_click',
                eventName: 'publish_to_gallery_clicked',
                sessionId: getSessionId()
            });
            onPublish();
            onClose();
        }
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
                    trackEventAction({
                        eventType: 'export_modal_dismiss',
                        eventName: 'export_modal_closed',
                        sessionId: getSessionId(),
                        metadata: { method: 'backdrop_click' }
                    });
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
                        onClick={handleClose}
                        className="p-2 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    </button>
                </div>

                {/* Hero Header - UPDATED COPY */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 md:p-6 text-white text-center relative overflow-hidden shrink-0">
                    <div className="relative z-10">
                        <div className="mx-auto bg-white/20 w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center mb-2 md:mb-3 backdrop-blur-sm">
                            <Check className="w-5 h-5 md:w-6 md:h-6 text-white" />
                        </div>
                        <h2 className="text-xl md:text-2xl font-bold mb-1">Your Design is Saved!</h2>
                        <p className="text-sm md:text-base text-blue-100 font-medium">Your high-resolution poster is downloading...</p>
                    </div>
                </div>

                {/* Content Grid */}
                <div className="p-3 md:p-5 grid gap-4 flex-1 overflow-y-auto overscroll-contain">

                    {/* Primary Action: Print (Prioritized & Enhanced) */}
                    {onBuyPrint && (
                        <div className="col-span-1">
                            {/* Key change: Added border-blue-500/30 and ring effect for emphasis */}
                            <div className="bg-white dark:bg-gray-800/80 p-5 rounded-2xl border border-blue-200 dark:border-blue-900/50 shadow-xl shadow-blue-500/10 relative overflow-hidden group ring-1 ring-blue-500/20">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

                                {/* Recommended Badge */}
                                <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] sm:text-xs font-bold px-3 py-1 rounded-bl-xl shadow-sm z-10">
                                    RECOMMENDED
                                </div>

                                <div className="relative flex flex-col sm:flex-row gap-6 items-center">
                                    {previewUrl && (
                                        <div className="shrink-0 relative transform group-hover:scale-[1.02] transition-transform duration-500 w-full sm:w-auto flex justify-center">
                                            <div className="relative shadow-2xl rounded-sm overflow-hidden bg-white border-[8px] border-gray-900 dark:border-gray-200 max-w-[160px] sm:max-w-[200px]">
                                                <div className="border-[6px] border-white bg-white">
                                                    <img
                                                        src={previewUrl}
                                                        alt="Your Design"
                                                        className="w-full h-auto block"
                                                    />
                                                </div>
                                                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/20 pointer-events-none" />
                                            </div>
                                            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-[90%] h-4 bg-black/30 blur-xl rounded-full" />
                                        </div>
                                    )}

                                    <div className="flex-1 text-center sm:text-left space-y-3 w-full">
                                        <div>
                                            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white leading-tight">
                                                The Ultimate Way to Display Your Map
                                            </h3>
                                            <p className="text-gray-600 dark:text-gray-400 mt-2 text-sm sm:text-base leading-relaxed">
                                                You've made a great design. It deserves to be on your wall in museum-quality print.
                                            </p>
                                        </div>

                                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-2 text-xs text-gray-500 dark:text-gray-400 py-1">
                                            <span className="flex items-center gap-1.5">
                                                <Check className="w-4 h-4 text-green-500" />
                                                Ready to hang
                                            </span>
                                            <span className="flex items-center gap-1.5">
                                                <Check className="w-4 h-4 text-green-500" />
                                                Free Shipping
                                            </span>
                                        </div>

                                        <div className="pt-2">
                                            <Button
                                                variant="default"
                                                className="w-full sm:w-auto min-w-[200px] h-11 gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-base shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all hover:-translate-y-0.5"
                                                onClick={onBuyPrint}
                                            >
                                                <ShoppingBag className="w-5 h-5" />
                                                View Print Options
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Secondary Actions Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Donation or Upsell */}
                        {subscriptionTier === 'free' ? (
                            <div
                                className="rounded-xl border border-purple-200 dark:border-purple-900/50 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/10 dark:to-indigo-900/10 p-4 relative overflow-hidden flex flex-col justify-center group cursor-pointer"
                                onClick={() => {
                                    if (!isAuthenticated) {
                                        router.push('/login');
                                    } else {
                                        import('@/lib/actions/subscription').then(({ createCheckoutSession }) => {
                                            const searchParams = typeof window !== 'undefined' ? window.location.search.substring(1) : '';
                                            createCheckoutSession(searchParams);
                                        });
                                    }
                                }}
                            >
                                <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <Sparkles className="w-16 h-16 text-purple-600 dark:text-purple-400" />
                                </div>
                                <div className="relative z-10 flex gap-3 items-start">
                                    <div className="shrink-0 w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                                        <Sparkles className="w-5 h-5 fill-current" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-gray-900 dark:text-white text-sm">
                                            Unlock the Full Experience
                                        </h4>
                                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 mb-2 leading-relaxed">
                                            Get unlimited exports, GIF/Video generation, commercial license, and more.
                                        </p>
                                        <button className="text-xs font-bold text-purple-700 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 flex items-center gap-1 transition-colors">
                                            Upgrade to Plus <ExternalLink className="w-3 h-3" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="rounded-xl border border-yellow-200 dark:border-yellow-900/50 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-yellow-900/10 dark:to-yellow-800/10 p-4 relative overflow-hidden flex flex-col justify-center">
                                <div className="relative z-10 flex gap-3 items-start">
                                    <div className="shrink-0 w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center text-yellow-600 dark:text-yellow-400">
                                        <Heart className="w-5 h-5 fill-current" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-900 dark:text-white text-sm">
                                            Enjoying the tool?
                                        </h4>
                                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 mb-2">
                                            {donationMessage.description}
                                        </p>
                                        <a
                                            href="https://buymeacoffee.com/kkingsbe"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={handleDonateClick}
                                            className="text-xs font-bold text-yellow-700 dark:text-yellow-500 hover:underline flex items-center gap-1"
                                        >
                                            {donationMessage.cta} <ExternalLink className="w-3 h-3" />
                                        </a>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Other Actions Grouped */}
                        <div className="rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 p-4 space-y-3">
                            <h4 className="font-semibold text-gray-900 dark:text-white text-sm flex items-center gap-2">
                                <Share2 className="w-4 h-4" />
                                Other Actions
                            </h4>

                            <div className="grid grid-cols-2 gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full text-xs h-9"
                                    onClick={handlePublishWithTracking}
                                >
                                    <Upload className="w-3.5 h-3.5 mr-1.5" />
                                    Publish
                                </Button>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full text-xs h-9"
                                    onClick={isAuthenticated ? () => handleSaveWithTracking(currentMapName || 'New Map') : handleSignUp}
                                >
                                    <Save className="w-3.5 h-3.5 mr-1.5" />
                                    {isAuthenticated ? 'Save' : 'Save & Sign Up'}
                                </Button>
                            </div>

                            <div className="flex gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="flex-1 text-xs h-8 bg-white dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700"
                                    onClick={handleCopyLink}
                                >
                                    {copied ? <Check className="w-3.5 h-3.5 mr-1.5 text-green-500" /> : <LinkIcon className="w-3.5 h-3.5 mr-1.5" />}
                                    {copied ? 'Copied' : 'Copy Link'}
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="flex-1 text-xs h-8 bg-white dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700"
                                    onClick={handleShareTwitter}
                                >
                                    <Twitter className="w-3.5 h-3.5 mr-1.5 text-blue-400" />
                                    Tweet
                                </Button>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Discord Community CTA - Retained as footer */}
                <div className="bg-gray-50 dark:bg-gray-800/50 p-3 border-t border-gray-100 dark:border-gray-800">
                    <div className="flex items-center justify-between gap-3 text-xs text-gray-500 dark:text-gray-400">
                        <span>Need help or want to share feedback?</span>
                        <a
                            href="https://discord.gg/UVKEfcfZVc"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors"
                        >
                            <MessageCircle className="w-3.5 h-3.5" />
                            Join Discord
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}

