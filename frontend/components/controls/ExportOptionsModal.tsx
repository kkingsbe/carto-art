'use client';

import { useState } from 'react';
import { X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EXPORT_RESOLUTIONS, DEFAULT_EXPORT_RESOLUTION } from '@/lib/export/constants';
import type { ExportResolution } from '@/lib/export/resolution';

interface ExportOptionsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onExport: (resolution: ExportResolution) => void;
    isExporting: boolean;
}

export function ExportOptionsModal({ isOpen, onClose, onExport, isExporting }: ExportOptionsModalProps) {
    const [selectedRes, setSelectedRes] = useState<ExportResolution>(DEFAULT_EXPORT_RESOLUTION);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={onClose}
            />

            {/* Content */}
            <div className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Export Options</h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Select the resolution for your export. Higher resolution results in better print quality but larger file size.
                    </p>

                    <div className="space-y-3">
                        {Object.entries(EXPORT_RESOLUTIONS).map(([key, res]) => (
                            <button
                                key={key}
                                onClick={() => setSelectedRes(res as ExportResolution)}
                                className={cn(
                                    "w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all",
                                    selectedRes.name === res.name
                                        ? "border-blue-500 bg-blue-50/50 dark:bg-blue-900/20"
                                        : "border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-800"
                                )}
                            >
                                <div className="text-left">
                                    <div className="font-medium text-gray-900 dark:text-white">{res.name}</div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                        {res.width} × {res.height} px • {res.dpi} DPI
                                    </div>
                                </div>
                                {selectedRes.name === res.name && (
                                    <Check className="w-5 h-5 text-blue-500" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="p-6 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700">
                    <button
                        onClick={() => onExport(selectedRes)}
                        disabled={isExporting}
                        className={cn(
                            "w-full py-3 rounded-xl font-semibold shadow-lg transition-all",
                            "bg-gray-900 dark:bg-white text-white dark:text-gray-900",
                            "hover:scale-[1.02] active:scale-[0.98]",
                            "disabled:opacity-50 disabled:cursor-not-allowed"
                        )}
                    >
                        {isExporting ? 'Preparing Export...' : 'Export High Resolution'}
                    </button>
                </div>
            </div>
        </div>
    );
}
