'use client';

import { LocationSearch } from '@/components/controls/LocationSearch';
import { StyleSelector } from '@/components/controls/StyleSelector';
import { ControlLabel, Separator } from '@/components/ui/control-components';
import type { PosterConfig, PosterLocation, PosterStyle } from '@/types/poster';
import { Box, Compass, Shuffle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/control-components';

interface EssentialsPanelProps {
    config: PosterConfig;
    updateLocation: (location: Partial<PosterLocation>) => void;
    updateStyle: (style: PosterStyle) => void;
    updateLayers: (layers: Partial<PosterConfig['layers']>) => void;
    setConfig: (config: PosterConfig) => void;
    onRandomize: () => void;
}

export function EssentialsPanel({
    config,
    updateLocation,
    updateStyle,
    updateLayers,
    onRandomize
}: EssentialsPanelProps) {

    // Simplified Quick Camera Presets
    const quickCameras = [
        { id: '2d', label: 'Flat Map', pitch: 0, bearing: 0, icon: Compass },
        { id: '3d', label: '3D View', pitch: 60, bearing: -15, icon: Box },
        { id: 'iso', label: 'Isometric', pitch: 45, bearing: 45, icon: Box },
    ] as const;

    const currentCam = quickCameras.find(
        c => Math.abs((config.layers.buildings3DPitch || 0) - c.pitch) < 5 &&
            Math.abs((config.layers.buildings3DBearing || 0) - c.bearing) < 5
    ) || null;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-500">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Essentials</h3>
            </div>

            {/* 1. Location */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <ControlLabel>Location</ControlLabel>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onRandomize}
                        className="h-6 px-2 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
                    >
                        <Shuffle className="w-3 h-3 mr-1.5" />
                        Randomize
                    </Button>
                </div>
                <LocationSearch
                    currentLocation={config.location}
                    onLocationSelect={updateLocation}
                />
            </div>

            <Separator />

            {/* 2. Quick Style */}
            <div className="space-y-4">
                <ControlLabel>Map Style</ControlLabel>
                <StyleSelector
                    selectedStyleId={config.style.id}
                    onStyleSelect={updateStyle}
                    currentConfig={config}
                />
            </div>

            <Separator />

            {/* 3. Quick Camera Perspective */}
            <div className="space-y-4">
                <ControlLabel>Perspective</ControlLabel>
                <div className="grid grid-cols-3 gap-3">
                    {quickCameras.map((cam) => {
                        const isActive = currentCam?.id === cam.id;
                        const Icon = cam.icon;

                        return (
                            <button
                                key={cam.id}
                                onClick={() => updateLayers({
                                    buildings3DPitch: cam.pitch,
                                    buildings3DBearing: cam.bearing
                                })}
                                className={cn(
                                    "flex flex-col items-center justify-center gap-2 p-3 rounded-xl border transition-all duration-200",
                                    isActive
                                        ? "bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-500/50 shadow-sm"
                                        : "bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700"
                                )}
                            >
                                <Icon className={cn("w-5 h-5", isActive && "fill-current opacity-20")} />
                                <span className="text-[11px] font-medium">{cam.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
