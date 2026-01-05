'use client';

import { ControlSlider, ControlLabel } from '@/components/ui/control-components';
import type { PosterConfig } from '@/types/poster';

interface Buildings3DControlsProps {
    layers: PosterConfig['layers'];
    onLayersChange: (layers: Partial<PosterConfig['layers']>) => void;
}

export function Buildings3DControls({ layers, onLayersChange }: Buildings3DControlsProps) {
    return (
        <div className="pl-8 pr-2 pb-2">
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 space-y-4">
                {/* Height Scale */}
                <div className="space-y-1">
                    <ControlLabel className="text-[10px] uppercase text-gray-500">Height Scale</ControlLabel>
                    <ControlSlider
                        min="0.5"
                        max="3"
                        step="0.1"
                        value={layers.buildings3DHeightScale ?? 1}
                        displayValue={`${(layers.buildings3DHeightScale ?? 1).toFixed(1)}x`}
                        onValueChange={(value) => onLayersChange({ buildings3DHeightScale: value })}
                        formatValue={(v) => `${v.toFixed(1)}x`}
                        parseValue={(s) => parseFloat(s.replace('x', ''))}
                    />
                    <div className="flex justify-between text-[10px] text-gray-400 uppercase font-medium">
                        <span>Subtle</span>
                        <span>Exaggerated</span>
                    </div>
                </div>

                {/* Default Height */}
                <div className="space-y-1">
                    <ControlLabel className="text-[10px] uppercase text-gray-500">Default Height</ControlLabel>
                    <ControlSlider
                        min="0"
                        max="30"
                        step="1"
                        value={layers.buildings3DDefaultHeight ?? 6}
                        displayValue={`${layers.buildings3DDefaultHeight ?? 6}m`}
                        onValueChange={(value) => onLayersChange({ buildings3DDefaultHeight: value })}
                        formatValue={(v) => `${Math.round(v)}m`}
                        parseValue={(s) => parseInt(s.replace('m', ''))}
                    />
                    <p className="text-[9px] text-gray-400 italic">For buildings without height data</p>
                </div>
            </div>
        </div>
    );
}
