'use client';

import { PosterConfig, LayerToggle, ColorPalette } from '@/types/poster';
import { cn } from '@/lib/utils';
import { HexColorPicker } from 'react-colorful';
import { useState, useMemo } from 'react';
import { Type, Palette, Heart, Home, MapPin, Target, Circle, Radio, Check, Box, Compass, ArrowUp, Sparkles } from 'lucide-react';
import { ControlSection, ControlCheckbox, ControlSlider, ControlLabel, ControlInput, CollapsibleSection } from '@/components/ui/control-components';
import { Tooltip } from '@/components/ui/tooltip';

interface LayerControlsProps {
  layers: PosterConfig['layers'];
  rendering?: PosterConfig['rendering'];
  onLayersChange: (layers: Partial<PosterConfig['layers']>) => void;
  onRenderingChange?: (rendering: Partial<NonNullable<PosterConfig['rendering']>>) => void;
  availableToggles: LayerToggle[];
  palette: ColorPalette;
}

const markerTypes = [
  { id: 'crosshair', icon: Target, label: 'Target' },
  { id: 'pin', icon: MapPin, label: 'Pin' },
  { id: 'dot', icon: Circle, label: 'Dot' },
  { id: 'ring', icon: Radio, label: 'Ring' },
  { id: 'heart', icon: Heart, label: 'Heart' },
  { id: 'home', icon: Home, label: 'Home' },
] as const;

