'use client';

import { useMemo, useCallback, useState, useRef, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { usePosterConfig } from '@/hooks/usePosterConfig';
import { useMapExport } from '@/hooks/useMapExport';
import { useMapAnimation } from '@/hooks/useMapAnimation';
import { useEditorKeyboardShortcuts } from '@/hooks/useEditorKeyboardShortcuts';
import { Maximize, Plus, Minus, X, Map as MapIcon, Type, Layout, Sparkles, Palette, Layers, MousePointer2, RotateCw, PanelLeftClose, PanelLeftOpen, Compass, Sliders } from 'lucide-react';
import { toast } from 'sonner';
import { styles } from '@/lib/styles';
import { MapPreview } from '@/components/map/MapPreview';
import { MarkerNameDialog } from '@/components/map/MarkerNameDialog';
import { PosterCanvas } from '@/components/map/PosterCanvas';
import { EditorToolbar } from '@/components/editor/EditorToolbar';
import { applyPaletteToStyle } from '@/lib/styles/applyPalette';
import { throttle } from '@/lib/utils';
import { THROTTLE, MAP } from '@/lib/constants';
import { getNumericRatio } from '@/lib/styles/dimensions';
import { TabNavigation, type Tab } from './TabNavigation';
import { ControlDrawer } from './ControlDrawer';
import { ErrorToastContainer } from '@/components/ui/ErrorToast';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { reverseGeocode } from '@/lib/geocoding/nominatim';
import type MapLibreGL from 'maplibre-gl';
import type { ExportResolution } from '@/lib/export/resolution';
import { ExportButton } from '@/components/controls/ExportButton';
import { CommandMenu } from '@/components/ui/CommandMenu';
import { AdvancedControls } from '@/components/controls/AdvancedControls';

export function PosterEditor() {
  const [activeTab, setActiveTab] = useState<Tab>('essentials');

  const [isDrawerOpen, setIsDrawerOpen] = useState(true);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [isAdvancedControlsOpen, setIsAdvancedControlsOpen] = useState(false);
  const [isCommandMenuOpen, setIsCommandMenuOpen] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();

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

  useEffect(() => {
    console.log('[PosterEditor] Render. Config Style ID:', config?.style?.id);
  });

  const { errors, handleError, clearError } = useErrorHandler();

  const [exportedImage, setExportedImage] = useState<string | null>(null);

  // Marker Dialog State
  const [pendingMarkerLocation, setPendingMarkerLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Keep a reference to the map instance for thumbnail generation
  const mapInstanceRef = useRef<MapLibreGL.Map | null>(null);

  const { isExporting, isExportingRef, exportProgress, exportToPNG, setMapRef, fitToLocation, zoomIn, zoomOut } = useMapExport(config);
  const { isPlaying: isAnimationPlaying, activeAnimation, playAnimation, stopAnimation } = useMapAnimation(mapInstanceRef);

  // Keyboard Shortcuts Hook
  useEditorKeyboardShortcuts({ undo, redo, canUndo, canRedo });

  // Map Interaction Helpers Logic
  const [showHelpers, setShowHelpers] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [isTouch, setIsTouch] = useState(false);
  const interactionTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Check for touch capability
    const checkTouch = () => {
      setIsTouch(window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 768);
    };

    checkTouch();
    window.addEventListener('resize', checkTouch);
    return () => window.removeEventListener('resize', checkTouch);
  }, []);

  const clearInteractionTimer = useCallback(() => {
    if (interactionTimerRef.current) {
      clearTimeout(interactionTimerRef.current);
      interactionTimerRef.current = null;
    }
  }, []);

  const handleMapInteraction = useCallback(() => {
    if (!hasInteracted) {
      setHasInteracted(true);
      setShowHelpers(false);
      clearInteractionTimer();
    }
  }, [hasInteracted, clearInteractionTimer]);

  useEffect(() => {
    // Start timer on mount
    interactionTimerRef.current = setTimeout(() => {
      if (!hasInteracted) {
        setShowHelpers(true);
      }
    }, 7000); // 7 seconds

    return () => clearInteractionTimer();
  }, [hasInteracted, clearInteractionTimer]);

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

  // Randomization Logic
  const handleRandomize = useCallback(async () => {
    // Pick Random Style
    const randomStyle = styles[Math.floor(Math.random() * styles.length)];
    // Pick Random Palette
    const randomPalette = randomStyle.palettes[Math.floor(Math.random() * randomStyle.palettes.length)];

    // Variables to hold generated location data
    let newCenter: [number, number] = [0, 20];
    let newZoom = 2;
    let locationName = 'Random Exploration';
    let locationCity = 'Somewhere on Earth';
    let locationSubtitle = '';

    // Randomize Pitch & Bearing
    const randomPitch = Math.floor(Math.random() * 61);
    const randomBearing = Math.floor(Math.random() * 361) - 180;

    // Randomize Aspect Ratio & Border
    const aspectRatios = ['2:3', '3:4', '4:5', '1:1', 'ISO', '16:9', '16:10', '9:16', '9:19.5'] as const;
    const borderStyles = ['none', 'thin', 'thick', 'double', 'inset'] as const;

    const randomAspectRatio = aspectRatios[Math.floor(Math.random() * aspectRatios.length)];
    const randomBorderStyle = borderStyles[Math.floor(Math.random() * borderStyles.length)];

    try {
      const res = await fetch('/api/random-location');
      if (res.ok) {
        const data = await res.json();

        if (data.center) {
          newCenter = data.center;
          newZoom = data.zoom;

          // Use server-provided location details directly
          if (data.name) locationName = data.name;
          if (data.city) locationCity = data.city;
          if (data.subtitle) locationSubtitle = data.subtitle;
          else if (data.country) locationSubtitle = data.country;
          else locationSubtitle = `${newCenter[1].toFixed(4)}°, ${newCenter[0].toFixed(4)}°`;
        }
      } else {
        throw new Error('API response not ok');
      }
    } catch (e) {
      console.error("Failed to fetch random location", e);
      // Fallback to purely random if API fails
      const randomLng = (Math.random() * 360) - 180;
      const randomLat = (Math.random() * 170) - 85;
      newCenter = [randomLng, randomLat];
      newZoom = Math.random() * (MAP.MAX_ZOOM - MAP.MIN_ZOOM) + MAP.MIN_ZOOM;
      locationSubtitle = `${randomLat.toFixed(4)}°, ${randomLng.toFixed(4)}°`;
    }

    // Apply config with all location data immediately
    const newConfig = {
      ...config,
      location: {
        ...config.location,
        name: locationName,
        city: locationCity,
        subtitle: locationSubtitle,
        center: newCenter,
        zoom: newZoom,
      },
      style: randomStyle,
      palette: randomPalette,
      layers: {
        ...config.layers,
        buildings3DPitch: randomPitch,
        buildings3DBearing: randomBearing,
      },
      format: {
        ...config.format,
        aspectRatio: randomAspectRatio,
        borderStyle: randomBorderStyle,
      }
    };

    setConfig(newConfig);
  }, [config, setConfig]);

  // Wrap exportToPNG to handle errors
  const handleExport = useCallback(async (resolution?: ExportResolution) => {
    try {
      await exportToPNG(resolution);
      setExportedImage('exported');
      toast.success('Export complete!', {
        description: 'Your map poster has been exported successfully.',
      });
    } catch (error) {
      handleError(error);
      toast.error('Export failed', {
        description: error instanceof Error ? error.message : 'An unknown error occurred',
      });
    }
  }, [exportToPNG, handleError]);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      <ErrorToastContainer errors={errors} clearError={clearError} />

      {/* Left Sidebar - Controls */}
      <div className={`${isSidebarVisible ? 'w-80' : 'w-0'} transition-all duration-300 flex-shrink-0 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800`}>
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
          savedProjects={[]}
          deleteProject={async () => {}}
          renameProject={async () => {}}
          currentMapId={null}
          currentMapName={null}
          currentMapStatus={null}
          onLoadProject={() => {}}
          onPublishSuccess={() => {}}
          onAnimationStart={playAnimation}
          onAnimationStop={stopAnimation}
          isAnimationPlaying={isAnimationPlaying}
          activeAnimation={activeAnimation}
          onPublish={() => {}}
          onUnpublish={() => {}}
          onRandomize={handleRandomize}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Toolbar */}
        <EditorToolbar
          onUndo={undo}
          onRedo={redo}
          canUndo={canUndo}
          canRedo={canRedo}
          onReset={() => {}}
          onRandomize={handleRandomize}
          onSave={async () => {}}
          onSaveCopy={async () => {}}
          onExport={handleExport}
          isExporting={isExporting}
          exportProgress={exportProgress}
          currentMapName={null}
          isAuthenticated={false}
          format={config.format}
          currentMapId={null}
          showDonationModal={false}
          onDonationModalChange={() => {}}
          onOpenCommandMenu={() => setIsCommandMenuOpen(true)}
          onStartWalkthrough={() => {}}
          onFormatChange={(format) => updateFormat(format)}
          currentMapStatus={null}
        />

        {/* Map Preview Area */}
        <div className="flex-1 relative">
          <MapPreview
            mapStyle={config.style}
            location={config.location}
            format={config.format}
            rendering={config.rendering}
            layers={config.layers}
            markers={config.markers}
            palette={config.palette}
            onMapLoad={setMapRef}
            onInteraction={handleMapInteraction}
          />
        </div>

        {/* Bottom Canvas Preview - Hidden in this stripped version */}
        {/* <PosterCanvas config={config}><MapPreview ... /></PosterCanvas> */}
      </div>

      {/* Mobile Sheet */}
      {mobileSheetOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileSheetOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-80 bg-white dark:bg-gray-800 shadow-xl overflow-y-auto">
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
              savedProjects={[]}
              deleteProject={async () => {}}
              renameProject={async () => {}}
              currentMapId={null}
              currentMapName={null}
              currentMapStatus={null}
              onLoadProject={() => {}}
              onPublishSuccess={() => {}}
              onAnimationStart={playAnimation}
              onAnimationStop={stopAnimation}
              isAnimationPlaying={isAnimationPlaying}
              activeAnimation={activeAnimation}
              onPublish={() => {}}
              onUnpublish={() => {}}
              onRandomize={handleRandomize}
            />
          </div>
        </div>
      )}

      {/* Marker Name Dialog */}
      {pendingMarkerLocation && (
        <MarkerNameDialog
          isOpen={true}
          initialLat={pendingMarkerLocation.lat}
          initialLng={pendingMarkerLocation.lng}
          onClose={() => setPendingMarkerLocation(null)}
          onConfirm={(name) => {
            // Handle marker naming (simplified - no database)
            console.log('Marker named:', name);
            setPendingMarkerLocation(null);
          }}
        />
      )}

      {/* Advanced Controls Modal */}
      <AdvancedControls
        isOpen={isAdvancedControlsOpen}
        onClose={() => setIsAdvancedControlsOpen(false)}
        config={config}
        updateLayers={updateLayers}
      />

      {/* Command Menu */}
      <CommandMenu
        isOpen={isCommandMenuOpen}
        onOpenChange={setIsCommandMenuOpen}
        onRandomize={handleRandomize}
        onReset={() => {}}
        onExport={handleExport}
        onToggleStudio={() => setIsAdvancedControlsOpen(true)}
        onStartWalkthrough={() => {}}
        config={config}
        updateLocation={updateLocation}
        updateStyle={updateStyle}
        updateLayers={updateLayers}
      />
    </div>
  );
}
