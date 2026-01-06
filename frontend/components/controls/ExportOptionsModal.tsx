'use client';


import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { X, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getSessionId } from '@/lib/utils';
import { ControlSlider, ControlLabel } from '@/components/ui/control-components';
import { EXPORT_RESOLUTIONS, DEFAULT_EXPORT_RESOLUTION, type ExportResolutionKey } from '@/lib/export/constants';
import { calculateTargetResolution, getPhysicalDimensions, type ExportResolution, type BaseExportResolution } from '@/lib/export/resolution';
import type { PosterConfig } from '@/types/poster';
import type { GifExportOptions } from '@/hooks/useGifExport';
import type { VideoExportOptions } from '@/hooks/useVideoExport';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';
import { Sparkles, Lock, Check } from 'lucide-react';
import { createCheckoutSession } from '@/lib/actions/subscription';
import { Film, RotateCw, Box } from 'lucide-react';
import { trackEventAction } from '@/lib/actions/events';
import type { ExportUsageResult } from '@/lib/actions/usage.types';

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
    format: PosterConfig['format'];
    onFormatChange: (format: Partial<PosterConfig['format']>) => void;
    subscriptionTier?: 'free' | 'carto_plus';
    exportUsage?: ExportUsageResult | null;
    isAuthenticated?: boolean;
}

