import { useEffect, useState, useCallback } from 'react';
import { trackEventAction } from '@/lib/actions/events';
import { getSessionId } from '@/lib/utils';
import { X, Save, ShoppingBag, Check, Twitter, Upload, Clock, Star, Truck, Shield, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
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

// Calculate time remaining for urgency (resets daily at midnight UTC)
function getTimeRemaining(): { hours: number; minutes: number } {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setUTCHours(24, 0, 0, 0);
    const diff = midnight.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return { hours, minutes };
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

    // Urgency timer state
    const [timeRemaining, setTimeRemaining] = useState(getTimeRemaining);

    // Update timer every minute
    useEffect(() => {
        if (!isOpen) return;
        const interval = setInterval(() => {
            setTimeRemaining(getTimeRemaining());
        }, 60000);
        return () => clearInterval(interval);
    }, [isOpen]);

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
        router.push(`/login?redirect=${returnUrl}`);
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

                {/* Compact Success Header */}
                <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-3 text-white relative overflow-hidden shrink-0">
                    <div className="relative z-10 flex items-center gap-3">
                        <div className="bg-white/20 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-sm">
                            <Check className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold">Download Started!</h2>
                            <p className="text-xs text-emerald-100">Your poster is saving to your device</p>
                        </div>
                    </div>
                </div>

                {/* MAIN CONTENT: Print-Focused Hero */}
                <div className="p-4 md:p-6 flex-1 overflow-y-auto overscroll-contain">

                    {/* Print CTA - The Hero Section */}
                    {onBuyPrint && (
                        <div className="relative">
                            {/* Urgency Banner */}
                            <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-center py-2 px-4 rounded-t-xl flex items-center justify-center gap-2 text-sm font-medium">
                                <Clock className="w-4 h-4" />
                                <span>Limited time: 10% off your first order</span>
                                <span className="bg-white/20 px-2 py-0.5 rounded text-xs font-bold">
                                    {timeRemaining.hours}h {timeRemaining.minutes}m left
                                </span>
                            </div>

                            <div className="bg-white dark:bg-gray-800 rounded-b-xl border border-t-0 border-gray-200 dark:border-gray-700 shadow-xl overflow-hidden">
                                <div className="p-5 md:p-6">
                                    <div className="flex flex-col md:flex-row gap-6 items-center">
                                        {/* Preview Mockup */}
                                        {previewUrl && (
                                            <div className="shrink-0 relative w-full md:w-auto flex justify-center">
                                                {/* Room Context Background */}
                                                <div className="relative bg-gradient-to-b from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-lg p-6 pb-2">
                                                    {/* Wall texture hint */}
                                                    <div className="absolute inset-0 opacity-5 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiMwMDAiLz48L3N2Zz4=')]" />

                                                    {/* Framed poster */}
                                                    <div className="relative shadow-2xl">
                                                        <div className="bg-gray-900 dark:bg-gray-200 p-1.5 rounded-sm">
                                                            <div className="bg-white p-1">
                                                                <img
                                                                    src={previewUrl}
                                                                    alt="Your Design"
                                                                    className="w-32 md:w-40 h-auto block"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Shadow on "floor" */}
                                                    <div className="h-1 bg-gradient-to-t from-gray-300 dark:from-gray-900 to-transparent mt-4 rounded-full mx-4" />
                                                </div>
                                            </div>
                                        )}

                                        {/* Content */}
                                        <div className="flex-1 text-center md:text-left space-y-4">
                                            <div>
                                                <h3 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white leading-tight">
                                                    Get It On Your Wall
                                                </h3>
                                                <p className="text-gray-600 dark:text-gray-400 mt-2 text-base">
                                                    Premium framed prints starting at <span className="font-bold text-gray-900 dark:text-white">$45</span>
                                                </p>
                                            </div>

                                            {/* Trust Signals */}
                                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-gray-600 dark:text-gray-400">
                                                <span className="flex items-center gap-1.5">
                                                    <Truck className="w-4 h-4 text-blue-500" />
                                                    Ships Worldwide
                                                </span>
                                                <span className="flex items-center gap-1.5">
                                                    <Shield className="w-4 h-4 text-green-500" />
                                                    Quality Guarantee
                                                </span>
                                                <span className="flex items-center gap-1.5">
                                                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                                                    500+ Happy Customers
                                                </span>
                                            </div>

                                            {/* CTA Button */}
                                            <Button
                                                onClick={onBuyPrint}
                                                className="w-full md:w-auto min-w-[240px] h-14 gap-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg shadow-xl shadow-blue-500/25 hover:shadow-blue-500/40 transition-all hover:-translate-y-0.5 hover:scale-[1.02]"
                                            >
                                                <ShoppingBag className="w-5 h-5" />
                                                View Print Options
                                                <ChevronRight className="w-5 h-5" />
                                            </Button>

                                            {/* Reassurance */}
                                            <p className="text-xs text-gray-500 dark:text-gray-500">
                                                No commitment - just browse sizes and prices
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Minimized Secondary Actions - Collapsed into single row */}
                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                        <div className="flex flex-wrap items-center justify-center gap-2">
                            <span className="text-xs text-gray-500 dark:text-gray-500 mr-2">Or:</span>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs h-8 text-gray-600 dark:text-gray-400 hover:text-gray-900"
                                onClick={handlePublishWithTracking}
                            >
                                <Upload className="w-3.5 h-3.5 mr-1.5" />
                                Publish to Gallery
                            </Button>
                            <span className="text-gray-300 dark:text-gray-700">|</span>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs h-8 text-gray-600 dark:text-gray-400 hover:text-gray-900"
                                onClick={isAuthenticated ? () => handleSaveWithTracking(currentMapName || 'New Map') : handleSignUp}
                            >
                                <Save className="w-3.5 h-3.5 mr-1.5" />
                                {isAuthenticated ? 'Save Project' : 'Sign Up to Save'}
                            </Button>
                            <span className="text-gray-300 dark:text-gray-700">|</span>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs h-8 text-gray-600 dark:text-gray-400 hover:text-gray-900"
                                onClick={handleShareTwitter}
                            >
                                <Twitter className="w-3.5 h-3.5 mr-1.5" />
                                Share
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

