'use client';

import { useMemo, useCallback, useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { usePosterConfig } from '@/hooks/usePosterConfig';
import { useSavedProjects } from '@/hooks/useSavedProjects';
import { useMapExport } from '@/hooks/useMapExport';
import { Maximize, Plus, Minus, Undo2, Redo2, RotateCcw } from 'lucide-react';
import { MapPreview } from '@/components/map/MapPreview';
import { TextOverlay } from '@/components/map/TextOverlay';
import { ExportButton } from '@/components/controls/ExportButton';
import { SaveButton } from '@/components/controls/SaveButton';
import { SaveCopyButton } from '@/components/controls/SaveCopyButton';
import { EditorToolbar } from '@/components/editor/EditorToolbar';
import { applyPaletteToStyle } from '@/lib/styles/applyPalette';
import { throttle, cn } from '@/lib/utils';
import { THROTTLE } from '@/lib/constants';
import { getNumericRatio, getAspectRatioCSS } from '@/lib/styles/dimensions';
import { TabNavigation, type Tab } from './TabNavigation';
import { ControlDrawer } from './ControlDrawer';
import { ErrorToastContainer } from '@/components/ui/ErrorToast';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import Link from 'next/link';
import type MapLibreGL from 'maplibre-gl';
import { getMapById } from '@/lib/actions/maps';
import { isConfigEqual, cloneConfig } from '@/lib/utils/configComparison';
import type { SavedProject, PosterConfig } from '@/types/poster';
import type { ExportResolution } from '@/lib/export/resolution';
import { generateThumbnail } from '@/lib/export/thumbnail';
import { DEFAULT_CONFIG } from '@/lib/config/defaults';
import { FeedbackModal, useFeedback } from '@/components/feedback';
import type { FeedbackFormData } from '@/components/feedback';

export function PosterEditor() {
  const router = useRouter();
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState<Tab>('location');
  const [isDrawerOpen, setIsDrawerOpen] = useState(true);

  const {
    config,
    updateLocation,
    updateStyle,
    updatePalette,
    updateTypography,
    updateFormat,
    updateLayers,
    updateRendering,
    setConfig,
    undo,
    redo,
    canUndo,
    canRedo,
  } = usePosterConfig();

  const {
    projects,
    saveProject,
    deleteProject,
    renameProject,
    isAuthenticated
  } = useSavedProjects();

  const { errors, handleError, clearError } = useErrorHandler();

  // Track currently loaded saved map
  const [currentMapId, setCurrentMapId] = useState<string | null>(null);
  const [currentMapName, setCurrentMapName] = useState<string | null>(null);
  const [originalConfig, setOriginalConfig] = useState<PosterConfig | null>(null);
  const [currentMapStatus, setCurrentMapStatus] = useState<{
    isSaved: boolean;
    isPublished: boolean;
    hasUnsavedChanges: boolean;
  } | null>(null);

  // Modal coordination
  const [showDonationModal, setShowDonationModal] = useState(false);

  const { isExporting, exportToPNG, setMapRef, fitToLocation, zoomIn, zoomOut } = useMapExport(config);

  // Keep a reference to the map instance for thumbnail generation
  const mapInstanceRef = useRef<MapLibreGL.Map | null>(null);

  // Track export count for feedback trigger
  const [exportCount, setExportCount] = useState(0);

  // Feedback system
  const {
    shouldShow: shouldShowFeedback,
    isSubmitting: isFeedbackSubmitting,
    hideFeedback,
    submitFeedback,
    dismissFeedback,
  } = useFeedback({
    triggerType: 'post_export',
    exportCount,
    mapId: currentMapId || undefined,
  });

  // Wrap exportToPNG to handle errors and track export count
  const handleExport = useCallback(async (resolution?: ExportResolution) => {
    try {
      await exportToPNG(resolution);
      // Increment export count on successful export
      setExportCount(prev => prev + 1);
    } catch (error) {
      handleError(error);
    }
  }, [exportToPNG, handleError]);

  // Handle feedback submission
  const handleFeedbackSubmit = useCallback(async (data: FeedbackFormData): Promise<boolean> => {
    return await submitFeedback(data);
  }, [submitFeedback]);

  // Handle loading a saved project
  const handleLoadProject = useCallback(async (project: SavedProject) => {
    setConfig(project.config);
    setCurrentMapId(project.id);
    setCurrentMapName(project.name);
    setOriginalConfig(cloneConfig(project.config));

    // Fetch full metadata if authenticated
    if (isAuthenticated) {
      try {
        const fullMap = await getMapById(project.id);
        if (fullMap) {
          setCurrentMapStatus({
            isSaved: true,
            isPublished: fullMap.is_published,
            hasUnsavedChanges: false
          });
          return;
        }
      } catch (error) {
        console.error('Failed to fetch map metadata:', error);
      }
    }

    // Fallback
    setCurrentMapStatus({
      isSaved: true,
      isPublished: false,
      hasUnsavedChanges: false
    });
  }, [setConfig, isAuthenticated]);

  // Handle saving a project (wraps saveProject to track currentMapId)
  const handleSaveProject = useCallback(async (name: string, posterConfig: PosterConfig) => {
    // Generate thumbnail if map is available and user is authenticated
    let thumbnailBlob: Blob | undefined;
    if (mapInstanceRef.current && isAuthenticated) {
      try {
        thumbnailBlob = await generateThumbnail(mapInstanceRef.current, posterConfig);
      } catch (error) {
        console.error('Failed to generate thumbnail:', error);
        // Continue without thumbnail
      }
    }

    // Save the project and get the saved project back
    const savedProject = await saveProject(name, posterConfig, thumbnailBlob);

    // Automatically load the saved project
    await handleLoadProject(savedProject);
  }, [saveProject, handleLoadProject, isAuthenticated]);

  // Wrapper for SaveButton that passes current config
  const handleSaveClick = useCallback(async (name: string) => {
    await handleSaveProject(name, config);
  }, [handleSaveProject, config]);

  // Handle save a copy - always creates a NEW project and switches to it
  const handleSaveCopy = useCallback(async (name: string) => {
    // Generate thumbnail if map is available and user is authenticated
    let thumbnailBlob: Blob | undefined;
    if (mapInstanceRef.current && isAuthenticated) {
      try {
        thumbnailBlob = await generateThumbnail(mapInstanceRef.current, config);
      } catch (error) {
        console.error('Failed to generate thumbnail:', error);
        // Continue without thumbnail
      }
    }

    // Always create NEW project (never update existing)
    const savedProject = await saveProject(name, config, thumbnailBlob);

    // Switch to the newly created copy
    setCurrentMapId(savedProject.id);
    setCurrentMapName(savedProject.name);
    setOriginalConfig(cloneConfig(savedProject.config));
    setCurrentMapStatus({
      isSaved: true,
      isPublished: false,
      hasUnsavedChanges: false
    });

    // Update URL to reflect new map
    router.replace(`/?map=${savedProject.id}`, { scroll: false });
  }, [saveProject, config, isAuthenticated, router]);

  // Handle publish success - refetch map status to get latest published state
  const handlePublishSuccess = useCallback(async () => {
    if (!currentMapId || !isAuthenticated) return;

    try {
      const fullMap = await getMapById(currentMapId);
      if (fullMap) {
        setCurrentMapStatus(prev => prev ? { ...prev, isPublished: fullMap.is_published } : null);
      }
    } catch (error) {
      console.error('Failed to refresh map status:', error);
    }
  }, [currentMapId, isAuthenticated]);

  // Detect unsaved changes
  useEffect(() => {
    if (currentMapId && originalConfig) {
      const hasChanges = !isConfigEqual(config, originalConfig);
      setCurrentMapStatus(prev => prev ? { ...prev, hasUnsavedChanges: hasChanges } : null);
    }
  }, [config, originalConfig, currentMapId]);

  const numericRatio = useMemo(() => {
    return getNumericRatio(config.format.aspectRatio, config.format.orientation);
  }, [config.format.aspectRatio, config.format.orientation]);

  // Apply palette colors and visibility to the current map style
  const mapStyle = useMemo(() => {
    return applyPaletteToStyle(
      config.style.mapStyle,
      config.palette,
      config.layers,
      config.style.layerToggles
    );
  }, [config.style.mapStyle, config.palette, config.layers, config.style.layerToggles]);

  const handleMapLoad = (map: MapLibreGL.Map) => {
    setMapRef(map);
    mapInstanceRef.current = map;
  };

  // Throttle the location update to prevent excessive style re-renders
  const throttledUpdateLocation = useMemo(
    () => throttle((center: [number, number], zoom: number) => {
      updateLocation({ center, zoom });
    }, THROTTLE.MAP_MOVE),
    [updateLocation]
  );

  const handleMapMove = useCallback((center: [number, number], zoom: number) => {
    throttledUpdateLocation(center, zoom);
  }, [throttledUpdateLocation]);

  // Handle reset - clears saved map state and resets to default config
  const handleReset = useCallback(() => {
    // Clear saved map state
    setCurrentMapId(null);
    setCurrentMapName(null);
    setOriginalConfig(null);
    setCurrentMapStatus(null);

    // Reset config to default
    setConfig(DEFAULT_CONFIG);

    // Clear URL state parameter by navigating to clean URL
    router.replace(pathname, { scroll: false });
  }, [setConfig, router, pathname]);

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (canUndo) undo();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        if (canRedo) redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canUndo, canRedo, undo, redo]);

  // Handle Remix from URL
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const remixId = searchParams.get('remix');

    if (remixId) {
      const loadRemix = async () => {
        try {
          const mapData = await getMapById(remixId);
          if (mapData) {
            setConfig(mapData.config);
            setCurrentMapName(`${mapData.title} (Remix)`);
            setCurrentMapId(null); // Force it to be a new project on save
            setOriginalConfig(null); // Mark as dirty
            setCurrentMapStatus({
              isSaved: false,
              isPublished: false,
              hasUnsavedChanges: true
            });

            // Clear the remix param from URL
            const newParams = new URLSearchParams(window.location.search);
            newParams.delete('remix');
            const newUrl = `${pathname}${newParams.toString() ? '?' + newParams.toString() : ''}`;
            router.replace(newUrl, { scroll: false });
          }
        } catch (error) {
          console.error('Failed to load remix map:', error);
          handleError(new Error('Failed to load the map for remixing.'));
        }
      };

      loadRemix();
    }
  }, [setConfig, pathname, router, handleError]);

  return (
    <div className="relative h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden selection:bg-blue-500/30">
      <ErrorToastContainer errors={errors} onDismiss={clearError} />

      {/* Top Toolbar - Floating */}
      <EditorToolbar
        onUndo={undo}
        onRedo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
        onReset={handleReset}
        onSave={handleSaveClick}
        onSaveCopy={handleSaveCopy}
        onExport={handleExport}
        isExporting={isExporting}
        currentMapName={currentMapName}
        hasUnsavedChanges={currentMapStatus?.hasUnsavedChanges}
        isAuthenticated={isAuthenticated}
        format={config.format}
        currentMapId={currentMapId}
        showDonationModal={showDonationModal}
        onDonationModalChange={setShowDonationModal}
      />

      {/* Floating Sidebar Container */}
      <div className="absolute top-4 left-4 bottom-4 z-40 flex flex-row pointer-events-none">
        <div className="pointer-events-auto flex flex-row h-full shadow-2xl rounded-2xl overflow-hidden bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200 dark:border-gray-700/50">
          <TabNavigation
            activeTab={activeTab}
            isDrawerOpen={isDrawerOpen}
            onTabChange={setActiveTab}
            onToggleDrawer={setIsDrawerOpen}
          />

          <ControlDrawer
            activeTab={activeTab}
            isDrawerOpen={isDrawerOpen}
            setIsDrawerOpen={setIsDrawerOpen}
            config={config}
            updateLocation={updateLocation}
            updateStyle={updateStyle}
            updatePalette={updatePalette}
            updateTypography={updateTypography}
            updateFormat={updateFormat}
            updateLayers={updateLayers}
            updateRendering={updateRendering}
            setConfig={setConfig}
            savedProjects={projects}
            deleteProject={deleteProject}
            renameProject={renameProject}
            currentMapId={currentMapId}
            currentMapName={currentMapName}
            currentMapStatus={currentMapStatus}
            onLoadProject={handleLoadProject}
            onPublishSuccess={handlePublishSuccess}
          />
        </div>
      </div>

      {/* Main Content Area - Full Screen with Centered Poster */}
      <main
        className="absolute inset-0 flex items-center justify-center p-4 md:p-12 overflow-hidden"
        style={{ containerType: 'size' }}
      >
        {/* Map Canvas / Poster Paper */}
        <div
          className="relative shadow-2xl bg-white flex flex-col transition-all duration-500 ease-out ring-1 ring-black/5"
          style={{
            aspectRatio: getAspectRatioCSS(config.format.aspectRatio, config.format.orientation),
            backgroundColor: config.palette.background,
            width: `min(calc(100% - 4rem), calc((100cqh - 4rem) * ${numericRatio}))`,
            height: 'auto',
            maxHeight: 'calc(100cqh - 4rem)',
            boxShadow: '0 50px 100px -20px rgba(0, 0, 0, 0.25), 0 30px 60px -30px rgba(0, 0, 0, 0.3)',
            containerType: 'size',
          }}
        >
          {/* The masked map area */}
          <div
            className="absolute overflow-hidden min-h-0 min-w-0"
            style={{
              top: `${config.format.margin}cqw`,
              left: `${config.format.margin}cqw`,
              right: `${config.format.margin}cqw`,
              bottom: `${config.format.margin}cqw`,
              borderRadius: (config.format.maskShape || 'rectangular') === 'circular' ? '50%' : '0',
            }}
          >
            <MapPreview
              mapStyle={mapStyle}
              location={config.location}
              format={config.format}
              rendering={config.rendering}
              showMarker={config.layers.marker}
              markerColor={config.layers.markerColor || config.palette.primary || config.palette.accent || config.palette.text}
              onMapLoad={handleMapLoad}
              onMove={handleMapMove}
              layers={config.layers}
              layerToggles={config.style.layerToggles}
            />

            {/* Floating Map Controls - Inside the paper */}
            <div className="absolute bottom-4 right-4 flex flex-col items-center gap-1 z-10">
              <div className="flex flex-col bg-white/90 backdrop-blur-sm rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <button
                  onClick={zoomIn}
                  className="p-2 hover:bg-gray-50 transition-colors text-gray-700 active:bg-gray-100"
                  title="Zoom In"
                >
                  <Plus className="h-4 w-4" />
                </button>
                <div className="h-px w-full bg-gray-200" />
                <button
                  onClick={zoomOut}
                  className="p-2 hover:bg-gray-50 transition-colors text-gray-700 active:bg-gray-100"
                  title="Zoom Out"
                >
                  <Minus className="h-4 w-4" />
                </button>
              </div>

              <button
                onClick={fitToLocation}
                className="p-2 bg-white/90 hover:bg-gray-50 backdrop-blur-sm border border-gray-200 rounded-lg shadow-sm transition-colors text-gray-700 mt-1"
                title="Snap map to original bounds"
              >
                <Maximize className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Text Overlay */}
          <TextOverlay config={config} />

          {/* Border Overlay */}
          {config.format.borderStyle !== 'none' && (
            <div
              className="absolute pointer-events-none z-30"
              style={{
                top: `${config.format.margin}cqw`,
                left: `${config.format.margin}cqw`,
                right: `${config.format.margin}cqw`,
                bottom: `${config.format.margin}cqw`,
                padding: config.format.borderStyle === 'inset' ? '2cqw' : '0',
              }}
            >
              <div
                className="w-full h-full"
                style={{
                  border: `${config.format.borderStyle === 'thick' ? '1.5cqw' : '0.5cqw'} solid ${config.palette.accent || config.palette.text}`,
                  borderRadius: (config.format.maskShape || 'rectangular') === 'circular' ? '50%' : '0',
                }}
              />

              {/* Compass Rose Preview */}
              {(config.format.maskShape || 'rectangular') === 'circular' && config.format.compassRose && (
                <svg
                  className="absolute"
                  style={{
                    pointerEvents: 'none',
                    overflow: 'visible',
                    top: '-4cqw',
                    left: '-4cqw',
                    right: '-4cqw',
                    bottom: '-4cqw',
                    width: 'calc(100% + 8cqw)',
                    height: 'calc(100% + 8cqw)',
                  }}
                  viewBox="0 0 100 100"
                >
                  {/* Compass implementation ... (kept same logic, just cleaner) */}
                  <g
                    stroke={config.palette.accent || config.palette.text}
                    fill={config.palette.accent || config.palette.text}
                    strokeWidth="0.15"
                    opacity="0.8"
                  >
                    {[
                      { angle: 0, label: 'N' },
                      { angle: 45, label: 'NE' },
                      { angle: 90, label: 'E' },
                      { angle: 135, label: 'SE' },
                      { angle: 180, label: 'S' },
                      { angle: 225, label: 'SW' },
                      { angle: 270, label: 'W' },
                      { angle: 315, label: 'NW' },
                    ].map(({ angle, label }) => {
                      const rad = ((angle - 90) * Math.PI) / 180;
                      const centerX = 50;
                      const centerY = 50;
                      const borderOuterRadius = 49.5;
                      const tickLen = label === 'N' || label === 'S' || label === 'E' || label === 'W' ? 1.2 : 0.6;
                      const tickStartRadius = borderOuterRadius;
                      const tickEndRadius = borderOuterRadius + tickLen;
                      const x1 = centerX + Math.cos(rad) * tickStartRadius;
                      const y1 = centerY + Math.sin(rad) * tickStartRadius;
                      const x2 = centerX + Math.cos(rad) * tickEndRadius;
                      const y2 = centerY + Math.sin(rad) * tickEndRadius;
                      const labelRadius = borderOuterRadius + tickLen + 1.0;
                      const labelX = centerX + Math.cos(rad) * labelRadius;
                      const labelY = centerY + Math.sin(rad) * labelRadius;

                      return (
                        <g key={angle}>
                          <line x1={x1} y1={y1} x2={x2} y2={y2} />
                          {/* Simplified Text for cleaner code, relying on original logic if complex props weren't supported, 
                               but here we trust React to render SVG text correctly */}
                          <text
                            x={labelX}
                            y={labelY}
                            fontSize="1.2"
                            fontWeight="bold"
                            textAnchor="middle"
                            dominantBaseline="middle"
                            opacity={['N', 'S', 'E', 'W'].includes(label) ? 1 : 0.7}
                          >
                            {label}
                          </text>
                        </g>
                      );
                    })}
                    {/* Intermediate ticks */}
                    {Array.from({ length: 24 }, (_, i) => {
                      if (i % 3 === 0) return null;
                      const angle = (i * 15 - 90) * (Math.PI / 180);
                      const r1 = 49.5;
                      const r2 = 49.9;
                      return <line key={i} x1={50 + Math.cos(angle) * r1} y1={50 + Math.sin(angle) * r1} x2={50 + Math.cos(angle) * r2} y2={50 + Math.sin(angle) * r2} opacity="0.6" />;
                    })}
                  </g>
                </svg>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Feedback Modal - Only show if indicated AND donation modal is closed */}
      <FeedbackModal
        isOpen={shouldShowFeedback && !showDonationModal}
        onClose={hideFeedback}
        onSubmit={handleFeedbackSubmit}
        isSubmitting={isFeedbackSubmitting}
        onDismiss={dismissFeedback}
      />
    </div>
  );
}