export function ExportOptionsModal({
    isOpen,
    onClose,
    onExport,
    isExporting,
    exportProgress,
    gifProgress,
    videoProgress,
    format,
    onFormatChange,
    subscriptionTier = 'free',
    exportUsage,
    isAuthenticated = false
}: ExportOptionsModalProps) {
    const router = useRouter();
    const [selectedKey, setSelectedKey] = useState<string>('SMALL');
    const [gifDuration, setGifDuration] = useState(7);
    const [gifRotation, setGifRotation] = useState(90);
    const [gifFps, setGifFps] = useState(20);
    const [videoDuration, setVideoDuration] = useState(5);
    const [videoRotation, setVideoRotation] = useState(360);
    const [videoFps, setVideoFps] = useState(60);
    const [gifAnimationMode, setGifAnimationMode] = useState<'orbit' | 'cinematic'>('orbit');
    const [videoAnimationMode, setVideoAnimationMode] = useState<'orbit' | 'cinematic'>('orbit');
    const [stlModelHeight, setStlModelHeight] = useState(5);
    const [stlResolution, setStlResolution] = useState<'low' | 'medium' | 'high'>('medium');
    const [countdown, setCountdown] = useState<string | null>(null);
    const hasTrackedPaywallRef = useRef(false);
    const isGifExportEnabled = useFeatureFlag('gif_export');
    const isVideoExportEnabled = useFeatureFlag('video_export');
    const isStlExportEnabled = useFeatureFlag('stl_export');
    const isPaywallEnabled = useFeatureFlag('carto_plus');

    const isExportLimitReached = exportUsage && !exportUsage.allowed && subscriptionTier === 'free';

    // Track paywall shown event
    // Track paywall/login wall shown event
    useEffect(() => {
        if (!isOpen) {
            hasTrackedPaywallRef.current = false;
            return;
        }

        if (isOpen && isExportLimitReached && !hasTrackedPaywallRef.current) {
            const eventType = isAuthenticated ? 'paywall_shown' : 'login_wall_shown';
            console.log(`Tracking ${eventType} event`);

            trackEventAction({
                eventType,
                eventName: 'export_limit_reached',
                sessionId: getSessionId(),
                metadata: {
                    limit: exportUsage?.limit,
                    used: exportUsage?.used
                }
            });
            hasTrackedPaywallRef.current = true;
        }
    }, [isOpen, isExportLimitReached, exportUsage, isAuthenticated]);

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
        // Pass current search params to preserve state on redirect
        const searchParams = typeof window !== 'undefined' ? window.location.search.substring(1) : '';
        await createCheckoutSession(searchParams);
    };

    const handleSignUp = () => {
        const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
        router.push(`/register?next=${returnUrl}`);
    };

    // Determine current progress
    const activeProgress = exportProgress?.percent ?? gifProgress ?? videoProgress ?? 0;
    const activeStage = exportProgress?.stage ?? (gifProgress !== undefined ? 'Generating GIF...' : (videoProgress !== undefined ? 'Recording Video...' : 'Preparing...'));

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={() => !isExporting && onClose()}
            />

            {/* Content */}
            <div className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-t-2xl md:rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom md:zoom-in-95 duration-200 pb-safe">
                <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        {isExporting ? 'Exporting Poster' : 'Export Options'}
                    </h2>
                    {!isExporting && (
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    )}
                </div>

                <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                    {isExporting ? (
                        <div className="py-8 space-y-8 animate-in fade-in zoom-in-95 duration-300">
                            <div className="flex flex-col items-center justify-center text-center space-y-4">
                                <div className="relative w-24 h-24 flex items-center justify-center">
                                    <svg className="w-full h-full -rotate-90">
                                        <circle
                                            cx="48"
                                            cy="48"
                                            r="40"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="8"
                                            className="text-gray-100 dark:text-gray-700"
                                        />
                                        <circle
                                            cx="48"
                                            cy="48"
                                            r="40"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="8"
                                            strokeDasharray={251.32}
                                            strokeDashoffset={251.32 * (1 - activeProgress / 100)}
                                            strokeLinecap="round"
                                            className="text-blue-500 transition-all duration-500 ease-out"
                                        />
                                    </svg>
                                    <span className="absolute text-xl font-bold text-gray-900 dark:text-white">
                                        {activeProgress}%
                                    </span>
                                </div>
                                <div className="space-y-2">
                                    <div className="text-lg font-semibold text-gray-900 dark:text-white">
                                        {activeStage}
                                    </div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Please keep this window open while we prepare your high-resolution file.
                                    </p>
                                </div>
                            </div>

                            {/* Progress bar (linear fallback/secondary) */}
                            <div className="space-y-2">
                                <div className="w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-blue-500 transition-all duration-500 ease-out"
                                        style={{ width: `${activeProgress}%` }}
                                    />
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
                                <div className="relative overflow-hidden rounded-2xl border border-blue-100 dark:border-blue-900 bg-white dark:bg-gray-800 shadow-sm">
                                    {/* Gradient Background Effect */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 opacity-50" />

                                    <div className="relative p-6 space-y-6">
                                        <div className="space-y-4">
                                            <div className="flex items-start gap-4">
                                                <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-xl">
                                                    <Sparkles className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                                </div>
                                                <div className="space-y-1">
                                                    <h4 className="font-bold text-gray-900 dark:text-white text-lg">
                                                        Unlock More with a Free Account
                                                    </h4>
                                                    <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                                                        Join thousands of map creators and get immediate access to more features.
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Benefits List */}
                                            <div className="space-y-3 pl-1">
                                                <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-200">
                                                    <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                                                        <Check className="w-3 h-3 text-green-600 dark:text-green-400" />
                                                    </div>
                                                    <span className="font-medium">5 free exports every day</span>
                                                </div>
                                                <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-200">
                                                    <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                                                        <Check className="w-3 h-3 text-green-600 dark:text-green-400" />
                                                    </div>
                                                    <span className="font-medium">Save your maps to cloud</span>
                                                </div>
                                                <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-200">
                                                    <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                                                        <Check className="w-3 h-3 text-green-600 dark:text-green-400" />
                                                    </div>
                                                    <span className="font-medium">Access export history</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-3 pt-2">
                                            <button
                                                onClick={handleSignUp}
                                                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                                            >
                                                Create Free Account
                                            </button>
                                            <div className="text-center">
                                                <button
                                                    onClick={() => router.push('/login')}
                                                    className="text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors font-medium"
                                                >
                                                    Already have an account? Sign in
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
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
                                                Get unlimited exports, GIF/Video animations, and more.
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
                            {/* Remaining exports indicator for free tier */}
                            {subscriptionTier === 'free' && exportUsage && exportUsage.limit !== Infinity && (
                                <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 px-4 py-2.5 rounded-xl border border-blue-100 dark:border-blue-800 mb-4">
                                    <span className="text-sm text-blue-700 dark:text-blue-300">
                                        Exports remaining today
                                    </span>
                                    <span className="font-semibold text-blue-700 dark:text-blue-300">
                                        {exportUsage.remaining}/{exportUsage.limit}
                                    </span>
                                </div>
                            )}

                            <p className="text-sm text-gray-500 dark:text-gray-400">
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
                                {/* Animation Category - only show when gif_export feature flag is enabled */}
                                {isGifExportEnabled && (
                                    <div>
                                        <div className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Animation</div>
                                        <div className="space-y-3">
                                            <button
                                                onClick={() => setSelectedKey('ORBIT_GIF')}
                                                className={cn(
                                                    "w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all text-left",
                                                    selectedKey === 'ORBIT_GIF'
                                                        ? "border-blue-500 bg-blue-50/50 dark:bg-blue-900/20"
                                                        : "border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-800",
                                                    isLocked('ORBIT_GIF') && "opacity-60 cursor-not-allowed"
                                                )}
                                                disabled={isLocked('ORBIT_GIF')}
                                            >
                                                <div className="flex-1">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <div className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                                            Orbit GIF
                                                            {isLocked('ORBIT_GIF') && <Lock className="w-3.5 h-3.5 text-amber-500" />}
                                                        </div>
                                                        {selectedKey === 'ORBIT_GIF' && <Check className="w-5 h-5 text-blue-500" />}
                                                    </div>
                                                    <div className="text-xs text-gray-400 dark:text-gray-500 mb-2">
                                                        Animated orbit of your map location.
                                                    </div>
                                                    <div className="text-xs font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
                                                        <span>{gifDuration}s</span>
                                                        <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                                                        <span>{gifFps} FPS</span>
                                                        <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                                                        <span>{gifRotation}° rotation</span>
                                                        <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                                                        <span className="capitalize">{gifAnimationMode}</span>
                                                    </div>
                                                </div>
                                            </button>

                                            {/* GIF Configuration - only show when ORBIT_GIF is selected */}
                                            {selectedKey === 'ORBIT_GIF' && (
                                                <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 space-y-4">
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
                                                            <button
                                                                onClick={() => setGifAnimationMode('orbit')}
                                                                className={cn(
                                                                    "flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-sm font-medium transition-all",
                                                                    gifAnimationMode === 'orbit'
                                                                        ? "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-300"
                                                                        : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400"
                                                                )}
                                                            >
                                                                <RotateCw className="w-4 h-4" />
                                                                Orbit
                                                            </button>
                                                            <button
                                                                onClick={() => setGifAnimationMode('cinematic')}
                                                                className={cn(
                                                                    "flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-sm font-medium transition-all",
                                                                    gifAnimationMode === 'cinematic'
                                                                        ? "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-300"
                                                                        : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400"
                                                                )}
                                                            >
                                                                <Film className="w-4 h-4" />
                                                                Cinematic
                                                            </button>
                                                        </div>
                                                        <p className="text-[10px] text-gray-400 mt-1.5 leading-tight">
                                                            {gifAnimationMode === 'orbit'
                                                                ? "Simple rotation around the center point."
                                                                : "Pro camerawork: Top-down to 3D tilt + pull back + orbit."}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                                {/* Video Export */}
                                {isVideoExportEnabled && (
                                    <div>
                                        <div className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Video</div>
                                        <div className="space-y-3">
                                            <button
                                                onClick={() => !isLocked('ORBIT_VIDEO') && setSelectedKey('ORBIT_VIDEO')}
                                                className={cn(
                                                    "w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all text-left",
                                                    selectedKey === 'ORBIT_VIDEO'
                                                        ? "border-blue-500 bg-blue-50/50 dark:bg-blue-900/20"
                                                        : "border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-800",
                                                    isLocked('ORBIT_VIDEO') && "opacity-60 cursor-not-allowed"
                                                )}
                                                disabled={isLocked('ORBIT_VIDEO')}
                                            >
                                                <div className="flex-1">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <div className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                                            Orbit Video
                                                            {isLocked('ORBIT_VIDEO') && <Lock className="w-3.5 h-3.5 text-amber-500" />}
                                                        </div>
                                                        {selectedKey === 'ORBIT_VIDEO' && <Check className="w-5 h-5 text-blue-500" />}
                                                    </div>
                                                    <div className="text-xs text-gray-400 dark:text-gray-500 mb-2">
                                                        High quality video orbit.
                                                    </div>
                                                    <div className="text-xs font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
                                                        <span>{videoDuration}s</span>
                                                        <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                                                        <span>{videoFps} FPS</span>
                                                        <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                                                        <span>{videoRotation}° rotation</span>
                                                        <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                                                        <span className="capitalize">{videoAnimationMode}</span>
                                                    </div>
                                                </div>
                                            </button>

                                            {/* Video Configuration */}
                                            {selectedKey === 'ORBIT_VIDEO' && (
                                                <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 space-y-4">
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
                                                                <button
                                                                    onClick={() => setVideoAnimationMode('orbit')}
                                                                    className={cn(
                                                                        "flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-sm font-medium transition-all",
                                                                        videoAnimationMode === 'orbit'
                                                                            ? "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-300"
                                                                            : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400"
                                                                    )}
                                                                >
                                                                    <RotateCw className="w-4 h-4" />
                                                                    Orbit
                                                                </button>
                                                                <button
                                                                    onClick={() => setVideoAnimationMode('cinematic')}
                                                                    className={cn(
                                                                        "flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-sm font-medium transition-all",
                                                                        videoAnimationMode === 'cinematic'
                                                                            ? "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-300"
                                                                            : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400"
                                                                    )}
                                                                >
                                                                    <Film className="w-4 h-4" />
                                                                    Cinematic
                                                                </button>
                                                            </div>
                                                            <p className="text-[10px] text-gray-400 mt-1.5 leading-tight">
                                                                {videoAnimationMode === 'orbit'
                                                                    ? "Simple rotation around the center point."
                                                                    : "Pro camerawork: Top-down to 3D tilt + pull back + orbit."}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* STL Export */}
                                {isStlExportEnabled && (
                                    <div>
                                        <div className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">3D Fabrication</div>
                                        <div className="space-y-3">
                                            <button
                                                onClick={() => !isLocked('STL_MODEL') && setSelectedKey('STL_MODEL')}
                                                className={cn(
                                                    "w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all text-left",
                                                    selectedKey === 'STL_MODEL'
                                                        ? "border-blue-500 bg-blue-50/50 dark:bg-blue-900/20"
                                                        : "border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-800",
                                                    isLocked('STL_MODEL') && "opacity-60 cursor-not-allowed"
                                                )}
                                                disabled={isLocked('STL_MODEL')}
                                            >
                                                <div className="flex-1">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <div className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                                            3D Model (STL)
                                                            {isLocked('STL_MODEL') && <Lock className="w-3.5 h-3.5 text-amber-500" />}
                                                        </div>
                                                        {selectedKey === 'STL_MODEL' && <Check className="w-5 h-5 text-blue-500" />}
                                                    </div>
                                                    <div className="text-xs text-gray-400 dark:text-gray-500 mb-2">
                                                        Binary STL for 3D printing.
                                                    </div>
                                                    <div className="text-xs font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
                                                        <span>{stlModelHeight}mm Base</span>
                                                        <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                                                        <span className="capitalize">{stlResolution} Quality</span>
                                                    </div>
                                                </div>
                                                <Box className="w-8 h-8 text-gray-300 dark:text-gray-600 ml-4 group-hover:text-gray-400" />
                                            </button>

                                            {/* STL Configuration */}
                                            {selectedKey === 'STL_MODEL' && (
                                                <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 space-y-4">
                                                    {/* Base Height Slider */}
                                                    <div>
                                                        <div className="flex items-center justify-between mb-2">
                                                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Minimum Base Height</label>
                                                            <span className="text-sm text-gray-500 dark:text-gray-400">{stlModelHeight}mm</span>
                                                        </div>
                                                        <input
                                                            type="range"
                                                            min="1"
                                                            max="20"
                                                            step="1"
                                                            value={stlModelHeight}
                                                            onChange={(e) => setStlModelHeight(Number(e.target.value))}
                                                            className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                                                        />
                                                        <div className="flex justify-between text-xs text-gray-400 mt-1">
                                                            <span>1mm</span>
                                                            <span>20mm</span>
                                                        </div>
                                                    </div>

                                                    {/* Resolution Select */}
                                                    <div>
                                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Mesh Resolution</label>
                                                        <div className="grid grid-cols-3 gap-2">
                                                            {(['low', 'medium', 'high'] as const).map(res => (
                                                                <button
                                                                    key={res}
                                                                    onClick={() => setStlResolution(res)}
                                                                    className={cn(
                                                                        "flex flex-col items-center justify-center py-2 px-1 rounded-lg border text-xs font-medium transition-all capitalize",
                                                                        stlResolution === res
                                                                            ? "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-300"
                                                                            : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400"
                                                                    )}
                                                                >
                                                                    {res}
                                                                    <span className="text-[9px] font-normal opacity-70 mt-0.5">
                                                                        {res === 'low' ? '512px' : res === 'medium' ? '1024px' : '2048px'}
                                                                    </span>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
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
                        </>
                    )}
                </div>


                <div className="p-6 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700">
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
            </div>
        </div >
    );
}

