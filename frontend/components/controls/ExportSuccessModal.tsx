import { useEffect, useState, useCallback } from 'react';
import { trackEventAction } from '@/lib/actions/events';
import { getSessionId } from '@/lib/utils';
import { X, Save, ShoppingBag, Check, Twitter, Upload, Clock, Star, Truck, Shield, ChevronRight, Quote } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/control-components';

// Testimonials data
const TESTIMONIALS = [
    {
        name: "Gerry D.",
        text: "A website I never knew I needed! Thank you"
    },
    {
        name: "Landen K.",
        text: "The fact that I can do all this quickly and that it's free... I want other people to see this"
    }
];

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
    inline?: boolean;
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
    subscriptionTier = 'free',
    inline = false
}: ExportSuccessModalProps) {
    const router = useRouter();

    // Urgency timer state
    const [timeRemaining, setTimeRemaining] = useState(getTimeRemaining);

    // Delay secondary actions to reduce distraction
    const [showSecondaryActions, setShowSecondaryActions] = useState(false);

    // Rotate testimonials
    const [currentTestimonial, setCurrentTestimonial] = useState(0);

    // Update timer every minute
    useEffect(() => {
        if (!isOpen) return;
        const interval = setInterval(() => {
            setTimeRemaining(getTimeRemaining());
        }, 60000);
        return () => clearInterval(interval);
    }, [isOpen]);

    // Delay secondary actions by 4 seconds to focus attention on CTA
    useEffect(() => {
        if (!isOpen) {
            setShowSecondaryActions(false);
            return;
        }
        const timer = setTimeout(() => {
            setShowSecondaryActions(true);
        }, 4000);
        return () => clearTimeout(timer);
    }, [isOpen]);

    // Rotate testimonials every 5 seconds
    useEffect(() => {
        if (!isOpen) return;
        const interval = setInterval(() => {
            setCurrentTestimonial((prev) => (prev + 1) % TESTIMONIALS.length);
        }, 5000);
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

    if (!isOpen && !inline) return null;

    const modalContent = (
        <div
            className={cn(
                "relative w-full max-w-2xl flex flex-col z-10",
                "bg-white dark:bg-gray-900",
                "shadow-2xl shadow-blue-500/10",
                "border border-gray-200 dark:border-gray-800",
                "rounded-t-2xl md:rounded-2xl overflow-hidden",
                "animate-in slide-in-from-bottom md:zoom-in-95 duration-300 transform",
                "pb-safe",
                "max-h-[85vh]",
                inline && "animate-none"
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

            {/* Combined Header: Success + Urgency */}
            <div className="shrink-0">
                {/* Success confirmation - slim */}
                <div className="bg-emerald-500 px-4 py-2 text-white flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    <span className="text-sm font-medium">Download started — your poster is saving</span>
                </div>

                {/* Urgency Banner - integrated */}
                {onBuyPrint && (
                    <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-center py-2.5 px-4 flex items-center justify-center gap-3">
                        <Clock className={cn(
                            "w-4 h-4",
                            timeRemaining.hours < 1 && "animate-pulse"
                        )} />
                        <span className="text-sm font-medium">10% off prints today!</span>
                        <span className={cn(
                            "bg-white/20 px-2 py-0.5 rounded-full text-xs font-bold",
                            timeRemaining.hours < 1 && "animate-pulse bg-white/35"
                        )}>
                            {timeRemaining.hours}h {timeRemaining.minutes}m
                        </span>
                    </div>
                )}
            </div>

            {/* MAIN CONTENT */}
            <div className="p-5 md:p-6 flex-1 overflow-y-auto overscroll-contain">

                {/* Print CTA Section */}
                {onBuyPrint && (
                    <div className="flex flex-col md:flex-row gap-5 items-center">
                        {/* Preview Mockup - simplified */}
                        {previewUrl && (
                            <div className="shrink-0">
                                <div className="relative bg-gradient-to-b from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-lg p-4 pb-1">
                                    <div className="relative shadow-xl">
                                        <div className="bg-gray-900 dark:bg-gray-200 p-1 rounded-sm">
                                            <div className="bg-white p-0.5">
                                                <img
                                                    src={previewUrl}
                                                    alt="Your Design"
                                                    className="w-28 md:w-32 h-auto block"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="h-0.5 bg-gradient-to-t from-gray-300 dark:from-gray-900 to-transparent mt-3 rounded-full mx-2" />
                                </div>
                            </div>
                        )}

                        {/* Content */}
                        <div className="flex-1 text-center md:text-left space-y-3">
                            <div>
                                <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white leading-tight">
                                    Get It On Your Wall
                                </h3>
                                {/* Price Anchoring */}
                                <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm">
                                    Premium framed prints{' '}
                                    <span className="text-gray-400 line-through">$50</span>{' '}
                                    <span className="font-bold text-emerald-600 dark:text-emerald-400">$45</span>
                                </p>
                            </div>

                            {/* Star Rating + Trust Signals - compact */}
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-1 text-xs text-gray-500">
                                <span className="flex items-center gap-1">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} className="w-3 h-3 text-amber-400 fill-amber-400" />
                                    ))}
                                    <span className="font-medium text-gray-600 dark:text-gray-400 ml-0.5">4.9</span>
                                </span>
                                <span className="flex items-center gap-1">
                                    <Truck className="w-3 h-3 text-blue-500" />
                                    Free Shipping
                                </span>
                                <span className="flex items-center gap-1">
                                    <Shield className="w-3 h-3 text-green-500" />
                                    Satisfaction Guaranteed
                                </span>
                            </div>

                            {/* Rotating Testimonial - more subtle */}
                            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-md p-2.5 text-left">
                                <div className="flex items-start gap-2">
                                    <Quote className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-xs text-gray-600 dark:text-gray-400 italic leading-relaxed">
                                            "{TESTIMONIALS[currentTestimonial].text}"
                                        </p>
                                        <p className="text-xs text-gray-400 mt-1">
                                            — {TESTIMONIALS[currentTestimonial].name}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* CTA Button */}
                            <Button
                                onClick={onBuyPrint}
                                className="w-full md:w-auto min-w-[220px] h-12 gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-base shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 transition-all hover:-translate-y-0.5 border-0"
                            >
                                <ShoppingBag className="w-4 h-4" />
                                Claim 10% Off Now
                                <ChevronRight className="w-4 h-4" />
                            </Button>

                            {/* Reassurance */}
                            <p className="text-xs text-gray-400">
                                No commitment — browse sizes and prices
                            </p>
                        </div>
                    </div>
                )}

                {/* Minimized Secondary Actions - Delayed visibility to focus on CTA */}
                <div className={cn(
                    "mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 transition-all duration-500",
                    showSecondaryActions ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"
                )}>
                    <div className="flex flex-wrap items-center justify-center gap-2">
                        <span className="text-xs text-gray-400 dark:text-gray-500 mr-2">Other options:</span>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs h-8 text-gray-500 dark:text-gray-500 hover:text-gray-700"
                            onClick={handlePublishWithTracking}
                        >
                            <Upload className="w-3.5 h-3.5 mr-1.5" />
                            Publish
                        </Button>
                        <span className="text-gray-200 dark:text-gray-700">|</span>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs h-8 text-gray-500 dark:text-gray-500 hover:text-gray-700"
                            onClick={isAuthenticated ? () => handleSaveWithTracking(currentMapName || 'New Map') : handleSignUp}
                        >
                            <Save className="w-3.5 h-3.5 mr-1.5" />
                            {isAuthenticated ? 'Save' : 'Sign Up'}
                        </Button>
                        <span className="text-gray-200 dark:text-gray-700">|</span>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs h-8 text-gray-500 dark:text-gray-500 hover:text-gray-700"
                            onClick={handleShareTwitter}
                        >
                            <Twitter className="w-3.5 h-3.5 mr-1.5" />
                            Share
                        </Button>
                    </div>
                </div>
            </div>

            {/* Mobile Sticky CTA */}
            {onBuyPrint && (
                <div className="md:hidden sticky bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white via-white dark:from-gray-900 dark:via-gray-900 to-transparent pt-8 -mt-4">
                    <Button
                        onClick={onBuyPrint}
                        className="w-full h-14 gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-base shadow-xl shadow-orange-500/30 border-0"
                    >
                        <ShoppingBag className="w-5 h-5" />
                        Claim 10% Off Now
                        <ChevronRight className="w-5 h-5" />
                    </Button>
                </div>
            )}
        </div>

    );

    if (inline) return modalContent;

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
            {modalContent}
        </div>
    );
}

