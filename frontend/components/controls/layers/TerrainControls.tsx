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
    return (
        <div className="pl-8 pr-2 pb-2">
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 space-y-3">
                {/* Hillshade Intensity */}
                <div id="terrain-shading-control" className="space-y-1">
                    <ControlLabel className="text-[10px] uppercase text-gray-500">Shading Intensity</ControlLabel>
                    <ControlSlider
                        min="0.0"
                        max="1.0"
                        step="0.05"
                        value={layers.hillshadeExaggeration ?? 0.5}
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

                {/* Terrain Detail Level */}
                <div className="space-y-1.5 pt-2 border-t border-gray-100 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                        <ControlLabel className="text-[10px] uppercase text-gray-500">Tile Detail</ControlLabel>
                        <Tooltip content="Higher detail loads more tiles for better quality when zoomed out">
                            <span className="text-[9px] text-gray-400">ⓘ</span>
                        </Tooltip>
                    </div>
                    <div className="flex gap-1">
                        {(['normal', 'high', 'ultra'] as const).map((level) => (
                            <button
                                key={level}
                                onClick={() => onLayersChange({ terrainDetailLevel: level })}
                                className={`flex-1 py-1.5 px-2 text-[10px] font-medium rounded transition-colors ${(layers.terrainDetailLevel ?? 'normal') === level
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                    }`}
                            >
                                {level === 'normal' ? '1x' : level === 'high' ? '2x' : '4x'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Terrain Mesh Quality */}
                <div className="space-y-1.5 pt-2 border-t border-gray-100 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                        <ControlLabel className="text-[10px] uppercase text-gray-500">Mesh Resolution</ControlLabel>
                        <Tooltip content="Finer mesh allows for more detailed terrain shapes, especially mountains">
                            <span className="text-[9px] text-gray-400">ⓘ</span>
                        </Tooltip>
                    </div>
                    <div className="flex gap-1">
                        {(['fast', 'balanced', 'export', 'ultra'] as const).map((quality) => (
                            <button
                                key={quality}
                                onClick={() => onLayersChange({ terrainMeshQuality: quality })}
                                className={`flex-1 py-1.5 px-1 text-[9px] font-medium rounded transition-colors ${(layers.terrainMeshQuality ?? 'export') === quality
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                    }`}
                            >
                                {quality.charAt(0).toUpperCase() + quality.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Exaggeration Control (Main UI) */}
                {layers.volumetricTerrain && (
                    <div className="space-y-1 pt-2 border-t border-gray-100 dark:border-gray-700">
                        <ControlLabel className="text-[10px] uppercase text-gray-500">Height Scale</ControlLabel>
                        <ControlSlider
                            min="0"
                            max="1"
                            step="0.01"
                            // Reverse the log conversion for display: slider = (exag/20)^(1/3.3)
                            value={Math.pow((layers.volumetricTerrainExaggeration ?? 1) / 20, 1 / 3.3)}
                            displayValue={`${(layers.volumetricTerrainExaggeration ?? 1).toFixed(1)}x`}
                            onValueChange={(val) => {
                                // Apply log conversion: exag = 20 * val^3.3
                                const exag = 20 * Math.pow(val, 3.3);
                                onLayersChange({ volumetricTerrainExaggeration: exag });
                            }}
                        // We don't parse/format directly because of the non-linear transform handled in props
                        />
                    </div>
                )}

                {/* Light Direction - controls hillshade illumination */}
                <div className="space-y-1 pt-2 border-t border-gray-100 dark:border-gray-700">
                    <ControlLabel className="text-[10px] uppercase text-gray-500">Light Direction</ControlLabel>
                    <ControlSlider
                        min="0"
                        max="359"
                        step="15"
                        value={layers.terrainLightAzimuth ?? 315}
                        displayValue={`${layers.terrainLightAzimuth ?? 315}°`}
                        onValueChange={(value) => onLayersChange({ terrainLightAzimuth: value })}
                        formatValue={(v) => `${v}°`}
                        parseValue={(s) => parseFloat(s.replace('°', ''))}
                    />
                    <div className="flex justify-between text-[10px] text-gray-400 uppercase font-medium">
                        <Tooltip content="North (0°)">
                            <span>N</span>
                        </Tooltip>
                        <Tooltip content="East (90°)">
                            <span>E</span>
                        </Tooltip>
                        <Tooltip content="South (180°)">
                            <span>S</span>
                        </Tooltip>
                        <Tooltip content="West (270°)">
                            <span>W</span>
                        </Tooltip>
                    </div>
                </div>

                {/* Light Altitude - controls shadow angle */}
                <div className="space-y-1 pt-2 border-t border-gray-100 dark:border-gray-700">
                    <ControlLabel className="text-[10px] uppercase text-gray-500">Light Altitude</ControlLabel>
                    <ControlSlider
                        min="5"
                        max="90"
                        step="5"
                        value={layers.terrainLightAltitude ?? 45}
                        displayValue={`${layers.terrainLightAltitude ?? 45}°`}
                        onValueChange={(value) => onLayersChange({ terrainLightAltitude: value })}
                        formatValue={(v) => `${v}°`}
                        parseValue={(s) => parseFloat(s.replace('°', ''))}
                    />
                    <div className="flex justify-between text-[10px] text-gray-400 uppercase font-medium">
                        <Tooltip content="Low sun (long shadows)">
                            <span>Low</span>
                        </Tooltip>
                        <Tooltip content="High sun (short shadows)">
                            <span>High</span>
                        </Tooltip>
                    </div>
                </div>

                {/* Terrain Shadows (3D self-shadowing) - Only shown when volumetric terrain is enabled */}
                {layers.volumetricTerrain && (
                    <div className="pt-2 border-t border-gray-100 dark:border-gray-700 space-y-3">
                        <ControlCheckbox
                            label="3D Terrain Shadows"
                            checked={layers.terrainShadows !== false}
                            onChange={(e) => onLayersChange({ terrainShadows: e.target.checked })}
                            className="text-[10px] font-medium"
                        />

                        {(layers.terrainShadows !== false) && (
                            <>
                                <div className="space-y-1">
                                    <ControlLabel className="text-[10px] uppercase text-gray-500">Shadow Darkness</ControlLabel>
                                    <ControlSlider
                                        min="0"
                                        max="1"
                                        step="0.05"
                                        value={layers.terrainShadowDarkness ?? 0.7}
                                        displayValue={`${Math.round((layers.terrainShadowDarkness ?? 0.7) * 100)}%`}
                                        onValueChange={(value) => onLayersChange({ terrainShadowDarkness: value })}
                                    />
                                </div>

                                <div className="space-y-1">
                                    <ControlLabel className="text-[10px] uppercase text-gray-500">Ambient Light</ControlLabel>
                                    <ControlSlider
                                        min="0"
                                        max="0.5"
                                        step="0.01"
                                        value={layers.terrainAmbientLight ?? 0.15}
                                        displayValue={`${Math.round((layers.terrainAmbientLight ?? 0.15) * 100)}%`}
                                        onValueChange={(value) => onLayersChange({ terrainAmbientLight: value })}
                                    />
                                    <div className="flex justify-between text-[10px] text-gray-400 uppercase font-medium">
                                        <Tooltip content="Dark shadows (dramatic)">
                                            <span>Dramatic</span>
                                        </Tooltip>
                                        <Tooltip content="Lighter shadows (soft)">
                                            <span>Soft</span>
                                        </Tooltip>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <ControlLabel className="text-[10px] uppercase text-gray-500">Diffuse Light</ControlLabel>
                                    <ControlSlider
                                        min="0.5"
                                        max="1.5"
                                        step="0.05"
                                        value={layers.terrainDiffuseLight ?? 1.0}
                                        displayValue={`${Math.round((layers.terrainDiffuseLight ?? 1.0) * 100)}%`}
                                        onValueChange={(value) => onLayersChange({ terrainDiffuseLight: value })}
                                    />
                                    <div className="flex justify-between text-[10px] text-gray-400 uppercase font-medium">
                                        <Tooltip content="Dimmer highlights">
                                            <span>Dim</span>
                                        </Tooltip>
                                        <Tooltip content="Brighter highlights">
                                            <span>Bright</span>
                                        </Tooltip>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* Fog/Atmosphere - only when 3D terrain is enabled */}
                {layers.volumetricTerrain && (
                    <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
                        <ControlCheckbox
                            label="Atmospheric fog"
                            checked={layers.terrainFog !== false}
                            onChange={(e) => onLayersChange({ terrainFog: e.target.checked })}
                            className="text-[10px] font-medium"
                        />
                    </div>
                )}

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

