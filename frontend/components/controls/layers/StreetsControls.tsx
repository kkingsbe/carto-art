'use client';

import { ControlSlider, ControlLabel } from '@/components/ui/control-components';
import type { PosterConfig } from '@/types/poster';

interface StreetsControlsProps {
    layers: PosterConfig['layers'];
    onLayersChange: (layers: Partial<PosterConfig['layers']>) => void;
}

export function StreetsControls({ layers, onLayersChange }: StreetsControlsProps) {
    const handleRoadWeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onLayersChange({ roadWeight: parseFloat(e.target.value) });
    };

    return (
        <div className="pl-8 pr-2 pb-2">
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 space-y-3">
                <div className="space-y-1">
                    <ControlLabel className="text-[10px] uppercase text-gray-500">Line Weight</ControlLabel>
                    <ControlSlider
                        min="0.1"
                        max="3.0"
                        step="0.1"
                        value={layers.roadWeight ?? 1.0}
                        onChange={handleRoadWeightChange}
                        displayValue={`${(layers.roadWeight ?? 1.0).toFixed(1)}x`}
                        onValueChange={(value) => onLayersChange({ roadWeight: value })}
                        formatValue={(v) => v.toFixed(1)}
                        parseValue={(s) => parseFloat(s.replace('x', ''))}
                    />
                    <div className="flex justify-between text-[10px] text-gray-400 uppercase font-medium">
                        <span>Fine</span>
                        <span>Bold</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
