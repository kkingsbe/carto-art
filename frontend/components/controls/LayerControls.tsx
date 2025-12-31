'use client';

import { PosterConfig, LayerToggle } from '@/types/poster';
import { cn } from '@/lib/utils';

interface LayerControlsProps {
  layers: PosterConfig['layers'];
  onLayersChange: (layers: Partial<PosterConfig['layers']>) => void;
  availableToggles: LayerToggle[];
}

export function LayerControls({ layers, onLayersChange, availableToggles }: LayerControlsProps) {
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
        
        {/* Always include Marker toggle if not in style toggles */}
        {!availableToggles.find(t => t.id === 'marker') && (
          <label
            key="marker"
            className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
          >
            <input
              type="checkbox"
              checked={layers.marker}
              onChange={() => toggleLayer('marker')}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="text-sm text-gray-900 dark:text-gray-100">
              Location Marker
            </span>
          </label>
        )}
      </div>
    </div>
  );
}

