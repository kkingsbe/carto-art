'use client';

import { PosterConfig, LayerToggle, ColorPalette } from '@/types/poster';
import { cn } from '@/lib/utils';
import { HexColorPicker } from 'react-colorful';
import { useState, useMemo } from 'react';
import { Type, Palette, Heart, Home, MapPin, Target, Circle, Radio } from 'lucide-react';

interface LayerControlsProps {
  layers: PosterConfig['layers'];
  onLayersChange: (layers: Partial<PosterConfig['layers']>) => void;
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

export function LayerControls({ layers, onLayersChange, availableToggles, palette }: LayerControlsProps) {
  const [showMarkerColorPicker, setShowMarkerColorPicker] = useState(false);
  
  const effectiveMarkerColor = useMemo(() => {
    return layers.markerColor || palette.accent || palette.text;
  }, [layers.markerColor, palette.accent, palette.text]);

  const toggleLayer = (key: keyof PosterConfig['layers']) => {
    onLayersChange({ [key]: !layers[key] });
  };

  const handleLabelSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onLayersChange({ labelSize: parseFloat(e.target.value) });
  };

  const handleLabelMaxWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onLayersChange({ labelMaxWidth: parseFloat(e.target.value) });
  };

  const handleContourDensityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    console.log('Contour density changed:', value);
    onLayersChange({ contourDensity: value });
  };

  const handleHillshadeExaggerationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onLayersChange({ hillshadeExaggeration: parseFloat(e.target.value) });
  };

  const handleRoadWeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onLayersChange({ roadWeight: parseFloat(e.target.value) });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-2">
        {availableToggles.map((item) => (
          <div key={item.id} className="space-y-2">
            <label
              className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
            >
              <input
                type="checkbox"
                checked={layers[item.id as keyof PosterConfig['layers']] as boolean ?? false}
                onChange={() => toggleLayer(item.id as keyof PosterConfig['layers'])}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-900 dark:text-gray-100">
                {item.name}
              </span>
            </label>

            {/* Road Weight Control - only show if this is the streets toggle and it's active */}
            {item.id === 'streets' && layers.streets && (
              <div className="px-9 pb-2 space-y-1">
                <div className="flex justify-between">
                  <span className="text-[10px] text-gray-500 uppercase">Line Weight</span>
                  <span className="text-[10px] text-gray-500 font-mono">{(layers.roadWeight ?? 1.0).toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="3.0"
                  step="0.1"
                  value={layers.roadWeight ?? 1.0}
                  onChange={handleRoadWeightChange}
                  className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-blue-600"
                />
                <div className="flex justify-between text-[8px] text-gray-400 uppercase px-0.5">
                  <span>Fine</span>
                  <span>Bold</span>
                </div>
              </div>
            )}

            {/* Label Size Control - only show if this is the labels toggle and it's active */}
            {item.id === 'labels' && layers.labels && (
              <div className="px-9 pb-2 space-y-1">
                <div className="flex justify-between">
                  <span className="text-[10px] text-gray-500 uppercase">Label Size</span>
                  <span className="text-[10px] text-gray-500 font-mono">{(layers.labelSize ?? 1.0).toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2.5"
                  step="0.1"
                  value={layers.labelSize ?? 1.0}
                  onChange={handleLabelSizeChange}
                  className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-blue-600"
                />

                <div className="flex justify-between pt-2">
                  <span className="text-[10px] text-gray-500 uppercase">Label Wrap</span>
                  <span className="text-[10px] text-gray-500 font-mono">{layers.labelMaxWidth ?? 10}</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="20"
                  step="1"
                  value={layers.labelMaxWidth ?? 10}
                  onChange={handleLabelMaxWidthChange}
                  className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-blue-600"
                />
              </div>
            )}

            {/* Hillshade Exaggeration Control - only show if this is the terrain toggle and it's active */}
            {item.id === 'terrain' && layers.terrain && (
              <div className="px-9 pb-2 space-y-1">
                <div className="flex justify-between">
                  <span className="text-[10px] text-gray-500 uppercase">Shading Intensity</span>
                  <span className="text-[10px] text-gray-500 font-mono">{(layers.hillshadeExaggeration ?? 0.5).toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="1.5"
                  step="0.05"
                  value={layers.hillshadeExaggeration ?? 0.5}
                  onChange={handleHillshadeExaggerationChange}
                  className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-blue-600"
                />
                <div className="flex justify-between text-[8px] text-gray-400 uppercase px-0.5">
                  <span>Flat</span>
                  <span>Dramatic</span>
                </div>
              </div>
            )}

            {/* Contour Density Control - only show if this is the contours toggle and it's active */}
            {item.id === 'contours' && layers.contours && (
              <div className="px-9 pb-2 space-y-1">
                <div className="flex justify-between">
                  <span className="text-[10px] text-gray-500 uppercase">Line Interval</span>
                  <span className="text-[10px] text-gray-500 font-mono">{layers.contourDensity ?? 50}m</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="250"
                  step="10"
                  value={layers.contourDensity ?? 50}
                  onChange={handleContourDensityChange}
                  className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-blue-600"
                />
                <div className="flex justify-between text-[8px] text-gray-400 uppercase px-0.5">
                  <span>Dense</span>
                  <span>Sparse</span>
                </div>
              </div>
            )}
          </div>
        ))}
        
        {/* Marker controls */}
        <div key="marker-group" className="space-y-2">
          <label
            className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
          >
            <input
              type="checkbox"
              checked={layers.marker}
              onChange={() => toggleLayer('marker')}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="text-sm text-gray-900 dark:text-gray-100 font-medium">
              Location Marker
            </span>
          </label>

          {layers.marker && (
            <div className="px-9 pb-2 space-y-4">
              {/* Marker Type Selector */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-[10px] text-gray-500 uppercase font-semibold">
                  <Type className="h-3 w-3" />
                  <span>Icon Style</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {markerTypes.map(({ id, icon: Icon, label }) => (
                    <button
                      key={id}
                      onClick={() => onLayersChange({ markerType: id })}
                      className={cn(
                        "flex flex-col items-center gap-1 py-2 px-1 rounded-md border transition-all",
                        layers.markerType === id
                          ? "bg-blue-50 border-blue-300 text-blue-700 dark:bg-blue-900/40 dark:border-blue-700 dark:text-blue-300 ring-1 ring-blue-300/50"
                          : "bg-white border-gray-200 text-gray-600 hover:border-gray-300 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="text-[9px] uppercase tracking-tighter font-medium">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Marker Color Control - Matching ColorControls.tsx style */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[10px] text-gray-500 uppercase font-semibold">
                    <Palette className="h-3 w-3" />
                    <span>Icon Color</span>
                  </div>
                  <button
                    onClick={() => onLayersChange({ markerColor: undefined })}
                    className="text-[10px] text-blue-600 hover:underline font-medium"
                  >
                    Reset
                  </button>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowMarkerColorPicker(!showMarkerColorPicker)}
                    className={cn(
                      'w-10 h-10 rounded border-2 transition-all shadow-sm',
                      showMarkerColorPicker
                        ? 'border-blue-500 ring-2 ring-blue-100 dark:ring-blue-900/30'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    )}
                    style={{ backgroundColor: effectiveMarkerColor }}
                    aria-label="Toggle marker color picker"
                  />
                  <input
                    type="text"
                    value={effectiveMarkerColor}
                    onChange={(e) => onLayersChange({ markerColor: e.target.value })}
                    className={cn(
                      'flex-1 px-3 py-2 text-sm border border-gray-200 rounded-md font-mono',
                      'focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500',
                      'dark:bg-gray-800 dark:border-gray-700 dark:text-white'
                    )}
                    placeholder={palette.accent || palette.text}
                  />
                </div>
                
                {showMarkerColorPicker && (
                  <div className="mt-2 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
                    <HexColorPicker
                      color={effectiveMarkerColor}
                      onChange={(color) => onLayersChange({ markerColor: color })}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

