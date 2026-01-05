'use client';

import { ControlSlider, ControlLabel } from '@/components/ui/control-components';
import { Box } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PosterConfig } from '@/types/poster';

interface CameraControlsProps {
    layers: PosterConfig['layers'];
    onLayersChange: (layers: Partial<PosterConfig['layers']>) => void;
}

export function CameraControls({ layers, onLayersChange }: CameraControlsProps) {
    const cameraPresets = [
        { id: 'isometric', label: 'Isometric', pitch: 45, bearing: 45 },
        { id: 'skyline', label: 'Skyline', pitch: 60, bearing: -15 },
        { id: 'birdseye', label: "Bird's Eye", pitch: 35, bearing: 0 },
    ] as const;

    const applyPreset = (preset: typeof cameraPresets[number]) => {
        onLayersChange({
            buildings3DPitch: preset.pitch,
            buildings3DBearing: preset.bearing,
        });
    };

    return (
        <div className="space-y-6">
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 space-y-4">
                {/* Camera Presets */}
                <div className="space-y-2">
                    <ControlLabel className="text-[10px] uppercase text-gray-500">Camera Preset</ControlLabel>
                    <div className="grid grid-cols-3 gap-2">
                        {cameraPresets.map((preset) => {
                            const isActive =
                                layers.buildings3DPitch === preset.pitch &&
                                layers.buildings3DBearing === preset.bearing;
                            return (
                                <button
                                    key={preset.id}
                                    onClick={() => applyPreset(preset)}
                                    className={cn(
                                        "flex flex-col items-center gap-1 py-2 px-1 rounded-lg border transition-all text-center",
                                        isActive
                                            ? "bg-white dark:bg-gray-700 border-blue-500 text-blue-600 dark:text-blue-400 shadow-sm ring-1 ring-blue-500/20"
                                            : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 hover:border-gray-300 dark:hover:border-gray-600"
                                    )}
                                >
                                    <Box className="h-4 w-4" />
                                    <span className="text-[9px] uppercase tracking-tight font-medium">{preset.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Camera Pitch */}
                <div className="space-y-1">
                    <ControlLabel className="text-[10px] uppercase text-gray-500">Camera Tilt</ControlLabel>
                    <ControlSlider
                        min="0"
                        max="60"
                        step="5"
                        value={layers.buildings3DPitch ?? 45}
                        displayValue={`${layers.buildings3DPitch ?? 45}°`}
                        onValueChange={(value) => onLayersChange({ buildings3DPitch: value })}
                        formatValue={(v) => `${Math.round(v)}°`}
                        parseValue={(s) => parseInt(s.replace('°', ''))}
                    />
                    <div className="flex justify-between text-[10px] text-gray-400 uppercase font-medium">
                        <span>Top-Down</span>
                        <span>Dramatic</span>
                    </div>
                </div>

                {/* Camera Bearing */}
                <div className="space-y-1">
                    <ControlLabel className="text-[10px] uppercase text-gray-500">Rotation</ControlLabel>
                    <ControlSlider
                        min="0"
                        max="360"
                        step="15"
                        value={layers.buildings3DBearing ?? 0}
                        displayValue={`${layers.buildings3DBearing ?? 0}°`}
                        onValueChange={(value) => onLayersChange({ buildings3DBearing: value })}
                        formatValue={(v) => `${Math.round(v)}°`}
                        parseValue={(s) => parseInt(s.replace('°', ''))}
                    />
                    <div className="flex justify-between text-[10px] text-gray-400 uppercase font-medium">
                        <span>North</span>
                        <span>Full Circle</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
