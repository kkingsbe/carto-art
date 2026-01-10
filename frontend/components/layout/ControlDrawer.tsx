'use client';

import { Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

// New Panel Imports
import { EssentialsPanel } from '@/components/controls/panels/EssentialsPanel';
import { CustomizePanel } from '@/components/controls/panels/CustomizePanel';
import { AnnotationPanel } from '@/components/controls/panels/AnnotationPanel';
import { FramePanel } from '@/components/controls/panels/FramePanel';
import { AnimationPanel } from '@/components/controls/panels/AnimationPanel';

// Legacy/Shared Components
import { VistasGallery } from '@/components/controls/VistasGallery';
import { SavedProjects } from '@/components/controls/SavedProjects';
import { AccountPanel } from '@/components/controls/AccountPanel';

import type { Tab } from './TabNavigation';
import type { PosterConfig, PosterLocation, PosterStyle, ColorPalette, SavedProject } from '@/types/poster';
import type { AnimationType } from '@/hooks/useMapAnimation';

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
  onAnimationStart: (type: AnimationType) => void;
  onAnimationStop: () => void;
  isAnimationPlaying: boolean;
  activeAnimation: AnimationType | null;
  onPublish: () => void;
  onUnpublish: () => void;
  onRandomize: () => void;
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
  onAnimationStart,
  onAnimationStop,
  isAnimationPlaying,
  activeAnimation,
  onPublish,
  onUnpublish,
  onRandomize
}: ControlDrawerProps) {
  const [libraryTab, setLibraryTab] = useState<'vistas' | 'saved'>('vistas');

  return (
    <aside className={cn(
      "relative bg-transparent h-full overflow-hidden transition-all duration-500 ease-out",
      isDrawerOpen ? "w-full md:w-[340px] opacity-100" : "w-0 opacity-0"
    )}>
      <div className="h-full overflow-y-auto w-full md:w-[340px]"> {/* Fixed width inner container */}
        <div className="p-4 md:p-6 space-y-6 pb-24">

          {/* Mobile Header */}
          <div className="flex items-center justify-between md:hidden mb-2">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white capitalize">{activeTab}</h2>
            <button
              onClick={() => setIsDrawerOpen(false)}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <Minus className="w-5 h-5" />
            </button>
          </div>

          {/* New Consolidated Panels */}
          {activeTab === 'essentials' && (
            <EssentialsPanel
              config={config}
              updateLocation={updateLocation}
              updateStyle={updateStyle}
              updateLayers={updateLayers}
              setConfig={setConfig}
              onRandomize={onRandomize}
            />
          )}

          {activeTab === 'customize' && (
            <CustomizePanel
              config={config}
              updatePalette={updatePalette}
              updateStyle={updateStyle}
              updateLayers={updateLayers}
              updateRendering={updateRendering}
              setConfig={setConfig}
            />
          )}

          {activeTab === 'annotate' && (
            <AnnotationPanel
              config={config}
              updateTypography={updateTypography}
              updateLocation={updateLocation}
              updateLayers={updateLayers}
              setConfig={setConfig}
            />
          )}

          {activeTab === 'frame' && (
            <FramePanel
              config={config}
              updateFormat={updateFormat}
            />
          )}

          {activeTab === 'animate' && (
            <AnimationPanel
              onAnimationStart={onAnimationStart}
              onAnimationStop={onAnimationStop}
              isPlaying={isAnimationPlaying}
              activeAnimation={activeAnimation}
            />
          )}

          {/* Resources & System Panels */}
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
                onPublish={onPublish}
                onUnpublish={onUnpublish}
              />
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