export function LayerControls({ layers, rendering, onLayersChange, onRenderingChange, availableToggles, palette }: LayerControlsProps) {
  const [showMarkerColorPicker, setShowMarkerColorPicker] = useState(false);

  const effectiveMarkerColor = useMemo(() => {
    return layers.markerColor || palette.primary || palette.accent || palette.text;
  }, [layers.markerColor, palette.primary, palette.accent, palette.text]);

  const toggleLayer = (key: keyof PosterConfig['layers']) => {
    onLayersChange({ [key]: !layers[key] });
  };

  const isTerrainToggleVisible = availableToggles.some(t => t.id === 'terrain');
  const isTerrainUnderWaterToggleVisible = availableToggles.some(t => t.id === 'terrainUnderWater');

  const handleContourDensityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    onLayersChange({ contourDensity: value });
  };

  const handleHillshadeExaggerationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onLayersChange({ hillshadeExaggeration: parseFloat(e.target.value) });
  };

  const handleRoadWeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onLayersChange({ roadWeight: parseFloat(e.target.value) });
  };

  // Categorize layers
  const geographicLayers = availableToggles.filter(t =>
    ['terrain', 'water', 'parks', 'buildings', 'buildings3D', 'terrainUnderWater', 'contours', 'boundaries'].includes(t.id)
  );
  const landcoverLayers = availableToggles.filter(t =>
    ['landcoverWood', 'landcoverGrass', 'landcoverFarmland', 'landcoverIce'].includes(t.id)
  );
  const landuseLayers = availableToggles.filter(t =>
    ['landuseForest', 'landuseOrchard', 'landuseVineyard', 'landuseCemetery', 'landuseGrass'].includes(t.id)
  );
  const dataLayers = availableToggles.filter(t =>
    ['streets', 'population', 'pois'].includes(t.id)
  );

  // 3D Buildings camera presets
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

  const renderLayerItem = (item: LayerToggle) => {
    return (
      <div key={item.id} className="space-y-2">
        <ControlCheckbox
          label={item.name}
          checked={Boolean(layers[item.id as keyof PosterConfig['layers']])}
          onChange={() => toggleLayer(item.id as keyof PosterConfig['layers'])}
        />

        {/* Road Weight Control */}
        {item.id === 'streets' && layers.streets && (
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
        )}

        {/* Hillshade Exaggeration Control */}
        {item.id === 'terrain' && layers.terrain && (
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

              {isTerrainUnderWaterToggleVisible && (
                <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
                  <ControlCheckbox
                    label="Show under water"
                    checked={Boolean(layers.terrainUnderWater)}
                    onChange={() => toggleLayer('terrainUnderWater')}
                    className="text-[10px] font-medium"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Contour Density Control */}
        {item.id === 'contours' && layers.contours && (
          <div className="pl-8 pr-2 pb-2">
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 space-y-3">
              <div className="space-y-1">
                <ControlLabel className="text-[10px] uppercase text-gray-500">Line Interval</ControlLabel>
                <ControlSlider
                  min="10"
                  max="250"
                  step="10"
                  value={layers.contourDensity ?? 50}
                  onChange={handleContourDensityChange}
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
        )}

        {/* 3D Buildings Controls */}
        {item.id === 'buildings3D' && layers.buildings3D && (
          <div className="pl-8 pr-2 pb-2">
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
                  onChange={(e) => onLayersChange({ buildings3DPitch: parseFloat(e.target.value) })}
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
                  onChange={(e) => onLayersChange({ buildings3DBearing: parseFloat(e.target.value) })}
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

              {/* Height Scale */}
              <div className="space-y-1 pt-2 border-t border-gray-100 dark:border-gray-700">
                <ControlLabel className="text-[10px] uppercase text-gray-500">Height Scale</ControlLabel>
                <ControlSlider
                  min="0.5"
                  max="3"
                  step="0.1"
                  value={layers.buildings3DHeightScale ?? 1}
                  onChange={(e) => onLayersChange({ buildings3DHeightScale: parseFloat(e.target.value) })}
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
                  onChange={(e) => onLayersChange({ buildings3DDefaultHeight: parseFloat(e.target.value) })}
                  displayValue={`${layers.buildings3DDefaultHeight ?? 6}m`}
                  onValueChange={(value) => onLayersChange({ buildings3DDefaultHeight: value })}
                  formatValue={(v) => `${Math.round(v)}m`}
                  parseValue={(s) => parseInt(s.replace('m', ''))}
                />
                <p className="text-[9px] text-gray-400 italic">For buildings without height data</p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <ControlSection title="Visible Layers">
        {/* Location Marker - First */}
        <div className="space-y-4 pb-4 border-b border-gray-100 dark:border-gray-800">
          <ControlCheckbox
            label="Location Marker"
            checked={Boolean(layers.marker)}
            onChange={() => toggleLayer('marker')}
          />

          {layers.marker && (
            <div className="pl-8 pr-2 pb-2">
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 space-y-4">
                {/* Marker Type Selector */}
                <div className="space-y-2">
                  <ControlLabel className="text-[10px] uppercase text-gray-500">Icon Style</ControlLabel>
                  <div className="grid grid-cols-3 gap-2">
                    {markerTypes.map(({ id, icon: Icon, label }) => {
                      const isActive = layers.markerType === id;
                      return (
                        <button
                          key={id}
                          onClick={() => onLayersChange({ markerType: id })}
                          className={cn(
                            "flex flex-col items-center gap-1.5 py-2.5 px-1 rounded-lg border transition-all",
                            isActive
                              ? "bg-white dark:bg-gray-700 border-blue-500 text-blue-600 dark:text-blue-400 shadow-sm ring-1 ring-blue-500/20"
                              : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                          )}
                        >
                          <Icon className="h-4 w-4" />
                          <span className="text-[10px] uppercase tracking-tight font-medium">{label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Marker Color Control */}
                <div className="space-y-2 relative">
                  <ControlLabel
                    className="text-[10px] uppercase text-gray-500"
                    action={
                      <button
                        onClick={() => onLayersChange({ markerColor: undefined })}
                        className="text-[10px] text-blue-600 hover:underline font-medium"
                      >
                        Reset
                      </button>
                    }
                  >
                    Icon Color
                  </ControlLabel>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowMarkerColorPicker(!showMarkerColorPicker)}
                      className={cn(
                        'w-9 h-9 rounded-md border shadow-sm transition-all',
                        showMarkerColorPicker
                          ? 'border-blue-500 ring-2 ring-blue-500/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                      )}
                      style={{ backgroundColor: effectiveMarkerColor }}
                      aria-label="Toggle marker color picker"
                    />
                    <ControlInput
                      type="text"
                      value={effectiveMarkerColor}
                      onChange={(e) => onLayersChange({ markerColor: e.target.value })}
                      className="font-mono"
                      placeholder={palette.primary || palette.accent || palette.text}
                    />
                  </div>

                  {showMarkerColorPicker && (
                    <div className="absolute left-0 top-full mt-2 z-50 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl animate-in fade-in zoom-in-95 duration-200">
                      <div
                        className="fixed inset-0 z-[-1]"
                        onClick={() => setShowMarkerColorPicker(false)}
                      />
                      <HexColorPicker
                        color={effectiveMarkerColor}
                        onChange={(color) => onLayersChange({ markerColor: color })}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Geographic Features */}
        {(geographicLayers.length > 0 || landcoverLayers.length > 0 || landuseLayers.length > 0) && (
          <CollapsibleSection title="Geographic Features" defaultOpen={true}>
            <div className="space-y-2">
              {geographicLayers.map(renderLayerItem)}

              {/* Landcover */}
              {landcoverLayers.length > 0 && (
                <CollapsibleSection title="Landcover" defaultOpen={true}>
                  <div className="space-y-2">
                    {landcoverLayers.map(renderLayerItem)}
                  </div>
                </CollapsibleSection>
              )}

              {/* Landuse */}
              {landuseLayers.length > 0 && (
                <CollapsibleSection title="Landuse" defaultOpen={true}>
                  <div className="space-y-2">
                    {landuseLayers.map(renderLayerItem)}
                  </div>
                </CollapsibleSection>
              )}
            </div>
          </CollapsibleSection>
        )}

        {/* Data Layers */}
        {dataLayers.length > 0 && (
          <CollapsibleSection title="Data Layers" defaultOpen={true}>
            <div className="space-y-2">
              {dataLayers.map(renderLayerItem)}
            </div>
          </CollapsibleSection>
        )}
      </ControlSection>

      {/* Rendering Quality Section */}
      {onRenderingChange && (
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
      )}
    </div>
  );
}
