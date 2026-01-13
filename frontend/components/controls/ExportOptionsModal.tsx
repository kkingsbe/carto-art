'use client';


import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { X, Clock, Image as ImageIcon, Box as BoxIcon, Film as FilmIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getSessionId } from '@/lib/utils';
import { ControlSlider, ControlLabel } from '@/components/ui/control-components';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { EXPORT_RESOLUTIONS, DEFAULT_EXPORT_RESOLUTION, type ExportResolutionKey } from '@/lib/export/constants';
import { calculateTargetResolution, getPhysicalDimensions, type ExportResolution, type BaseExportResolution } from '@/lib/export/resolution';
import type { PosterConfig } from '@/types/poster';
import type { GifExportOptions } from '@/hooks/useGifExport';
import type { VideoExportOptions } from '@/hooks/useVideoExport';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';
import { Sparkles, Lock, Check } from 'lucide-react';
import { createCheckoutSession } from '@/lib/actions/subscription';
import { Film, RotateCw, Box, ShoppingBag, Tornado, Plane, TrendingUp, TrendingDown, PlaneLanding, Rocket } from 'lucide-react';
import { trackEventAction } from '@/lib/actions/events';
import type { ExportUsageResult } from '@/lib/actions/usage.types';
import { LoginWall } from '@/components/auth/LoginWall';

export interface StlExportOptions {
    modelHeight: number;
    resolution: 'low' | 'medium' | 'high';
}

interface ExportOptionsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onExport: (resolution: ExportResolution, gifOptions?: GifExportOptions, videoOptions?: VideoExportOptions, stlOptions?: StlExportOptions) => void;
    isExporting: boolean;
    exportProgress?: { stage: string; percent: number } | null;
    gifProgress?: number;
    videoProgress?: number;
    latestFrame?: string | null;
    format: PosterConfig['format'];
    onFormatChange: (format: Partial<PosterConfig['format']>) => void;
    subscriptionTier?: 'free' | 'carto_plus';
    exportUsage?: ExportUsageResult | null;
    isAuthenticated?: boolean;
    inline?: boolean;
}

