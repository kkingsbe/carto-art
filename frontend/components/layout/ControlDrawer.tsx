'use client';

import { Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { LocationSearch } from '@/components/controls/LocationSearch';
import { StyleSelector } from '@/components/controls/StyleSelector';
import { ColorControls } from '@/components/controls/ColorControls';
import { TypographyControls } from '@/components/controls/TypographyControls';
import { LayerControls } from '@/components/controls/LayerControls';
import { FormatControls } from '@/components/controls/FormatControls';
import { ExamplesGallery } from '@/components/controls/ExamplesGallery';
import { SavedProjects } from '@/components/controls/SavedProjects';
import { AccountPanel } from '@/components/controls/AccountPanel';
import type { Tab } from './TabNavigation';
import type { PosterConfig, PosterLocation, PosterStyle, ColorPalette, SavedProject } from '@/types/poster';

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
  setConfig: (config: PosterConfig) => void;
  savedProjects: SavedProject[];
  deleteProject: (id: string) => Promise<void>;
  renameProject: (id: string, name: string) => Promise<void>;
  currentMapId: string | null;
  currentMapName: string | null;
  currentMapStatus: {
    isSaved: boolean;
    isPublished: boolean;
    hasUnsavedChanges: boolean;
  } | null;
  onLoadProject: (project: SavedProject) => void;
  onPublishSuccess: () => void;
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
  setConfig,
  savedProjects,
  deleteProject,
  renameProject,
  currentMapId,
  currentMapName,
  currentMapStatus,
  onLoadProject,
  onPublishSuccess,
}: ControlDrawerProps) {
  const [libraryTab, setLibraryTab] = useState<'examples' | 'saved'>('examples');

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

        {activeTab === 'library' && (
          <div className="space-y-6">
            <div className="flex p-1 bg-gray-100 dark:bg-gray-700/50 rounded-lg">
              <button
                onClick={() => setLibraryTab('examples')}
                className={cn(
                  "flex-1 py-1.5 text-xs font-medium rounded-md transition-all",
                  libraryTab === 'examples'
                    ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                )}
              >
                Examples
              </button>
              <button
                onClick={() => setLibraryTab('saved')}
                className={cn(
                  "flex-1 py-1.5 text-xs font-medium rounded-md transition-all",
                  libraryTab === 'saved'
                    ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                )}
              >
                Saved
              </button>
            </div>

            {libraryTab === 'examples' ? (
              <ExamplesGallery
                onSelect={setConfig}
                currentConfig={config}
              />
            ) : (
              <SavedProjects
                projects={savedProjects}
                onLoad={onLoadProject}
                onDelete={deleteProject}
                onRename={renameProject}
              />
            )}
          </div>
        )}

        {activeTab === 'location' && (
          <div className="space-y-6">
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Search Location
              </h3>
              <LocationSearch
                onLocationSelect={updateLocation}
                currentLocation={config.location}
              />
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-xs text-blue-800 dark:text-blue-200">
              <p className="font-medium mb-1">Tip: Fine-tune your view</p>
              <p className="opacity-90">Drag the map to adjust position, or use the zoom controls to get the perfect framing.</p>
            </div>
          </div>
        )}

        {activeTab === 'style' && (
          <div className="space-y-8">
            <div className="space-y-4">
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Map Style
              </h3>
              <StyleSelector
                selectedStyleId={config.style.id}
                onStyleSelect={updateStyle}
                currentConfig={config}
              />
            </div>

            <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-700">
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Color Palette
              </h3>
              <ColorControls
                palette={config.palette}
                presets={config.style.palettes}
                onPaletteChange={updatePalette}
              />
            </div>

            <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-700">
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Layer Visibility
              </h3>
              <LayerControls
                layers={config.layers}
                onLayersChange={updateLayers}
                availableToggles={config.style.layerToggles}
                palette={config.palette}
              />
            </div>
          </div>
        )}

        {activeTab === 'text' && (
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Typography
              </h3>
              <TypographyControls
                config={config}
                onTypographyChange={updateTypography}
                onLocationChange={updateLocation}
              />
            </div>
          </div>
        )}

        {activeTab === 'frame' && (
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Format & Layout
              </h3>
              <FormatControls
                format={config.format}
                onFormatChange={updateFormat}
              />
            </div>
          </div>
        )}

        {activeTab === 'account' && (
          <div className="space-y-6">
            <AccountPanel
              currentMapId={currentMapId}
              currentMapName={currentMapName}
              currentMapStatus={currentMapStatus}
              onPublishSuccess={onPublishSuccess}
            />
          </div>
        )}
      </div>
    </aside>
  );
}

