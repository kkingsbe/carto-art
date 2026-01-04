'use client';

import { ControlSlider, ControlLabel } from '@/components/ui/control-components';
import type { PosterConfig } from '@/types/poster';

interface ContoursControlsProps {
    layers: PosterConfig['layers'];
    onLayersChange: (layers: Partial<PosterConfig['layers']>) => void;
}

export function ContoursControls({ layers, onLayersChange }: ContoursControlsProps) {
    return (
        <div className="pl-8 pr-2 pb-2">
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 space-y-3">
                <div className="space-y-1">
                    <ControlLabel className="text-[10px] uppercase text-gray-500">Line Interval</ControlLabel>
                    <ControlSlider
                        min="10"
                        max="250"
                        step="10"
                        value={layers.contourDensity ?? 50}
                        displayValue={`${layers.contourDensity ?? 50}m`}
                        onValueChange={(value) => onLayersChange({ contourDensity: Math.round(value) })}
                        formatValue={(v) => `${Math.round(v)}m`}
                        parseValue={(s) => parseInt(s.replace('m', ''))}
                    />
                    <div className="flex justify-between text-[10px] text-gray-400 uppercase font-medium">
                        <span>Dense</span>
                        <span>Sparse</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
