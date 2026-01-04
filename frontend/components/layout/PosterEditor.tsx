'use client';

import { useMemo, useCallback, useState, useRef } from 'react';
import { usePosterConfig } from '@/hooks/usePosterConfig';
import { useSavedProjects } from '@/hooks/useSavedProjects';
import { useMapExport } from '@/hooks/useMapExport';
import { useProjectManager } from '@/hooks/useProjectManager';
import { useEditorKeyboardShortcuts } from '@/hooks/useEditorKeyboardShortcuts';
import { Maximize, Plus, Minus } from 'lucide-react';
import { MapPreview } from '@/components/map/MapPreview';
import { PosterCanvas } from '@/components/map/PosterCanvas';
import { EditorToolbar } from '@/components/editor/EditorToolbar';
import { applyPaletteToStyle } from '@/lib/styles/applyPalette';
import { throttle } from '@/lib/utils';
import { THROTTLE } from '@/lib/constants';
import { trackEventAction } from '@/lib/actions/events';
import { getNumericRatio } from '@/lib/styles/dimensions';
import { TabNavigation, type Tab } from './TabNavigation';
import { ControlDrawer } from './ControlDrawer';
import { ErrorToastContainer } from '@/components/ui/ErrorToast';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import type MapLibreGL from 'maplibre-gl';
import { FeedbackModal, useFeedback } from '@/components/feedback';
import type { FeedbackFormData } from '@/components/feedback';
import type { ExportResolution } from '@/lib/export/resolution';
import { ProductModal } from '@/components/ecommerce/ProductModal';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';

export function PosterEditor() {
  const [activeTab, setActiveTab] = useState<Tab>('location');
  const [isDrawerOpen, setIsDrawerOpen] = useState(true);
  const isEcommerceEnabled = useFeatureFlag('ecommerce');

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
    saveProject: saveProjectApi, // Renamed to avoid collision with hook result
    deleteProject,
    renameProject,
    isAuthenticated
  } = useSavedProjects();

  const { errors, handleError, clearError } = useErrorHandler();

  // Modal coordination
  const [showDonationModal, setShowDonationModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [exportedImage, setExportedImage] = useState<string | null>(null);

  const { isExporting, isExportingRef, exportToPNG, setMapRef, fitToLocation, zoomIn, zoomOut } = useMapExport(config);

  // Keep a reference to the map instance for thumbnail generation
  const mapInstanceRef = useRef<MapLibreGL.Map | null>(null);

  // Project Manager Hook
  const {
    currentMapId,
    currentMapName,
    currentMapStatus,
    loadProject,
    saveProject,
    saveCopy,
    resetProject,
    refreshStatus
  } = useProjectManager({
    config,
    setConfig,
    isAuthenticated,
    saveProjectApi,
    handleError,
    mapInstanceRef
  });

  // Keyboard Shortcuts Hook
  useEditorKeyboardShortcuts({ undo, redo, canUndo, canRedo });

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
      const blob = await exportToPNG(resolution);
      if (blob) {
        const url = URL.createObjectURL(blob);
        setExportedImage(url);
      }
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

  // Wrapper for SaveButton that passes current config, to maintain simpler API for EditorToolbar
  const handleSaveClick = useCallback(async (name: string) => {
    await saveProject(name, config);
    trackEventAction({
      eventType: 'map_publish',
      eventName: 'save_project',
      metadata: { name, mapId: currentMapId }
    });
  }, [saveProject, config, currentMapId]);

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
    // Ignore map movements during export to prevent programmatic zooms from leaking into state
    if (isExportingRef.current) return;
    throttledUpdateLocation(center, zoom);
  }, [throttledUpdateLocation, isExportingRef]);

  return (
    <div className="relative h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden selection:bg-blue-500/30">
      <ErrorToastContainer errors={errors} onDismiss={clearError} />

      {/* Top Toolbar - Floating */}
      <EditorToolbar
        onUndo={() => {
          undo();
          trackEventAction({ eventType: 'interaction', eventName: 'undo' });
        }}
        onRedo={() => {
          redo();
          trackEventAction({ eventType: 'interaction', eventName: 'redo' });
        }}
        canUndo={canUndo}
        canRedo={canRedo}
        onReset={() => {
          resetProject();
          trackEventAction({ eventType: 'interaction', eventName: 'reset_project' });
        }}
        onSave={handleSaveClick}
        onSaveCopy={async (name) => {
          await saveCopy(name);
          trackEventAction({ eventType: 'map_publish', eventName: 'save_copy', metadata: { name } });
        }}
        onExport={handleExport}
        isExporting={isExporting}
        currentMapName={currentMapName}
        hasUnsavedChanges={currentMapStatus?.hasUnsavedChanges}
        isAuthenticated={isAuthenticated}
        format={config.format}
        currentMapId={currentMapId}
        showDonationModal={showDonationModal}
        onDonationModalChange={setShowDonationModal}
        onBuyPrint={isEcommerceEnabled ? () => {
          setShowDonationModal(false);
          setShowProductModal(true);
        } : undefined}
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
            onLoadProject={loadProject}
            onPublishSuccess={refreshStatus}
          />
        </div>
      </div>

      {/* Main Content Area - Full Screen with Centered Poster */}
      <main
        className="absolute inset-0 flex items-center justify-center p-4 md:p-12 overflow-hidden"
        style={{ containerType: 'size' }}
      >
        <PosterCanvas
          config={config}
          style={{
            width: `min(calc(100% - 4rem), calc((100cqh - 4rem) * ${numericRatio}))`,
            height: 'auto',
            maxHeight: 'calc(100cqh - 4rem)',
            boxShadow: '0 50px 100px -20px rgba(0, 0, 0, 0.25), 0 30px 60px -30px rgba(0, 0, 0, 0.3)',
          }}
          className="transition-all duration-500 ease-out"
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
        </PosterCanvas>
      </main>

      {/* Feedback Modal - Only show if indicated AND donation modal is closed */}
      <FeedbackModal
        isOpen={shouldShowFeedback && !showDonationModal && !showProductModal}
        onClose={hideFeedback}
        onSubmit={handleFeedbackSubmit}
        isSubmitting={isFeedbackSubmitting}
        onDismiss={dismissFeedback}
      />

      {/* Product Modal */}
      {exportedImage && isEcommerceEnabled && (
        <ProductModal
          isOpen={showProductModal}
          onClose={() => setShowProductModal(false)}
          imageUrl={exportedImage}
        />
      )}
    </div>
  );
}


