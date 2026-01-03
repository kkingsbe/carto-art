'use client';

import { ControlSection, ControlLabel } from '@/components/ui/control-components';
import { Tooltip } from '@/components/ui/tooltip-simple';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PosterConfig } from '@/types/poster';

interface RenderingControlsProps {
    rendering?: PosterConfig['rendering'];
    onRenderingChange?: (rendering: Partial<NonNullable<PosterConfig['rendering']>>) => void;
}

export function RenderingControls({ rendering, onRenderingChange }: RenderingControlsProps) {
    if (!onRenderingChange) return null;

    return (
        <ControlSection title="Rendering Quality">
            <div className="space-y-4">
                <div className="space-y-2">
                    <ControlLabel
                        className="text-[10px] uppercase text-gray-500"
                        action={
                            <Tooltip content="Higher detail captures more tile data (buildings, roads) when zoomed out. Uses more memory and takes longer to export.">
                                <Sparkles className="h-3 w-3 text-gray-400" />
                            </Tooltip>
                        }
                    >
                        Tile Detail Level
                    </ControlLabel>
                    <div className="grid grid-cols-2 gap-2">
                        {[
                            { id: 1, label: 'Standard', description: 'Normal detail' },
                            { id: 2, label: 'High', description: '2× detail' },
                        ].map(({ id, label, description }) => {
                            const isActive = (rendering?.overzoom ?? 1) === id;
                            return (
                                <button
                                    key={id}
                                    onClick={() => onRenderingChange({ overzoom: id as 1 | 2 })}
                                    className={cn(
                                        "flex flex-col items-center gap-1 py-3 px-2 rounded-lg border transition-all text-center",
                                        isActive
                                            ? "bg-white dark:bg-gray-700 border-blue-500 text-blue-600 dark:text-blue-400 shadow-sm ring-1 ring-blue-500/20"
                                            : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 hover:border-gray-300 dark:hover:border-gray-600"
                                    )}
                                >
                                    <span className="text-xs font-medium">{label}</span>
                                    <span className="text-[9px] text-gray-400">{description}</span>
                                </button>
                            );
                        })}
                    </div>
                    <p className="text-[9px] text-gray-400 italic">
                        High detail shows buildings and fine roads when zoomed out for large prints.
                    </p>
                </div>
            </div>
        </ControlSection>
    );
}
