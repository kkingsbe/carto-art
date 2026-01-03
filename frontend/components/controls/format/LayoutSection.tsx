'use client';

import { ControlSection, ControlLabel, ControlRow, ControlSlider } from '@/components/ui/control-components';
import { Tooltip } from '@/components/ui/tooltip-simple';
import { Frame } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PosterConfig } from '@/types/poster';

interface LayoutSectionProps {
    format: PosterConfig['format'];
    onFormatChange: (format: Partial<PosterConfig['format']>) => void;
}

export function LayoutSection({ format, onFormatChange }: LayoutSectionProps) {
    const isSquareAspectRatio = format.aspectRatio === '1:1';

    return (
        <ControlSection title="Layout">
            <div className="space-y-4">
                <div className="space-y-2">
                    <div className="flex justify-between items-center mb-1">
                        <ControlLabel className="mb-0">Margin</ControlLabel>
                        <span className="text-xs font-mono text-gray-500">{format.margin}%</span>
                    </div>
                    <ControlSlider
                        min="0"
                        max="20"
                        step="0.5"
                        value={format.margin}
                        onChange={(e) => onFormatChange({ margin: parseFloat(e.target.value) })}
                    />
                </div>

                <div className="space-y-2">
                    <ControlLabel>Mask Shape</ControlLabel>
                    <ControlRow>
                        <button
                            type="button"
                            onClick={() => onFormatChange({ maskShape: 'rectangular' })}
                            className={cn(
                                'flex items-center justify-center gap-2 p-3 border rounded-lg transition-all',
                                (format.maskShape || 'rectangular') === 'rectangular'
                                    ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:border-blue-400 dark:text-blue-300'
                                    : 'border-gray-200 hover:border-gray-300 text-gray-600 dark:border-gray-700 dark:text-gray-400'
                            )}
                        >
                            <Frame className="w-4 h-4" />
                            <span className="text-sm font-medium">Rectangular</span>
                        </button>
                        <Tooltip
                            content="Circular mask is only available for square (1:1) aspect ratio"
                            disabled={isSquareAspectRatio}
                        >
                            <button
                                type="button"
                                disabled={!isSquareAspectRatio}
                                onClick={() => onFormatChange({ maskShape: 'circular' })}
                                className={cn(
                                    'flex items-center justify-center gap-2 p-3 border rounded-lg transition-all',
                                    format.maskShape === 'circular'
                                        ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:border-blue-400 dark:text-blue-300'
                                        : 'border-gray-200 hover:border-gray-300 text-gray-600 dark:border-gray-700 dark:text-gray-400',
                                    !isSquareAspectRatio && 'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-200 dark:disabled:hover:border-gray-700'
                                )}
                            >
                                <div className="w-4 h-4 rounded-full border-2 border-current" />
                                <span className="text-sm font-medium">Circular</span>
                            </button>
                        </Tooltip>
                    </ControlRow>

                    {/* Compass Rose Toggle - Only show when circular mask is selected */}
                    {format.maskShape === 'circular' && (
                        <ControlRow>
                            <ControlLabel>Compass Rose</ControlLabel>
                            <button
                                type="button"
                                onClick={() => onFormatChange({ compassRose: !format.compassRose })}
                                className={cn(
                                    'flex items-center gap-2 px-3 py-2 border rounded-lg transition-all text-sm font-medium',
                                    format.compassRose
                                        ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:border-blue-400 dark:text-blue-300'
                                        : 'border-gray-200 hover:border-gray-300 text-gray-600 dark:border-gray-700 dark:text-gray-400'
                                )}
                            >
                                <span>{format.compassRose ? '✓' : ''}</span>
                                <span>Show Compass Rose</span>
                            </button>
                        </ControlRow>
                    )}
                </div>

                <div className="space-y-2">
                    <ControlLabel>Border Style</ControlLabel>
                    <div className="grid grid-cols-5 gap-2">
                        {['none', 'thin', 'thick', 'double', 'inset'].map((style) => (
                            <button
                                key={style}
                                type="button"
                                onClick={() => onFormatChange({ borderStyle: style as PosterConfig['format']['borderStyle'] })}
                                className={cn(
                                    'p-2 text-xs font-medium capitalize border rounded-lg transition-all',
                                    format.borderStyle === style
                                        ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:border-blue-400 dark:text-blue-300'
                                        : 'border-gray-200 hover:border-gray-300 text-gray-600 dark:border-gray-700 dark:text-gray-400'
                                )}
                            >
                                {style}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </ControlSection>
    );
}
