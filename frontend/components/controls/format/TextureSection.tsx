'use client';

import { ControlSection, ControlLabel, ControlSlider } from '@/components/ui/control-components';
import { cn } from '@/lib/utils';
import type { PosterConfig } from '@/types/poster';

interface TextureSectionProps {
    format: PosterConfig['format'];
    onFormatChange: (format: Partial<PosterConfig['format']>) => void;
}

export function TextureSection({ format, onFormatChange }: TextureSectionProps) {
    return (
        <ControlSection title="Texture">
            <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                    {['none', 'paper', 'canvas', 'grain'].map((t) => (
                        <button
                            key={t}
                            type="button"
                            onClick={() => onFormatChange({ texture: t as any })}
                            className={cn(
                                "px-4 py-2 text-xs font-medium rounded-full border transition-all",
                                format.texture === t
                                    ? "bg-gray-900 border-gray-900 text-white dark:bg-white dark:border-white dark:text-gray-900"
                                    : "bg-transparent border-gray-200 text-gray-600 hover:border-gray-400 dark:border-gray-700 dark:text-gray-400"
                            )}
                        >
                            {t.charAt(0).toUpperCase() + t.slice(1)}
                        </button>
                    ))}
                </div>

                {format.texture && format.texture !== 'none' && (
                    <div className="space-y-2 pt-2">
                        <div className="flex justify-between items-center mb-1">
                            <ControlLabel className="mb-0">Texture Intensity</ControlLabel>
                            <span className="text-xs font-mono text-gray-500">{format.textureIntensity || 20}%</span>
                        </div>
                        <ControlSlider
                            min="5"
                            max="60"
                            value={format.textureIntensity || 20}
                            onChange={(e) => onFormatChange({ textureIntensity: parseInt(e.target.value) })}
                        />
                    </div>
                )}
            </div>
        </ControlSection>
    );
}
