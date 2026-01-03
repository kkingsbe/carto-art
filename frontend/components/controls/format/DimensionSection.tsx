'use client';

import { ControlSection, ControlLabel, ControlRow } from '@/components/ui/control-components';
import { cn } from '@/lib/utils';
import { Crop } from 'lucide-react';
import type { PosterConfig } from '@/types/poster';

interface DimensionSectionProps {
    format: PosterConfig['format'];
    onFormatChange: (format: Partial<PosterConfig['format']>) => void;
}

const aspectRatioOptions: Array<{
    value: PosterConfig['format']['aspectRatio'];
    label: string;
    description?: string;
    category: 'Standard' | 'Screen';
}> = [
        { value: '2:3', label: '2:3', description: 'Photo', category: 'Standard' },
        { value: '3:4', label: '3:4', description: 'Standard', category: 'Standard' },
        { value: '4:5', label: '4:5', description: 'Compact', category: 'Standard' },
        { value: '1:1', label: '1:1', description: 'Square', category: 'Standard' },
        { value: 'ISO', label: 'ISO', description: 'A-series', category: 'Standard' },
        { value: '16:9', label: '16:9', description: 'Desktop', category: 'Screen' },
        { value: '16:10', label: '16:10', description: 'Laptop', category: 'Screen' },
        { value: '9:16', label: '9:16', description: 'Phone', category: 'Screen' },
        { value: '9:19.5', label: '9:19.5', description: 'Mobile', category: 'Screen' },
    ];

export function DimensionSection({ format, onFormatChange }: DimensionSectionProps) {
    const handleAspectRatioChange = (newAspectRatio: PosterConfig['format']['aspectRatio']) => {
        // Auto-reset maskShape to rectangular if changing away from square while circular is active
        if (format.maskShape === 'circular' && newAspectRatio !== '1:1') {
            onFormatChange({ aspectRatio: newAspectRatio, maskShape: 'rectangular' });
        } else {
            onFormatChange({ aspectRatio: newAspectRatio });
        }
    };

    return (
        <ControlSection title="Dimensions">
            <div className="space-y-4">
                <div className="space-y-2">
                    <ControlLabel>Aspect Ratio</ControlLabel>
                    <div className="space-y-4">
                        <div>
                            <div className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Print & Classic</div>
                            <div className="grid grid-cols-5 gap-2">
                                {aspectRatioOptions.filter(o => o.category === 'Standard').map((option) => {
                                    const isActive = format.aspectRatio === option.value;
                                    return (
                                        <button
                                            key={option.value}
                                            type="button"
                                            onClick={() => handleAspectRatioChange(option.value)}
                                            className={cn(
                                                'flex flex-col items-center justify-center p-2 rounded-lg border transition-all h-16',
                                                isActive
                                                    ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:border-blue-400 dark:text-blue-300'
                                                    : 'border-gray-200 hover:border-gray-300 text-gray-600 dark:border-gray-700 dark:text-gray-400 dark:hover:border-gray-600'
                                            )}
                                        >
                                            <span className="text-sm font-bold">{option.label}</span>
                                            <span className="text-[10px] opacity-75">{option.description}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div>
                            <div className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Wallpaper & Screen</div>
                            <div className="grid grid-cols-4 gap-2">
                                {aspectRatioOptions.filter(o => o.category === 'Screen').map((option) => {
                                    const isActive = format.aspectRatio === option.value;
                                    return (
                                        <button
                                            key={option.value}
                                            type="button"
                                            onClick={() => handleAspectRatioChange(option.value)}
                                            className={cn(
                                                'flex flex-col items-center justify-center p-2 rounded-lg border transition-all h-16',
                                                isActive
                                                    ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:border-blue-400 dark:text-blue-300'
                                                    : 'border-gray-200 hover:border-gray-300 text-gray-600 dark:border-gray-700 dark:text-gray-400 dark:hover:border-gray-600'
                                            )}
                                        >
                                            <span className="text-sm font-bold">{option.label}</span>
                                            <span className="text-[10px] opacity-75">{option.description}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <ControlLabel>Orientation</ControlLabel>
                    <ControlRow>
                        <button
                            type="button"
                            onClick={() => onFormatChange({ orientation: 'portrait' })}
                            className={cn(
                                'flex items-center justify-center gap-2 p-3 border rounded-lg transition-all',
                                format.orientation === 'portrait'
                                    ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:border-blue-400 dark:text-blue-300'
                                    : 'border-gray-200 hover:border-gray-300 text-gray-600 dark:border-gray-700 dark:text-gray-400'
                            )}
                        >
                            <Crop className="w-4 h-4 rotate-90" />
                            <span className="text-sm font-medium">Portrait</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => onFormatChange({ orientation: 'landscape' })}
                            className={cn(
                                'flex items-center justify-center gap-2 p-3 border rounded-lg transition-all',
                                format.orientation === 'landscape'
                                    ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:border-blue-400 dark:text-blue-300'
                                    : 'border-gray-200 hover:border-gray-300 text-gray-600 dark:border-gray-700 dark:text-gray-400'
                            )}
                        >
                            <Crop className="w-4 h-4" />
                            <span className="text-sm font-medium">Landscape</span>
                        </button>
                    </ControlRow>
                </div>
            </div>
        </ControlSection>
    );
}