export function ExportOptionsModal({
    isOpen,
    onClose,
    onExport,
    isExporting,
    exportProgress,
    gifProgress,
    videoProgress,
    latestFrame,
    format,
    onFormatChange,
    subscriptionTier = 'free',
    exportUsage,
    isAuthenticated = false,
    inline = false
}: ExportOptionsModalProps) {
    const router = useRouter();
    const [selectedKey, setSelectedKey] = useState<string>('SMALL');
    const [gifDuration, setGifDuration] = useState(7);
    const [gifRotation, setGifRotation] = useState(90);
    const [gifFps, setGifFps] = useState(20);
    const [videoDuration, setVideoDuration] = useState(5);
    const [videoRotation, setVideoRotation] = useState(360);
    const [videoFps, setVideoFps] = useState(60);
    const [gifAnimationMode, setGifAnimationMode] = useState<'orbit' | 'cinematic' | 'spiral' | 'swoopIn' | 'rocketOut' | 'rise' | 'dive' | 'flyover'>('orbit');
    const [videoAnimationMode, setVideoAnimationMode] = useState<'orbit' | 'cinematic' | 'spiral' | 'swoopIn' | 'rocketOut' | 'rise' | 'dive' | 'flyover'>('orbit');
    const [stlModelHeight, setStlModelHeight] = useState(5);
    const [stlResolution, setStlResolution] = useState<'low' | 'medium' | 'high'>('medium');
    const [countdown, setCountdown] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<string>('image');
    const hasTrackedPaywallRef = useRef(false);
    const isGifExportEnabled = useFeatureFlag('gif_export');
    const isVideoExportEnabled = useFeatureFlag('video_export');
    const isStlExportEnabled = useFeatureFlag('stl_export');
    const isPaywallEnabled = useFeatureFlag('carto_plus');

    const isExportLimitReached = exportUsage && !exportUsage.allowed && subscriptionTier === 'free';

    // Determine if we should show upgrade nudge (when user has 1-2 exports remaining)
    const shouldShowUpgradeNudge = subscriptionTier === 'free' &&
        exportUsage &&
        exportUsage.limit !== Infinity &&
        exportUsage.remaining !== undefined &&
        exportUsage.remaining > 0 &&
        exportUsage.remaining <= 2;

    const hasTrackedNudgeRef = useRef(false);

    const handleTabChange = (value: string) => {
        setActiveTab(value);
        if (value === 'image') {
            if (['ORBIT_GIF', 'ORBIT_VIDEO', 'STL_MODEL'].includes(selectedKey)) {
                setSelectedKey('SMALL');
            }
        } else if (value === 'animation') {
            if (!['ORBIT_GIF', 'ORBIT_VIDEO'].includes(selectedKey)) {
                setSelectedKey('ORBIT_GIF');
            }
        } else if (value === '3d') {
            if (selectedKey !== 'STL_MODEL') {
                setSelectedKey('STL_MODEL');
            }
        }
    };

    // Track paywall shown event
    // Track paywall/login wall shown event
    useEffect(() => {
        if (!isOpen && !inline) {
            hasTrackedPaywallRef.current = false;
            return;
        }

        if ((isOpen || inline) && isExportLimitReached && !hasTrackedPaywallRef.current) {
            // Only track if authenticated to avoid server action redirects
            if (isAuthenticated) {
                const eventType = 'paywall_shown';
                console.log(`Tracking ${eventType} event`);

                trackEventAction({
                    eventType,
                    eventName: 'export_limit_reached',
                    sessionId: getSessionId(),
                    metadata: {
                        limit: exportUsage?.limit,
                        used: exportUsage?.used
                    }
                }).catch(() => { });
            }
            hasTrackedPaywallRef.current = true;
        }
    }, [isOpen, isExportLimitReached, exportUsage, isAuthenticated, inline]);

    // Track upgrade nudge shown (when user has 1-2 exports remaining)
    useEffect(() => {
        if (!isOpen && !inline) {
            hasTrackedNudgeRef.current = false;
            return;
        }

        if ((isOpen || inline) && shouldShowUpgradeNudge && !hasTrackedNudgeRef.current) {
            if (isAuthenticated) {
                trackEventAction({
                    eventType: 'upgrade_nudge_shown',
                    eventName: 'low_export_count',
                    sessionId: getSessionId(),
                    metadata: {
                        remaining: exportUsage?.remaining,
                        limit: exportUsage?.limit
                    }
                }).catch(() => { });
            }
            hasTrackedNudgeRef.current = true;
        }
    }, [isOpen, shouldShowUpgradeNudge, exportUsage, isAuthenticated, inline]);

    // Calculate countdown timer when limit is reached
    useEffect(() => {
        if (!exportUsage?.nextAvailableAt) {
            setCountdown(null);
            return;
        }

        const updateCountdown = () => {
            const now = Date.now();
            const target = new Date(exportUsage.nextAvailableAt!).getTime();
            const diff = target - now;

            if (diff <= 0) {
                setCountdown(null);
                return;
            }

            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            if (hours > 0) {
                setCountdown(`${hours}h ${minutes}m ${seconds}s`);
            } else if (minutes > 0) {
                setCountdown(`${minutes}m ${seconds}s`);
            } else {
                setCountdown(`${seconds}s`);
            }
        };

        updateCountdown();
        const interval = setInterval(updateCountdown, 1000);
        return () => clearInterval(interval);
    }, [exportUsage?.nextAvailableAt]);

    const isLocked = (key: string) => {
        if (!isPaywallEnabled || subscriptionTier === 'carto_plus') return false;
        return key === 'ORBIT_GIF' || key === 'ORBIT_VIDEO' || key === 'STL_MODEL';
    };

    const handleUpgrade = async () => {
        if (!isAuthenticated) {
            const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
            router.push(`/login?next=${returnUrl}`);
            return;
        }
        // Pass current search params to preserve state on redirect
        const searchParams = typeof window !== 'undefined' ? window.location.search.substring(1) : '';
        await createCheckoutSession(searchParams);
    };

    const handleSignUp = () => {
        const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
        router.push(`/login?redirect=${returnUrl}`);
    };

    // Track export_abandon when closing without exporting
    const handleClose = () => {
        if (selectedKey && !isExporting && !isExportLimitReached) {
            if (isAuthenticated) {
                trackEventAction({
                    eventType: 'export_abandon',
                    eventName: 'export_modal_closed',
                    sessionId: getSessionId(),
                    metadata: {
                        selectedResolution: selectedKey,
                        wasExporting: isExporting
                    }
                }).catch(() => { });
            }
        }
        onClose();
    };

    // Determine current progress
    const activeProgress = exportProgress?.percent ?? gifProgress ?? videoProgress ?? 0;
    const activeStage = exportProgress?.stage ?? (gifProgress !== undefined ? 'Generating GIF...' : (videoProgress !== undefined ? 'Recording Video...' : 'Preparing...'));

    if (!isOpen && !inline) return null;

    const modalContent = (
        <div className={cn(
            "relative w-full max-w-md bg-white dark:bg-gray-800 rounded-t-2xl md:rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom md:zoom-in-95 duration-200 pb-safe",
            inline && "animate-none"
        )}>
            <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {isExporting ? 'Exporting Poster' : 'Export Options'}
                </h2>
                {!isExporting && (
                    <button
                        onClick={handleClose}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                )}
            </div>

            <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                {isExporting ? (
                    <div className="animate-in fade-in zoom-in-95 duration-300">
                        {/* Frame Preview Container */}
                        <div className="relative rounded-2xl overflow-hidden">
                            {/* Latest Frame Preview */}
                            {latestFrame && (selectedKey === 'ORBIT_GIF' || selectedKey === 'ORBIT_VIDEO') ? (
                                <div className="relative aspect-video w-full bg-gray-900 rounded-2xl overflow-hidden">
                                    {/* Frame Image */}
                                    <img
                                        src={latestFrame}
                                        alt="Current render frame"
                                        className="w-full h-full object-cover"
                                    />

                                    {/* Dark overlay for readability */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />

                                    {/* Overlay Content */}
                                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
                                        {/* Export Type Badge */}
                                        <div className={cn(
                                            "inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm mb-4",
                                            selectedKey === 'ORBIT_GIF'
                                                ? "bg-purple-500/20 text-purple-200 border border-purple-400/30"
                                                : "bg-rose-500/20 text-rose-200 border border-rose-400/30"
                                        )}>
                                            <Film className="w-3.5 h-3.5" />
                                            <span>{selectedKey === 'ORBIT_GIF' ? 'GIF Animation' : 'Video Export'}</span>
                                        </div>

                                        {/* Circular Progress */}
                                        <div className="relative w-24 h-24 flex items-center justify-center mb-4">
                                            <svg className="w-full h-full -rotate-90 absolute">
                                                <defs>
                                                    <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                                        <stop offset="0%" stopColor="#3B82F6" />
                                                        <stop offset="50%" stopColor="#8B5CF6" />
                                                        <stop offset="100%" stopColor="#06B6D4" />
                                                    </linearGradient>
                                                </defs>
                                                <circle
                                                    cx="48"
                                                    cy="48"
                                                    r="40"
                                                    fill="none"
                                                    stroke="rgba(255,255,255,0.15)"
                                                    strokeWidth="5"
                                                />
                                                <circle
                                                    cx="48"
                                                    cy="48"
                                                    r="40"
                                                    fill="none"
                                                    stroke="url(#progressGradient)"
                                                    strokeWidth="5"
                                                    strokeDasharray={251.32}
                                                    strokeDashoffset={251.32 * (1 - activeProgress / 100)}
                                                    strokeLinecap="round"
                                                    className="transition-all duration-500 ease-out drop-shadow-[0_0_12px_rgba(139,92,246,0.6)]"
                                                />
                                            </svg>
                                            <span className="text-2xl font-bold text-white drop-shadow-lg">
                                                {activeProgress}%
                                            </span>
                                        </div>

                                        {/* Status */}
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
                                            <span className="text-sm font-medium text-white/90">{activeStage}</span>
                                        </div>

                                        <p className="text-xs text-white/60 text-center max-w-[200px]">
                                            Rendering frames...
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                /* Fallback for non-animation exports (image/STL) */
                                <div className="py-10 space-y-8">
                                    {/* Export Type Badge */}
                                    <div className="flex justify-center">
                                        <div className={cn(
                                            "inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium",
                                            selectedKey === 'STL_MODEL'
                                                ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
                                                : "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                                        )}>
                                            {selectedKey === 'STL_MODEL' ? (
                                                <Box className="w-4 h-4" />
                                            ) : (
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                            )}
                                            <span>{selectedKey === 'STL_MODEL' ? '3D Model' : 'High-Res Image'}</span>
                                        </div>
                                    </div>

                                    {/* Circular Progress for static exports */}
                                    <div className="flex flex-col items-center justify-center text-center space-y-6">
                                        <div className="relative w-32 h-32 flex items-center justify-center">
                                            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-blue-500/20 blur-xl animate-pulse" />
                                            <svg className="w-full h-full -rotate-90 absolute">
                                                <defs>
                                                    <linearGradient id="progressGradientStatic" x1="0%" y1="0%" x2="100%" y2="100%">
                                                        <stop offset="0%" stopColor="#3B82F6" />
                                                        <stop offset="50%" stopColor="#8B5CF6" />
                                                        <stop offset="100%" stopColor="#06B6D4" />
                                                    </linearGradient>
                                                </defs>
                                                <circle cx="64" cy="64" r="56" fill="none" stroke="currentColor" strokeWidth="6" className="text-gray-100 dark:text-gray-700/50" />
                                                <circle cx="64" cy="64" r="56" fill="none" stroke="url(#progressGradientStatic)" strokeWidth="6" strokeDasharray={351.86} strokeDashoffset={351.86 * (1 - activeProgress / 100)} strokeLinecap="round" className="transition-all duration-700 ease-out drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
                                            </svg>
                                            <div className="relative z-10 flex flex-col items-center">
                                                <span className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900 dark:from-white dark:via-gray-200 dark:to-white bg-clip-text text-transparent">
                                                    {activeProgress}%
                                                </span>
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                                                <span className="text-lg font-semibold text-gray-900 dark:text-white">{activeStage}</span>
                                            </div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs leading-relaxed">
                                                Preparing your high-resolution file. Please keep this window open.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Progress Bar - Always visible */}
                        <div className="space-y-2 mt-6 px-2">
                            <div className="relative w-full h-1.5 bg-gray-100 dark:bg-gray-700/50 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 transition-all duration-700 ease-out rounded-full"
                                    style={{ width: `${activeProgress}%` }}
                                />
                            </div>
                            <div className="flex justify-between items-center text-xs text-gray-400 dark:text-gray-500">
                                <span>Processing...</span>
                                <span className="font-mono">{activeProgress}% complete</span>
                            </div>
                        </div>
                    </div>
                ) : isExportLimitReached ? (
                    /* Limit Reached State */
                    <div className="py-6 space-y-6">
                        {/* Header Section */}
                        <div className="flex flex-col items-center justify-center text-center space-y-2">
                            <div className="space-y-1">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center justify-center gap-2">
                                    <Clock className="w-6 h-6 text-amber-500" />
                                    Daily Limit Reached
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    You&apos;ve used your {exportUsage?.limit} free exports for today.
                                </p>
                            </div>

                            {countdown && (
                                <div className="mt-2 text-sm font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-3 py-1 rounded-full border border-amber-100 dark:border-amber-900/30">
                                    Next free export in {countdown}
                                </div>
                            )}
                        </div>

                        {/* CTA Section - Different for Anon vs Authenticated */}
                        {!isAuthenticated ? (
                            <LoginWall />
                        ) : (
                            /* Upgrade CTA for Logged In Users */
                            <div className="bg-gradient-to-r from-indigo-500 from-10% via-sky-500 via-30% to-emerald-500 to-90% p-[1px] rounded-xl">
                                <div className="bg-white dark:bg-gray-900 rounded-[11px] p-5">
                                    <div className="text-center space-y-3">
                                        <div className="flex items-center justify-center gap-2">
                                            <Sparkles className="w-5 h-5 text-amber-500 fill-amber-500" />
                                            <h4 className="font-bold text-gray-900 dark:text-white">
                                                Upgrade to Carto Plus
                                            </h4>
                                        </div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            Get unlimited exports, Custom Markers & Routes, GIF/Video animations, and more.
                                        </p>
                                        <button
                                            onClick={handleUpgrade}
                                            className="w-full py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-semibold hover:scale-[1.02] active:scale-[0.98] transition-transform"
                                        >
                                            Upgrade Now
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <>
                        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                            <TabsList className="grid w-full grid-cols-3 mb-6">
                                <TabsTrigger value="image" className="flex items-center gap-2 text-xs sm:text-sm">
                                    <ImageIcon className="w-4 h-4" />
                                    <span className="hidden sm:inline">Image</span>
                                </TabsTrigger>
                                <TabsTrigger value="animation" className="flex items-center gap-2 text-xs sm:text-sm">
                                    <FilmIcon className="w-4 h-4" />
                                    <span className="hidden sm:inline">Animation</span>
                                </TabsTrigger>
                                <TabsTrigger value="3d" className="flex items-center gap-2 text-xs sm:text-sm">
                                    <BoxIcon className="w-4 h-4" />
                                    <span className="hidden sm:inline">3D</span>
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="image" className="mt-0 focus-visible:outline-none animate-in fade-in slide-in-from-right-4 duration-300">
                                {/* Remaining exports indicator for free tier */}
                                {subscriptionTier === 'free' && exportUsage && exportUsage.limit !== Infinity && (
                                    shouldShowUpgradeNudge ? (
                                        /* Upgrade nudge when running low on exports */
                                        <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-rose-500/10 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-4">
                                            <div className="flex items-start gap-3">
                                                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                                                    <Sparkles className="w-5 h-5 text-white" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="font-semibold text-gray-900 dark:text-white">
                                                            {exportUsage.remaining === 1 ? 'Last export today!' : `Only ${exportUsage.remaining} exports left`}
                                                        </span>
                                                        <span className="text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 rounded-full">
                                                            {exportUsage.remaining}/{exportUsage.limit}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                                        Upgrade for unlimited exports, plus GIF animations, video exports, and custom markers.
                                                    </p>
                                                    <button
                                                        onClick={handleUpgrade}
                                                        className="text-sm font-medium text-amber-700 dark:text-amber-300 hover:text-amber-800 dark:hover:text-amber-200 flex items-center gap-1 group"
                                                    >
                                                        Upgrade to Plus
                                                        <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        /* Standard exports counter when not running low */
                                        <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 px-4 py-2.5 rounded-xl border border-blue-100 dark:border-blue-800 mb-4">
                                            <span className="text-sm text-blue-700 dark:text-blue-300">
                                                Exports remaining today
                                            </span>
                                            <span className="font-semibold text-blue-700 dark:text-blue-300">
                                                {exportUsage.remaining}/{exportUsage.limit}
                                            </span>
                                        </div>
                                    )
                                )}

                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                                    Select the resolution for your export. Higher resolution results in better print quality but larger file size.
                                </p>

                                <div className="space-y-6">
                                    {/* Margin Control - Quick adjustment */}
                                    <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                                        <div className="flex justify-between items-center mb-2">
                                            <ControlLabel className="mb-0">Map Padding (Margin)</ControlLabel>
                                            <span className="text-xs font-mono text-gray-500">{format.margin}%</span>
                                        </div>
                                        <ControlSlider
                                            min="0"
                                            max="20"
                                            step="0.5"
                                            value={format.margin}
                                            onValueChange={(value) => onFormatChange({ margin: value })}
                                        />
                                    </div>

                                    {/* Print Category */}
                                    <div>
                                        <div className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Printing & Physical</div>
                                        <div className="space-y-3">
                                            {Object.entries(EXPORT_RESOLUTIONS).filter(([key]) => !['THUMBNAIL', 'PHONE_WALLPAPER', 'LAPTOP_WALLPAPER', 'DESKTOP_4K'].includes(key)).map(([key, base]) => {
                                                const res = calculateTargetResolution(
                                                    base as BaseExportResolution,
                                                    format.aspectRatio,
                                                    format.orientation
                                                );
                                                const physical = getPhysicalDimensions(res.width, res.height, res.dpi);
                                                const isSelected = selectedKey === key;

                                                return (
                                                    <button
                                                        key={key}
                                                        onClick={() => setSelectedKey(key)}
                                                        className={cn(
                                                            "w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all text-left",
                                                            isSelected
                                                                ? "border-blue-500 bg-blue-50/50 dark:bg-blue-900/20"
                                                                : "border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-800"
                                                        )}
                                                    >
                                                        <div className="flex-1">
                                                            <div className="flex items-center justify-between mb-1">
                                                                <div className="font-semibold text-gray-900 dark:text-white">{res.name}</div>
                                                                {isSelected && <Check className="w-5 h-5 text-blue-500" />}
                                                            </div>
                                                            {res.description && (
                                                                <div className="text-xs text-gray-400 dark:text-gray-500 mb-2">
                                                                    {res.description}
                                                                </div>
                                                            )}
                                                            <div className="text-xs font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
                                                                <span>{res.width} × {res.height} px</span>
                                                                <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                                                                <span>{physical}</span>
                                                                <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                                                                <span>{res.dpi} DPI</span>
                                                            </div>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Digital Category */}
                                    <div>
                                        <div className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Digital & Wallpaper</div>
                                        <div className="space-y-3">
                                            {Object.entries(EXPORT_RESOLUTIONS).filter(([key]) => ['THUMBNAIL', 'PHONE_WALLPAPER', 'LAPTOP_WALLPAPER', 'DESKTOP_4K'].includes(key)).map(([key, base]) => {
                                                const res = calculateTargetResolution(
                                                    base as BaseExportResolution,
                                                    format.aspectRatio,
                                                    format.orientation
                                                );
                                                const isSelected = selectedKey === key;

                                                return (
                                                    <button
                                                        key={key}
                                                        onClick={() => setSelectedKey(key)}
                                                        className={cn(
                                                            "w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all text-left",
                                                            isSelected
                                                                ? "border-blue-500 bg-blue-50/50 dark:bg-blue-900/20"
                                                                : "border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-800"
                                                        )}
                                                    >
                                                        <div className="flex-1">
                                                            <div className="flex items-center justify-between mb-1">
                                                                <div className="font-semibold text-gray-900 dark:text-white">{res.name}</div>
                                                                {isSelected && <Check className="w-5 h-5 text-blue-500" />}
                                                            </div>
                                                            {res.description && (
                                                                <div className="text-xs text-gray-400 dark:text-gray-500 mb-2">
                                                                    {res.description}
                                                                </div>
                                                            )}
                                                            <div className="text-xs font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
                                                                <span>{res.width} × {res.height} px</span>
                                                            </div>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>

                                {/* Upgrade Callout */}
                                {isPaywallEnabled && subscriptionTier === 'free' && (
                                    <div className="mt-6 bg-gradient-to-r from-indigo-500 from-10% via-sky-500 via-30% to-emerald-500 to-90% p-[1px] rounded-xl">
                                        <div className="bg-white dark:bg-gray-900 rounded-[11px] p-4">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                                        <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500" />
                                                        Unlock Premium Exports
                                                    </h3>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                        Get unlimited GIF & Video exports.
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={handleUpgrade}
                                                    className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg text-sm font-medium whitespace-nowrap hover:scale-105 transition-transform"
                                                >
                                                    Upgrade
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </TabsContent>

                            <TabsContent value="animation" className="mt-0 focus-visible:outline-none animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="space-y-6">
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Create animated loops and videos. Unlock full quality with Carto Plus.
                                    </p>

                                    {/* GIF Export */}
                                    <div className="space-y-3">
                                        <button
                                            onClick={() => {
                                                if (isLocked('ORBIT_GIF')) {
                                                    if (isAuthenticated) {
                                                        trackEventAction({
                                                            eventType: 'upgrade_nudge_clicked',
                                                            eventName: 'locked_feature_gif',
                                                            sessionId: getSessionId()
                                                        }).catch(() => { });
                                                    }
                                                    handleUpgrade();
                                                } else {
                                                    setSelectedKey('ORBIT_GIF');
                                                }
                                            }}
                                            className={cn(
                                                "w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all text-left group",
                                                isLocked('ORBIT_GIF')
                                                    ? "border-amber-200 dark:border-amber-800/50 bg-gradient-to-br from-amber-50/50 to-orange-50/30 dark:from-amber-900/10 dark:to-orange-900/5 hover:border-amber-300 dark:hover:border-amber-700"
                                                    : selectedKey === 'ORBIT_GIF'
                                                        ? "border-blue-500 bg-blue-50/50 dark:bg-blue-900/20"
                                                        : "border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-800"
                                            )}
                                        >
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between mb-1">
                                                    <div className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                                        <Film className="w-4 h-4 text-purple-500" />
                                                        Orbit GIF
                                                        {isLocked('ORBIT_GIF') && (
                                                            <span className="flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400">
                                                                <Lock className="w-3 h-3" />
                                                            </span>
                                                        )}
                                                    </div>
                                                    {isLocked('ORBIT_GIF') ? (
                                                        <span className="text-xs font-medium text-amber-600 dark:text-amber-400 group-hover:underline">
                                                            Unlock
                                                        </span>
                                                    ) : selectedKey === 'ORBIT_GIF' ? (
                                                        <Check className="w-5 h-5 text-blue-500" />
                                                    ) : null}
                                                </div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                                                    {isLocked('ORBIT_GIF')
                                                        ? "Create stunning animated orbits around your map. Perfect for social media."
                                                        : "Animated orbit of your map location."}
                                                </div>
                                                {!isLocked('ORBIT_GIF') && (
                                                    <div className="text-xs font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
                                                        <span>{gifDuration}s</span>
                                                        <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                                                        <span>{gifFps} FPS</span>
                                                        <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                                                        <span>{gifRotation}° rotation</span>
                                                    </div>
                                                )}
                                            </div>
                                        </button>

                                        {/* GIF Configuration */}
                                        {selectedKey === 'ORBIT_GIF' && (
                                            <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 space-y-4 animate-in slide-in-from-top-2 duration-200">
                                                {/* Duration Slider */}
                                                <div>
                                                    <div className="flex items-center justify-between mb-2">
                                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Duration</label>
                                                        <span className="text-sm text-gray-500 dark:text-gray-400">{gifDuration}s</span>
                                                    </div>
                                                    <input
                                                        type="range"
                                                        min="1"
                                                        max="10"
                                                        step="1"
                                                        value={gifDuration}
                                                        onChange={(e) => setGifDuration(Number(e.target.value))}
                                                        className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                                                    />
                                                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                                                        <span>1s</span>
                                                        <span>10s</span>
                                                    </div>
                                                </div>

                                                {/* Rotation Slider */}
                                                <div>
                                                    <div className="flex items-center justify-between mb-2">
                                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Rotation</label>
                                                        <span className="text-sm text-gray-500 dark:text-gray-400">{gifRotation}°</span>
                                                    </div>
                                                    <input
                                                        type="range"
                                                        min="0"
                                                        max="720"
                                                        step="45"
                                                        value={gifRotation}
                                                        onChange={(e) => setGifRotation(Number(e.target.value))}
                                                        className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                                                    />
                                                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                                                        <span>0°</span>
                                                        <span>360°</span>
                                                        <span>720°</span>
                                                    </div>
                                                </div>

                                                {/* FPS Slider */}
                                                <div>
                                                    <div className="flex items-center justify-between mb-2">
                                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Frames Per Second (FPS)</label>
                                                        <span className="text-sm text-gray-500 dark:text-gray-400">{gifFps} fps</span>
                                                    </div>
                                                    <input
                                                        type="range"
                                                        min="5"
                                                        max="50"
                                                        step="1"
                                                        value={gifFps}
                                                        onChange={(e) => setGifFps(Number(e.target.value))}
                                                        className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                                                    />
                                                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                                                        <span>5 fps</span>
                                                        <span>50 fps</span>
                                                    </div>
                                                </div>

                                                {/* Animation Mode */}
                                                <div>
                                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Animation Type</label>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        {[
                                                            { id: 'orbit', label: 'Orbit', icon: RotateCw, desc: '360° rotation' },
                                                            { id: 'cinematic', label: 'Cinematic', icon: Film, desc: 'Dynamic swoop' },
                                                            { id: 'spiral', label: 'Spiral', icon: Tornado, desc: 'Rotate & Zoom' },
                                                            { id: 'flyover', label: 'Flyover', icon: Plane, desc: 'Move Forward' },
                                                            { id: 'rise', label: 'Rise', icon: TrendingUp, desc: 'Pitch Up' },
                                                            { id: 'dive', label: 'Dive', icon: TrendingDown, desc: 'Pitch Down' },
                                                            { id: 'swoopIn', label: 'Swoop In', icon: PlaneLanding, desc: 'Start high, swoop down' },
                                                            { id: 'rocketOut', label: 'Rocket Out', icon: Rocket, desc: 'Start low, fly up' },
                                                        ].map((mode) => (
                                                            <button
                                                                key={mode.id}
                                                                onClick={() => setGifAnimationMode(mode.id as any)}
                                                                className={cn(
                                                                    "flex flex-col items-center justify-center py-3 px-2 rounded-lg border text-center transition-all h-24",
                                                                    gifAnimationMode === mode.id
                                                                        ? "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-300 shadow-sm"
                                                                        : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400"
                                                                )}
                                                            >
                                                                <mode.icon className="w-5 h-5 mb-2" />
                                                                <span className="text-sm font-medium leading-none mb-1">{mode.label}</span>
                                                                <span className="text-[10px] opacity-70 leading-tight">{mode.desc}</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Video Export */}
                                    <div className="space-y-3">
                                        <button
                                            onClick={() => {
                                                if (isLocked('ORBIT_VIDEO')) {
                                                    if (isAuthenticated) {
                                                        trackEventAction({
                                                            eventType: 'upgrade_nudge_clicked',
                                                            eventName: 'locked_feature_video',
                                                            sessionId: getSessionId()
                                                        }).catch(() => { });
                                                    }
                                                    handleUpgrade();
                                                } else {
                                                    setSelectedKey('ORBIT_VIDEO');
                                                }
                                            }}
                                            className={cn(
                                                "w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all text-left group",
                                                isLocked('ORBIT_VIDEO')
                                                    ? "border-rose-200 dark:border-rose-800/50 bg-gradient-to-br from-rose-50/50 to-pink-50/30 dark:from-rose-900/10 dark:to-pink-900/5 hover:border-rose-300 dark:hover:border-rose-700"
                                                    : selectedKey === 'ORBIT_VIDEO'
                                                        ? "border-blue-500 bg-blue-50/50 dark:bg-blue-900/20"
                                                        : "border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-800"
                                            )}
                                        >
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between mb-1">
                                                    <div className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                                        <Film className="w-4 h-4 text-rose-500" />
                                                        Orbit Video
                                                        {isLocked('ORBIT_VIDEO') && (
                                                            <span className="flex items-center gap-1 text-xs font-medium text-rose-600 dark:text-rose-400">
                                                                <Lock className="w-3 h-3" />
                                                            </span>
                                                        )}
                                                    </div>
                                                    {isLocked('ORBIT_VIDEO') ? (
                                                        <span className="text-xs font-medium text-rose-600 dark:text-rose-400 group-hover:underline">
                                                            Unlock
                                                        </span>
                                                    ) : selectedKey === 'ORBIT_VIDEO' ? (
                                                        <Check className="w-5 h-5 text-blue-500" />
                                                    ) : null}
                                                </div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                                                    {isLocked('ORBIT_VIDEO')
                                                        ? "Export high-quality MP4 videos with smooth 60fps. Share anywhere."
                                                        : "High quality video orbit."}
                                                </div>
                                                {!isLocked('ORBIT_VIDEO') && (
                                                    <div className="text-xs font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
                                                        <span>{videoDuration}s</span>
                                                        <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                                                        <span>{videoFps} FPS</span>
                                                        <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                                                        <span>{videoRotation}° rotation</span>
                                                    </div>
                                                )}
                                            </div>
                                        </button>

                                        {/* Video Configuration */}
                                        {selectedKey === 'ORBIT_VIDEO' && (
                                            <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 space-y-4 animate-in slide-in-from-top-2 duration-200">
                                                {/* Duration Slider */}
                                                <div>
                                                    <div className="flex items-center justify-between mb-2">
                                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Duration</label>
                                                        <span className="text-sm text-gray-500 dark:text-gray-400">{videoDuration}s</span>
                                                    </div>
                                                    <input
                                                        type="range"
                                                        min="1"
                                                        max="20"
                                                        step="1"
                                                        value={videoDuration}
                                                        onChange={(e) => setVideoDuration(Number(e.target.value))}
                                                        className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                                                    />
                                                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                                                        <span>1s</span>
                                                        <span>20s</span>
                                                    </div>

                                                </div>

                                                {/* Rotation Slider */}
                                                <div>
                                                    <div className="flex items-center justify-between mb-2">
                                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Rotation</label>
                                                        <span className="text-sm text-gray-500 dark:text-gray-400">{videoRotation}°</span>
                                                    </div>
                                                    <input
                                                        type="range"
                                                        min="0"
                                                        max="720"
                                                        step="45"
                                                        value={videoRotation}
                                                        onChange={(e) => setVideoRotation(Number(e.target.value))}
                                                        className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                                                    />
                                                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                                                        <span>0°</span>
                                                        <span>360°</span>
                                                        <span>720°</span>
                                                    </div>
                                                </div>

                                                {/* FPS Slider */}
                                                <div>
                                                    <div className="flex items-center justify-between mb-2">
                                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Frames Per Second (FPS)</label>
                                                        <span className="text-sm text-gray-500 dark:text-gray-400">{videoFps} fps</span>
                                                    </div>
                                                    <input
                                                        type="range"
                                                        min="15"
                                                        max="120"
                                                        step="5"
                                                        value={videoFps}
                                                        onChange={(e) => setVideoFps(Number(e.target.value))}
                                                        className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                                                    />
                                                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                                                        <span>15 fps</span>
                                                        <span>120 fps</span>
                                                    </div>
                                                </div>

                                                {/* Animation Mode */}
                                                <div>
                                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Animation Type</label>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        {[
                                                            { id: 'orbit', label: 'Orbit', icon: RotateCw, desc: '360° rotation' },
                                                            { id: 'cinematic', label: 'Cinematic', icon: Film, desc: 'Dynamic swoop' },
                                                            { id: 'spiral', label: 'Spiral', icon: Tornado, desc: 'Rotate & Zoom' },
                                                            { id: 'flyover', label: 'Flyover', icon: Plane, desc: 'Move Forward' },
                                                            { id: 'rise', label: 'Rise', icon: TrendingUp, desc: 'Pitch Up' },
                                                            { id: 'dive', label: 'Dive', icon: TrendingDown, desc: 'Pitch Down' },
                                                            { id: 'swoopIn', label: 'Swoop In', icon: PlaneLanding, desc: 'Start high, swoop down' },
                                                            { id: 'rocketOut', label: 'Rocket Out', icon: Rocket, desc: 'Start low, fly up' },
                                                        ].map((mode) => (
                                                            <button
                                                                key={mode.id}
                                                                onClick={() => setVideoAnimationMode(mode.id as any)}
                                                                className={cn(
                                                                    "flex flex-col items-center justify-center py-3 px-2 rounded-lg border text-center transition-all h-24",
                                                                    videoAnimationMode === mode.id
                                                                        ? "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-300 shadow-sm"
                                                                        : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400"
                                                                )}
                                                            >
                                                                <mode.icon className="w-5 h-5 mb-2" />
                                                                <span className="text-sm font-medium leading-none mb-1">{mode.label}</span>
                                                                <span className="text-[10px] opacity-70 leading-tight">{mode.desc}</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="3d" className="mt-0 focus-visible:outline-none animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="space-y-6">
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Export a 3D model of your map for 3D printing.
                                    </p>

                                    <div className="space-y-3">
                                        <button
                                            onClick={() => {
                                                if (isLocked('STL_MODEL')) {
                                                    if (isAuthenticated) {
                                                        trackEventAction({
                                                            eventType: 'upgrade_nudge_clicked',
                                                            eventName: 'locked_feature_stl',
                                                            sessionId: getSessionId()
                                                        }).catch(() => { });
                                                    }
                                                    handleUpgrade();
                                                } else {
                                                    setSelectedKey('STL_MODEL');
                                                }
                                            }}
                                            className={cn(
                                                "w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all text-left group",
                                                isLocked('STL_MODEL')
                                                    ? "border-emerald-200 dark:border-emerald-800/50 bg-gradient-to-br from-emerald-50/50 to-teal-50/30 dark:from-emerald-900/10 dark:to-teal-900/5 hover:border-emerald-300 dark:hover:border-emerald-700"
                                                    : selectedKey === 'STL_MODEL'
                                                        ? "border-blue-500 bg-blue-50/50 dark:bg-blue-900/20"
                                                        : "border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-800"
                                            )}
                                        >
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between mb-1">
                                                    <div className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                                        <Box className="w-4 h-4 text-emerald-500" />
                                                        STL Model (3D Print)
                                                        {isLocked('STL_MODEL') && (
                                                            <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                                                                <Lock className="w-3 h-3" />
                                                            </span>
                                                        )}
                                                    </div>
                                                    {isLocked('STL_MODEL') ? (
                                                        <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 group-hover:underline">
                                                            Unlock
                                                        </span>
                                                    ) : selectedKey === 'STL_MODEL' ? (
                                                        <Check className="w-5 h-5 text-blue-500" />
                                                    ) : null}
                                                </div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                                                    {isLocked('STL_MODEL')
                                                        ? "Export elevation data as a 3D printable STL file. Bring your map to life."
                                                        : "3D printable STL file."}
                                                </div>
                                                {!isLocked('STL_MODEL') && (
                                                    <div className="text-xs font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
                                                        <span>Height: {stlModelHeight}mm</span>
                                                        <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                                                        <span className="capitalize">{stlResolution} detail</span>
                                                    </div>
                                                )}
                                            </div>
                                        </button>

                                        {/* STL Configuration */}
                                        {selectedKey === 'STL_MODEL' && (
                                            <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 space-y-4 animate-in slide-in-from-top-2 duration-200">
                                                {/* Model Height Slider */}
                                                <div>
                                                    <div className="flex items-center justify-between mb-2">
                                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Model Base Height (mm)</label>
                                                        <span className="text-sm text-gray-500 dark:text-gray-400">{stlModelHeight}mm</span>
                                                    </div>
                                                    <input
                                                        type="range"
                                                        min="1"
                                                        max="20"
                                                        step="0.5"
                                                        value={stlModelHeight}
                                                        onChange={(e) => setStlModelHeight(Number(e.target.value))}
                                                        className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                                                    />
                                                </div>

                                                {/* Resolution Selection */}
                                                <div>
                                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Mesh Resolution</label>
                                                    <div className="grid grid-cols-3 gap-2">
                                                        {[
                                                            { id: 'low', label: 'Low', desc: 'Faster' },
                                                            { id: 'medium', label: 'Medium', desc: 'Balanced' },
                                                            { id: 'high', label: 'High', desc: 'More Detail' },
                                                        ].map((res) => (
                                                            <button
                                                                key={res.id}
                                                                onClick={() => setStlResolution(res.id as 'low' | 'medium' | 'high')}
                                                                className={cn(
                                                                    "flex flex-col items-center justify-center p-2 rounded-lg border text-center transition-all",
                                                                    stlResolution === res.id
                                                                        ? "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-300 shadow-sm"
                                                                        : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400"
                                                                )}
                                                            >
                                                                <span className="text-sm font-medium mb-0.5">{res.label}</span>
                                                                <span className="text-[10px] opacity-70">{res.desc}</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-xs text-blue-700 dark:text-blue-300">
                                                    <Box className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                                    <p>
                                                        The STL will correspond to the currently visible map area. Buildings are extruded based on their height.
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </>
                )}
            </div>


            {!isExportLimitReached && (
                <div className="p-6 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700 space-y-3">
                    <button
                        onClick={() => {
                            if (selectedKey === 'ORBIT_GIF') {
                                onExport(
                                    { width: 0, height: 0, dpi: 72, name: 'ORBIT_GIF' },
                                    { duration: gifDuration, totalRotation: gifRotation, fps: gifFps, animationMode: gifAnimationMode }
                                );
                            } else if (selectedKey === 'ORBIT_VIDEO') {
                                onExport(
                                    { width: 0, height: 0, dpi: 72, name: 'ORBIT_VIDEO' },
                                    undefined,
                                    { duration: videoDuration, totalRotation: videoRotation, fps: videoFps, animationMode: videoAnimationMode }
                                );
                            } else if (selectedKey === 'STL_MODEL') {
                                onExport(
                                    { width: 0, height: 0, dpi: 72, name: 'STL_MODEL' },
                                    undefined,
                                    undefined,
                                    { modelHeight: stlModelHeight, resolution: stlResolution }
                                );
                            } else {
                                const base = EXPORT_RESOLUTIONS[selectedKey as ExportResolutionKey];
                                const res = calculateTargetResolution(
                                    base,
                                    format.aspectRatio,
                                    format.orientation
                                );
                                onExport(res);
                            }
                        }}

                        disabled={isExporting}
                        className={cn(
                            "w-full py-3 rounded-xl font-semibold shadow-lg transition-all",
                            "bg-gray-900 dark:bg-white text-white dark:text-gray-900",
                            "hover:scale-[1.02] active:scale-[0.98]",
                            "disabled:opacity-50 disabled:cursor-not-allowed"
                        )}
                    >
                        {isExporting ? 'Export in progress...' : 'Export'}
                    </button>

                </div>
            )}
        </div>
    );

    if (inline) return modalContent;

    return (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={() => !isExporting && handleClose()}
            />

            {modalContent}
        </div>
    );
}
