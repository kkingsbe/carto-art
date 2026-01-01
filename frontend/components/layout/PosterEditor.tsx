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
import { generateThumbnail } from '@/lib/export/thumbnail';
import { DEFAULT_CONFIG } from '@/lib/config/defaults';

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

  const { isExporting, exportToPNG, setMapRef, fitToLocation, zoomIn, zoomOut } = useMapExport(config);

  // Keep a reference to the map instance for thumbnail generation
  const mapInstanceRef = useRef<MapLibreGL.Map | null>(null);
  
  // Wrap exportToPNG to handle errors
  const handleExport = useCallback(async () => {
    try {
      await exportToPNG();
    } catch (error) {
      handleError(error);
    }
  }, [exportToPNG, handleError]);

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

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      <ErrorToastContainer errors={errors} onDismiss={clearError} />
      {/* Mobile Header */}
      <div className="md:hidden h-14 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 z-40 shadow-sm">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-lg" />
          <span className="font-bold text-gray-900 dark:text-white">CartoArt</span>
        </Link>
        <div className="flex items-center gap-2">
          <SaveButton
            onSave={handleSaveClick}
            currentMapName={currentMapName}
            hasUnsavedChanges={currentMapStatus?.hasUnsavedChanges}
            isAuthenticated={isAuthenticated}
            disabled={isExporting}
          />
          <button
            onClick={handleReset}
            className="p-2 rounded-md transition-colors text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700"
            title={currentMapId ? "Exit saved map and start new" : "Reset to default"}
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <ExportButton onExport={handleExport} isExporting={isExporting} />
        </div>
      </div>

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

      {/* Main Content */}
      <main 
        className="flex-1 relative bg-gray-100 dark:bg-gray-950 flex flex-col overflow-hidden pb-16 md:pb-0"
        style={{ containerType: 'size' }}
      >
        {/* Top Actions Overlay - Desktop Only */}
        <div className="absolute top-6 right-8 z-50 pointer-events-auto hidden md:flex items-center gap-2">
          <div className="flex items-center gap-1 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-1">
            <button
              onClick={undo}
              disabled={!canUndo}
              className={cn(
                "p-2 rounded-md transition-colors",
                canUndo
                  ? "text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700"
                  : "text-gray-300 dark:text-gray-600 cursor-not-allowed"
              )}
              title="Undo (Ctrl+Z)"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              onClick={redo}
              disabled={!canRedo}
              className={cn(
                "p-2 rounded-md transition-colors",
                canRedo
                  ? "text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700"
                  : "text-gray-300 dark:text-gray-600 cursor-not-allowed"
              )}
              title="Redo (Ctrl+Shift+Z)"
            >
              <Redo2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleReset}
              className="p-2 rounded-md transition-colors text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700"
              title={currentMapId ? "Exit saved map and start new" : "Reset to default"}
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
          <SaveButton
            onSave={handleSaveClick}
            currentMapName={currentMapName}
            hasUnsavedChanges={currentMapStatus?.hasUnsavedChanges}
            isAuthenticated={isAuthenticated}
            disabled={isExporting}
          />
          <ExportButton onExport={handleExport} isExporting={isExporting} />
        </div>

        {/* Map Canvas */}
        <div className="flex-1 relative flex items-center justify-center p-4 md:p-8">
          <div 
            className="relative shadow-2xl bg-white flex flex-col transition-all duration-300 ease-in-out ring-1 ring-black/5"
            style={{ 
              aspectRatio: getAspectRatioCSS(config.format.aspectRatio, config.format.orientation),
              backgroundColor: config.palette.background,
              width: `min(calc(100% - 2rem), calc((100cqh - 2rem) * ${numericRatio}))`,
              height: 'auto',
              maxHeight: 'calc(100cqh - 2rem)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              containerType: 'size',
            }}
          >
            {/* The Map Window */}
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
                showMarker={config.layers.marker}
                markerColor={config.layers.markerColor || config.palette.primary || config.palette.accent || config.palette.text}
                onMapLoad={handleMapLoad}
                onMove={handleMapMove}
                layers={config.layers}
                layerToggles={config.style.layerToggles}
              />
              
              {/* Floating Map Controls */}
              <div className="absolute bottom-4 right-4 flex flex-row gap-2 z-10">
                <button
                  onClick={zoomOut}
                  className="p-2 bg-white/90 hover:bg-white border border-gray-200 rounded-md shadow-sm transition-colors text-gray-600 hover:text-blue-600 pointer-events-auto"
                  title="Zoom Out"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <button
                  onClick={zoomIn}
                  className="p-2 bg-white/90 hover:bg-white border border-gray-200 rounded-md shadow-sm transition-colors text-gray-600 hover:text-blue-600 pointer-events-auto"
                  title="Zoom In"
                >
                  <Plus className="h-4 w-4" />
                </button>
                <button
                  onClick={fitToLocation}
                  className="p-2 bg-white/90 hover:bg-white border border-gray-200 rounded-md shadow-sm transition-colors text-gray-600 hover:text-blue-600 pointer-events-auto"
                  title="Snap map to original bounds"
                >
                  <Maximize className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            {/* Text Overlay */}
            <TextOverlay config={config} />

            {/* Border Overlay - Now drawn AFTER TextOverlay to stay on top of gradients */}
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
                    border: `${
                      config.format.borderStyle === 'thick' ? '1.5cqw' : '0.5cqw'
                    } solid ${config.palette.accent || config.palette.text}`,
                    borderRadius: (config.format.maskShape || 'rectangular') === 'circular' ? '50%' : '0',
                  }}
                />
                
                {/* Compass Rose Preview (SVG) */}
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
                    <g
                      stroke={config.palette.accent || config.palette.text}
                      fill={config.palette.accent || config.palette.text}
                      strokeWidth="0.15"
                      opacity="0.8"
                    >
                      {/* Draw 8 main directions */}
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
                        // Border is at the edge of the original 100x100 viewBox
                        // Position ticks starting at the border edge
                        const borderOuterRadius = 49.5; // Outer edge of border in 100x100 coordinate system
                        const tickLen = label === 'N' || label === 'S' || label === 'E' || label === 'W' ? 1.2 : 0.6;
                        // Ticks start at the border edge and extend outward
                        const tickStartRadius = borderOuterRadius;
                        const tickEndRadius = borderOuterRadius + tickLen;
                        
                        const x1 = centerX + Math.cos(rad) * tickStartRadius;
                        const y1 = centerY + Math.sin(rad) * tickStartRadius;
                        const x2 = centerX + Math.cos(rad) * tickEndRadius;
                        const y2 = centerY + Math.sin(rad) * tickEndRadius;
                        
                        // Position labels further out from the border
                        const labelRadius = borderOuterRadius + tickLen + 1.0;
                        const labelX = centerX + Math.cos(rad) * labelRadius;
                        const labelY = centerY + Math.sin(rad) * labelRadius;
                        
                        return (
                          <g key={angle}>
                            <line x1={x1} y1={y1} x2={x2} y2={y2} />
                            <text
                              x={labelX}
                              y={labelY}
                              fontSize="1.2"
                              fontWeight="bold"
                              textAnchor="middle"
                              dominantBaseline="middle"
                              opacity={label === 'N' || label === 'S' || label === 'E' || label === 'W' ? 1 : 0.7}
                            >
                              {label}
                            </text>
                          </g>
                        );
                      })}
                      
                      {/* Draw intermediate ticks */}
                      {Array.from({ length: 24 }, (_, i) => {
                        if (i % 3 === 0) return null; // Skip positions where we have main directions
                        const angle = (i * 15 - 90) * (Math.PI / 180);
                        const centerX = 50;
                        const centerY = 50;
                        const borderOuterRadius = 49.5;
                        const tickLen = 0.4;
                        // Ticks start at the border edge and extend outward
                        const tickStartRadius = borderOuterRadius;
                        const tickEndRadius = borderOuterRadius + tickLen;
                        
                        const x1 = centerX + Math.cos(angle) * tickStartRadius;
                        const y1 = centerY + Math.sin(angle) * tickStartRadius;
                        const x2 = centerX + Math.cos(angle) * tickEndRadius;
                        const y2 = centerY + Math.sin(angle) * tickEndRadius;
                        
                        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} opacity="0.6" />;
                      })}
                    </g>
                  </svg>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}


