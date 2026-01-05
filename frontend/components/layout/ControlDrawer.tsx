'use client';

import { Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { LocationSearch } from '@/components/controls/LocationSearch';
import { CameraControls } from '@/components/controls/CameraControls';
import { StyleSelector } from '@/components/controls/StyleSelector';
import { ColorControls } from '@/components/controls/ColorControls';
import { TypographyControls } from '@/components/controls/TypographyControls';
import { LayerControls } from '@/components/controls/LayerControls';
import { FormatControls } from '@/components/controls/FormatControls';
import { VistasGallery } from '@/components/controls/VistasGallery';
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
  updateRendering: (rendering: Partial<NonNullable<PosterConfig['rendering']>>) => void;
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
  updateRendering,
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
  const [libraryTab, setLibraryTab] = useState<'vistas' | 'saved'>('vistas');
  const [tipDismissed, setTipDismissed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('cartoart-tip-dismissed') === 'true';
    }
    return false;
  });

  const handleDismissTip = () => {
    setTipDismissed(true);
    localStorage.setItem('cartoart-tip-dismissed', 'true');
  };

  return (
    <aside className={cn(
      "relative bg-transparent h-full overflow-hidden transition-all duration-500 ease-out",
      isDrawerOpen ? "w-full md:w-[340px] opacity-100" : "w-0 opacity-0"
    )}>
      <div className="h-full overflow-y-auto w-full md:w-[340px]"> {/* Fixed width inner container to prevent reflow during transition */}
        <div className="p-4 md:p-6 space-y-6 pb-24">
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
            <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-500">
              <div className="flex items-center justify-between mb-2 md:block">
                <h3 className="hidden md:block text-lg font-semibold text-gray-900 dark:text-white">Library</h3>
              </div>
              <div className="flex p-1 bg-gray-100/50 dark:bg-gray-800/50 rounded-xl">
                <button
                  onClick={() => setLibraryTab('vistas')}
                  className={cn(
                    "flex-1 py-2 text-xs font-medium rounded-lg transition-all",
                    libraryTab === 'vistas'
                      ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                  )}
                >
                  Vistas
                </button>
                <button
                  onClick={() => setLibraryTab('saved')}
                  className={cn(
                    "flex-1 py-2 text-xs font-medium rounded-lg transition-all",
                    libraryTab === 'saved'
                      ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                  )}
                >
                  Saved Maps
                </button>
              </div>

              {libraryTab === 'vistas' ? (
                <VistasGallery
                  onLocationSelect={updateLocation}
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
            <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-500">
              <div className="flex items-center justify-between md:block">
                <h3 className="hidden md:block text-lg font-semibold text-gray-900 dark:text-white">Location</h3>
              </div>
              <div className="space-y-2">
                <LocationSearch
                  onLocationSelect={updateLocation}
                  currentLocation={config.location}
                />
              </div>

              {!tipDismissed && (
                <div className="bg-blue-50/50 dark:bg-blue-900/10 p-4 rounded-xl text-xs text-blue-800 dark:text-blue-200 border border-blue-100 dark:border-blue-900/20 relative group">
                  <button
                    onClick={handleDismissTip}
                    className="absolute top-2 right-2 p-1 text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 transition-colors"
                    title="Dismiss tip"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <p className="font-medium mb-1">Tip: Fine-tune your view</p>
                  <p className="opacity-90 leading-relaxed pr-4">Drag the map to reposition. Hold <kbd className="px-1 py-0.5 bg-white dark:bg-black rounded text-[10px]">Ctrl</kbd> to rotate and tilt the view.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'camera' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-500">
              <div className="flex items-center justify-between md:block">
                <h3 className="hidden md:block text-lg font-semibold text-gray-900 dark:text-white">Camera</h3>
              </div>
              <CameraControls
                layers={config.layers}
                onLayersChange={updateLayers}
              />
            </div>
          )}

          {activeTab === 'style' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-500">
              <div className="flex items-center justify-between md:block">
                <h3 className="hidden md:block text-lg font-semibold text-gray-900 dark:text-white">Map Style</h3>
              </div>
              <StyleSelector
                selectedStyleId={config.style.id}
                onStyleSelect={updateStyle}
                currentConfig={config}
              />

              <div className="pt-6 border-t border-gray-100 dark:border-gray-700/50">
                <ColorControls
                  palette={config.palette}
                  presets={config.style.palettes}
                  onPaletteChange={updatePalette}
                />
              </div>
            </div>
          )}

          {activeTab === 'layers' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-500">
              <div className="flex items-center justify-between md:block">
                <h3 className="hidden md:block text-lg font-semibold text-gray-900 dark:text-white">Layers</h3>
              </div>
              <div className="space-y-4">
                <LayerControls
                  layers={config.layers}
                  rendering={config.rendering}
                  onLayersChange={updateLayers}
                  onRenderingChange={updateRendering}
                  availableToggles={config.style.layerToggles}
                  palette={config.palette}
                />
              </div>
            </div>
          )}

          {activeTab === 'text' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-500">
              <div className="flex items-center justify-between md:block">
                <h3 className="hidden md:block text-lg font-semibold text-gray-900 dark:text-white">Typography</h3>
              </div>
              <div className="space-y-4">
                <TypographyControls
                  config={config}
                  onTypographyChange={updateTypography}
                  onLocationChange={updateLocation}
                  onLayersChange={updateLayers}
                />
              </div>
            </div>
          )}

          {activeTab === 'frame' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-500">
              <div className="flex items-center justify-between md:block">
                <h3 className="hidden md:block text-lg font-semibold text-gray-900 dark:text-white">Frame & Format</h3>
              </div>
              <div className="space-y-4">
                <FormatControls
                  format={config.format}
                  onFormatChange={updateFormat}
                />
              </div>
            </div>
          )}

          {activeTab === 'account' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-500">
              <div className="flex items-center justify-between md:block">
                <h3 className="hidden md:block text-lg font-semibold text-gray-900 dark:text-white">Account</h3>
              </div>
              <AccountPanel
                currentMapId={currentMapId}
                currentMapName={currentMapName}
                currentMapStatus={currentMapStatus}
                onPublishSuccess={onPublishSuccess}
              />
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

