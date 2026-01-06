'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ControlSlider, ControlLabel } from '@/components/ui/control-components';
import { EXPORT_RESOLUTIONS, DEFAULT_EXPORT_RESOLUTION, type ExportResolutionKey } from '@/lib/export/constants';
import { calculateTargetResolution, getPhysicalDimensions, type ExportResolution, type BaseExportResolution } from '@/lib/export/resolution';
import type { PosterConfig } from '@/types/poster';
import type { GifExportOptions } from '@/hooks/useGifExport';
import type { VideoExportOptions } from '@/hooks/useVideoExport';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';
import { Sparkles, Lock, Check } from 'lucide-react';
import { createCheckoutSession } from '@/lib/actions/subscription';
import { Film, RotateCw } from 'lucide-react';

interface ExportOptionsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onExport: (resolution: ExportResolution, gifOptions?: GifExportOptions, videoOptions?: VideoExportOptions) => void;
    isExporting: boolean;
    exportProgress?: { stage: string; percent: number } | null;
    gifProgress?: number;
    videoProgress?: number;
    format: PosterConfig['format'];
    onFormatChange: (format: Partial<PosterConfig['format']>) => void;
    subscriptionTier?: 'free' | 'carto_plus';
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
    subscriptionTier = 'free'
}: ExportOptionsModalProps) {
    const [selectedKey, setSelectedKey] = useState<string>('SMALL');
    const [gifDuration, setGifDuration] = useState(7);
    const [gifRotation, setGifRotation] = useState(90);
    const [gifFps, setGifFps] = useState(20);
    const [videoDuration, setVideoDuration] = useState(5);
    const [videoRotation, setVideoRotation] = useState(360);
    const [videoFps, setVideoFps] = useState(60);
    const [gifAnimationMode, setGifAnimationMode] = useState<'orbit' | 'cinematic'>('orbit');
    const [videoAnimationMode, setVideoAnimationMode] = useState<'orbit' | 'cinematic'>('orbit');
    const isGifExportEnabled = useFeatureFlag('gif_export');
    const isVideoExportEnabled = useFeatureFlag('video_export');
    const isPaywallEnabled = useFeatureFlag('carto_plus');

    const isLocked = (key: string) => {
        if (!isPaywallEnabled || subscriptionTier === 'carto_plus') return false;
        return key === 'ORBIT_GIF' || key === 'ORBIT_VIDEO';
    };

    const handleUpgrade = async () => {
        await createCheckoutSession();
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
                    ) : (
                        <>
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

