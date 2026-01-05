'use client';

import { useState } from 'react';
import { X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EXPORT_RESOLUTIONS, DEFAULT_EXPORT_RESOLUTION, type ExportResolutionKey } from '@/lib/export/constants';
import { calculateTargetResolution, getPhysicalDimensions, type ExportResolution, type BaseExportResolution } from '@/lib/export/resolution';
import type { PosterConfig } from '@/types/poster';
import type { GifExportOptions } from '@/hooks/useGifExport';

interface ExportOptionsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onExport: (resolution: ExportResolution, gifOptions?: GifExportOptions) => void;
    isExporting: boolean;
    format: PosterConfig['format'];
}

export function ExportOptionsModal({ isOpen, onClose, onExport, isExporting, format }: ExportOptionsModalProps) {
    const [selectedKey, setSelectedKey] = useState<string>('SMALL');
    const [gifDuration, setGifDuration] = useState(3);
    const [gifRotation, setGifRotation] = useState(360);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={onClose}
            />

            {/* Content */}
            <div className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-t-2xl md:rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom md:zoom-in-95 duration-200 pb-safe">
                <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Export Options</h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Select the resolution for your export. Higher resolution results in better print quality but larger file size.
                    </p>

                    <div className="space-y-6">
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
                        {/* Animation Category */}
                        <div>
                            <div className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Animation</div>
                            <div className="space-y-3">
                                <button
                                    onClick={() => setSelectedKey('ORBIT_GIF')}
                                    className={cn(
                                        "w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all text-left",
                                        selectedKey === 'ORBIT_GIF'
                                            ? "border-blue-500 bg-blue-50/50 dark:bg-blue-900/20"
                                            : "border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-800"
                                    )}
                                >
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-1">
                                            <div className="font-semibold text-gray-900 dark:text-white">Orbit GIF</div>
                                            {selectedKey === 'ORBIT_GIF' && <Check className="w-5 h-5 text-blue-500" />}
                                        </div>
                                        <div className="text-xs text-gray-400 dark:text-gray-500 mb-2">
                                            Animated orbit of your map location.
                                        </div>
                                        <div className="text-xs font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
                                            <span>{gifDuration}s</span>
                                            <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                                            <span>{gifRotation}° rotation</span>
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
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>


                <div className="p-6 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700">
                    <button
                        onClick={() => {
                            if (selectedKey === 'ORBIT_GIF') {
                                onExport(
                                    { width: 0, height: 0, dpi: 72, name: 'ORBIT_GIF' },
                                    { duration: gifDuration, totalRotation: gifRotation }
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
                        {isExporting ? 'Preparing Export...' : 'Export'}
                    </button>
                </div>
            </div>
        </div >
    );
}
