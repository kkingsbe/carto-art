'use client';

import { Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LocationSearch } from '@/components/controls/LocationSearch';
import { StyleSelector } from '@/components/controls/StyleSelector';
import { ColorControls } from '@/components/controls/ColorControls';
import { TypographyControls } from '@/components/controls/TypographyControls';
import { LayerControls } from '@/components/controls/LayerControls';
import { FormatControls } from '@/components/controls/FormatControls';
import type { Tab } from './TabNavigation';
import type { PosterConfig, PosterLocation, PosterStyle, ColorPalette } from '@/types/poster';

interface ControlDrawerProps {
  activeTab: Tab;
  isDrawerOpen: boolean;
  setIsDrawerOpen: (open: boolean) => void;
  config: PosterConfig;
  updateLocation: (location: Partial<PosterLocation>) => void;
  updateStyle: (style: PosterStyle) => void;
  updatePalette: (palette: ColorPalette) => void;
  updateTypography: (typography: Partial<PosterConfig['typography']>) => void;
  updateFormat: (format: Partial<PosterConfig['format']>) => void;
  updateLayers: (layers: Partial<PosterConfig['layers']>) => void;
}

export function ControlDrawer({
  activeTab,
  isDrawerOpen,
  setIsDrawerOpen,
  config,
  updateLocation,
  updateStyle,
  updatePalette,
  updateTypography,
  updateFormat,
  updateLayers,
}: ControlDrawerProps) {
  return (
    <aside className={cn(
      "fixed inset-x-0 bottom-16 md:relative md:bottom-auto md:w-80 bg-white dark:bg-gray-800 border-t md:border-t-0 md:border-r border-gray-200 dark:border-gray-700 overflow-y-auto flex flex-col z-50 transition-all duration-300 ease-in-out shadow-2xl md:shadow-none",
      isDrawerOpen ? "h-[50vh] md:h-full translate-y-0" : "h-0 md:h-full translate-y-full md:translate-y-0"
    )}>
      <div className="p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-between md:hidden mb-2">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white capitalize">{activeTab}</h2>
          <button 
            onClick={() => setIsDrawerOpen(false)}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <Minus className="w-5 h-5" />
          </button>
        </div>

        {activeTab === 'location' && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Location & Map</h2>
            <LocationSearch
              onLocationSelect={updateLocation}
              currentLocation={config.location}
            />
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-sm text-blue-800 dark:text-blue-200">
              <p>Tip: Drag the map to fine-tune the position.</p>
            </div>
          </div>
        )}

        {activeTab === 'style' && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Style & Colors</h2>
            <StyleSelector
              selectedStyleId={config.style.id}
              onStyleSelect={updateStyle}
            />
            <ColorControls
              palette={config.palette}
              presets={config.style.palettes}
              onPaletteChange={updatePalette}
            />
          </div>
        )}

        {activeTab === 'text' && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Typography</h2>
            <TypographyControls
              config={config}
              onTypographyChange={updateTypography}
              onLocationChange={updateLocation}
            />
          </div>
        )}

        {activeTab === 'layers' && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Map Layers</h2>
            <LayerControls
              layers={config.layers}
              onLayersChange={updateLayers}
              availableToggles={config.style.layerToggles}
            />
          </div>
        )}

        {activeTab === 'layout' && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Format & Layout</h2>
            <FormatControls
              format={config.format}
              onFormatChange={updateFormat}
            />
          </div>
        )}
      </div>
    </aside>
  );
}

