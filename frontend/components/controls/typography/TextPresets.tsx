'use client';

import { cn } from '@/lib/utils';
import { TEXT_PRESETS, getActivePreset } from '@/lib/typography/textPresets';
import { Type } from 'lucide-react';
import type { PosterConfig } from '@/types/poster';

interface TextPresetsProps {
    typography: PosterConfig['typography'];
    onTypographyChange: (typography: Partial<PosterConfig['typography']>) => void;
}

export function TextPresets({ typography, onTypographyChange }: TextPresetsProps) {
    const activePreset = getActivePreset(typography);

    const applyPreset = (presetId: string) => {
        const preset = TEXT_PRESETS.find(p => p.id === presetId);
        if (preset) {
            onTypographyChange(preset.settings);
        }
    };

    return (
        <div className="px-1">
            <div className="flex items-center gap-2 mb-3">
                <Type className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Text Presets
                </h4>
            </div>

            <div className="grid grid-cols-3 gap-2">
                {TEXT_PRESETS.map((preset) => {
                    const isActive = activePreset?.id === preset.id;

                    return (
                        <button
                            key={preset.id}
                            type="button"
                            onClick={() => applyPreset(preset.id)}
                            title={preset.description}
                            className={cn(
                                'group relative flex flex-col gap-2 p-3 text-left border rounded-lg transition-all hover:scale-[1.02]',
                                isActive
                                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 ring-2 ring-blue-500/20'
                                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                            )}
                        >
                            {/* Font preview */}
                            <div className="flex flex-col gap-1 items-center justify-center h-14">
                                <div
                                    style={{
                                        fontFamily: preset.settings.titleFont,
                                        fontSize: '16px',
                                        fontWeight: 700
                                    }}
                                    className="text-gray-800 dark:text-gray-200"
                                >
                                    Aa
                                </div>
                                <div
                                    style={{
                                        fontFamily: preset.settings.subtitleFont,
                                        fontSize: '9px',
                                        fontWeight: 300
                                    }}
                                    className="text-gray-500 dark:text-gray-400 text-center leading-tight"
                                >
                                    {preset.settings.subtitleFont}
                                </div>
                            </div>
                            <span className="text-[10px] font-medium text-center text-gray-700 dark:text-gray-300">
                                {preset.name}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
