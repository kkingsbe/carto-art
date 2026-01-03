'use client';

import { ControlSlider, ControlLabel, ControlCheckbox } from '@/components/ui/control-components';
import { Tooltip } from '@/components/ui/tooltip-simple';
import type { PosterConfig } from '@/types/poster';

interface TerrainControlsProps {
    layers: PosterConfig['layers'];
    onLayersChange: (layers: Partial<PosterConfig['layers']>) => void;
    showUnderwaterToggle?: boolean;
}

export function TerrainControls({ layers, onLayersChange, showUnderwaterToggle }: TerrainControlsProps) {
    const handleHillshadeExaggerationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onLayersChange({ hillshadeExaggeration: parseFloat(e.target.value) });
    };

    return (
        <div className="pl-8 pr-2 pb-2">
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 space-y-3">
                <div className="space-y-1">
                    <ControlLabel className="text-[10px] uppercase text-gray-500">Shading Intensity</ControlLabel>
                    <ControlSlider
                        min="0.0"
                        max="1.0"
                        step="0.05"
                        value={layers.hillshadeExaggeration ?? 0.5}
                        onChange={handleHillshadeExaggerationChange}
                        displayValue={`${(layers.hillshadeExaggeration ?? 0.5).toFixed(2)}x`}
                        onValueChange={(value) => onLayersChange({ hillshadeExaggeration: value })}
                        formatValue={(v) => v.toFixed(2)}
                        parseValue={(s) => parseFloat(s.replace('x', ''))}
                    />
                    <div className="flex justify-between text-[10px] text-gray-400 uppercase font-medium">
                        <Tooltip content="No shading (0.0x)">
                            <span>Subtle</span>
                        </Tooltip>
                        <Tooltip content="Maximum shading (1.0x)">
                            <span>Strong</span>
                        </Tooltip>
                    </div>
                </div>

                {showUnderwaterToggle && (
                    <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
                        <ControlCheckbox
                            label="Show under water"
                            checked={Boolean(layers.terrainUnderWater)}
                            onChange={(e) => onLayersChange({ terrainUnderWater: e.target.checked })}
                            className="text-[10px] font-medium"
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
