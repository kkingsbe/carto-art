'use client';

import { useMemo, useCallback, useState, useRef, useEffect } from 'react';
import { usePosterConfig } from '@/hooks/usePosterConfig';
import { useSavedProjects } from '@/hooks/useSavedProjects';
import { useMapExport } from '@/hooks/useMapExport';
import { useProjectManager } from '@/hooks/useProjectManager';
import { useEditorKeyboardShortcuts } from '@/hooks/useEditorKeyboardShortcuts';
import { Maximize, Plus, Minus, X, Map as MapIcon, Type, Layout, Sparkles, Palette, User, Layers } from 'lucide-react';
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
import { SaveButton } from '@/components/controls/SaveButton';
import { ExportButton } from '@/components/controls/ExportButton';

export function PosterEditor() {
  const [activeTab, setActiveTab] = useState<Tab>('location');
  const [isDrawerOpen, setIsDrawerOpen] = useState(true);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const isEcommerceEnabled = useFeatureFlag('ecommerce');

  // Handle responsive drawer state
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsDrawerOpen(false);
      } else {
        setIsDrawerOpen(true);
      }
    };

    // Initial check
    if (window.innerWidth < 768) {
      setIsDrawerOpen(false);
    }

    // Optional: Listen for resize if we want dynamic adjustment
    // window.addEventListener('resize', handleResize);
    // return () => window.removeEventListener('resize', handleResize);
  }, []);

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

      {/* Floating Sidebar Container - Hidden on mobile */}
      <div className="hidden md:flex absolute top-16 left-2 bottom-2 md:top-4 md:left-4 md:bottom-4 z-40 flex-row pointer-events-none max-w-[calc(100vw-1rem)]">
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
        className="absolute inset-0 flex items-center justify-center p-4 pb-32 md:p-12 md:pb-12 overflow-hidden"
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
          <div className="absolute bottom-4 right-4 flex flex-col items-center gap-1 z-10 md:bottom-4 md:right-4">
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
      {
        exportedImage && isEcommerceEnabled && (
          <ProductModal
            isOpen={showProductModal}
            onClose={() => setShowProductModal(false)}
            imageUrl={exportedImage}
          />
        )
      }

      {/* Mobile Tab Bar - Above Action Bar */}
      <div className="fixed bottom-[72px] left-0 right-0 z-40 md:hidden">
        <div className="flex justify-around items-center bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-t border-gray-200/80 dark:border-gray-700 px-1 py-1.5">
          {[
            { id: 'library' as Tab, icon: Sparkles, label: 'Library' },
            { id: 'location' as Tab, icon: MapIcon, label: 'Location' },
            { id: 'style' as Tab, icon: Palette, label: 'Style' },
            { id: 'layers' as Tab, icon: Layers, label: 'Layers' },
            { id: 'text' as Tab, icon: Type, label: 'Text' },
            { id: 'frame' as Tab, icon: Layout, label: 'Frame' },
          ].map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => {
                setActiveTab(id);
                setMobileSheetOpen(true);
              }}
              className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-lg transition-colors ${activeTab === id && mobileSheetOpen
                ? 'bg-blue-600 text-white'
                : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[9px] font-medium mt-0.5">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Mobile Bottom Sheet */}
      {
        mobileSheetOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
              onClick={() => setMobileSheetOpen(false)}
            />
            {/* Sheet */}
            <div className="absolute bottom-0 left-0 right-0 max-h-[75vh] bg-white dark:bg-gray-900 rounded-t-3xl shadow-2xl animate-in slide-in-from-bottom duration-300 overflow-hidden">
              {/* Handle */}
              <div className="flex items-center justify-center py-3 border-b border-gray-200 dark:border-gray-700">
                <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
                <button
                  onClick={() => setMobileSheetOpen(false)}
                  className="absolute right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              {/* Content */}
              <div className="overflow-y-auto max-h-[calc(75vh-48px)] pb-safe">
                <ControlDrawer
                  activeTab={activeTab}
                  isDrawerOpen={true}
                  setIsDrawerOpen={setMobileSheetOpen}
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
          </div>
        )
      }

      {/* Mobile Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-t border-gray-200 dark:border-gray-700 px-4 py-3 safe-area-inset-bottom">
        <div className="flex items-center justify-center gap-3">
          <SaveButton
            onSave={handleSaveClick}
            currentMapName={currentMapName}
            hasUnsavedChanges={currentMapStatus?.hasUnsavedChanges}
            isAuthenticated={isAuthenticated}
            disabled={isExporting}
            className="flex-1 justify-center py-2.5 shadow-none ring-0 h-auto"
          />
          <ExportButton
            onExport={handleExport}
            isExporting={isExporting}
            format={config.format}
            className="flex-1 justify-center py-2.5 shadow-none h-auto"
            showDonationModal={showDonationModal}
            onDonationModalChange={setShowDonationModal}
            onBuyPrint={isEcommerceEnabled ? () => {
              setShowDonationModal(false);
              setShowProductModal(true);
            } : undefined}
            onSave={handleSaveClick}
            isAuthenticated={isAuthenticated}
            currentMapName={currentMapName}
            hasUnsavedChanges={currentMapStatus?.hasUnsavedChanges}
          />
        </div>
      </div>
    </div>
  );
}
