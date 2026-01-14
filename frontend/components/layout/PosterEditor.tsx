'use client';

import { useMemo, useCallback, useState, useRef, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { usePosterConfig } from '@/hooks/usePosterConfig';
import { useSavedProjects } from '@/hooks/useSavedProjects';
import { useUserSubscription } from '@/hooks/useUserSubscription';
import { useUsageLimits } from '@/hooks/useUsageLimits';
import { useMapExport } from '@/hooks/useMapExport';
import { useGifExport, type GifExportOptions } from '@/hooks/useGifExport';
import { useVideoExport, type VideoExportOptions } from '@/hooks/useVideoExport';
import { useMapAnimation } from '@/hooks/useMapAnimation';
import { useProjectManager } from '@/hooks/useProjectManager';
import { useEditorKeyboardShortcuts } from '@/hooks/useEditorKeyboardShortcuts';
import { useAnonExportUsage } from '@/hooks/useAnonExportUsage';
import { Maximize, Plus, Minus, X, Map as MapIcon, Type, Layout, Sparkles, Palette, User, Layers, MousePointer2, RotateCw, PanelLeftClose, PanelLeftOpen, Compass, Sliders, Film } from 'lucide-react';
import { toast } from 'sonner';
import { styles } from '@/lib/styles';
import { MapPreview } from '@/components/map/MapPreview';
import { MarkerNameDialog } from '@/components/map/MarkerNameDialog';
import { PosterCanvas } from '@/components/map/PosterCanvas';
import { EditorToolbar } from '@/components/editor/EditorToolbar';
import { applyPaletteToStyle } from '@/lib/styles/applyPalette';
import { throttle } from '@/lib/utils';
import { THROTTLE, MAP } from '@/lib/constants';
import { trackEventAction } from '@/lib/actions/events';
import { getSessionId } from '@/lib/utils';
import { getNumericRatio } from '@/lib/styles/dimensions';
import { TabNavigation, type Tab } from './TabNavigation';
import { ControlDrawer } from './ControlDrawer';
import { ErrorToastContainer } from '@/components/ui/ErrorToast';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { reverseGeocode } from '@/lib/geocoding/nominatim';
import type MapLibreGL from 'maplibre-gl';
import { FeedbackModal, useFeedback, FeedbackWidget } from '@/components/feedback';
import type { FeedbackFormData } from '@/components/feedback';
import type { ExportResolution } from '@/lib/export/resolution';
import { ProductModal } from '@/components/ecommerce/ProductModal';
import { ExportOptionsModal, type StlExportOptions } from '@/components/controls/ExportOptionsModal';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';
import { SaveButton } from '@/components/controls/SaveButton';
import { ExportButton } from '@/components/controls/ExportButton';
import { CommandMenu } from '@/components/ui/CommandMenu';
import { AdvancedControls } from '@/components/controls/AdvancedControls';
import { Walkthrough } from '@/components/ui/Walkthrough';
import { CreationCelebrationModal } from '@/components/controls/CreationCelebrationModal';
import { SubscriptionSuccessModal } from '@/components/controls/SubscriptionSuccessModal';
import { publishMap, unpublishMap } from '@/lib/actions/maps';
import { PublishModal } from '@/components/profile/PublishModal';
import { LoginWall } from '@/components/auth/LoginWall';
import { LoginWallModal } from '@/components/auth/LoginWallModal';
import { PaywallModal } from '@/components/controls/PaywallModal';
import { getSiteConfig } from '@/lib/actions/usage';
import { CONFIG_KEYS } from '@/lib/actions/usage.types';
import type { Step } from 'react-joyride';

interface PosterEditorProps {
  anonExportLimit: number;
}

export function PosterEditor({ anonExportLimit }: PosterEditorProps) {
  const [activeTab, setActiveTab] = useState<Tab>('essentials');
  const [isDrawerOpen, setIsDrawerOpen] = useState(true);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [isAdvancedControlsOpen, setIsAdvancedControlsOpen] = useState(false);
  const [isCommandMenuOpen, setIsCommandMenuOpen] = useState(false);
  const isEcommerceEnabled = useFeatureFlag('ecommerce');
  const isCopyStateEnabled = useFeatureFlag('copy_editor_state_to_json');
  const { subscriptionTier } = useUserSubscription();
  const { exportUsage, projectUsage, refreshExportUsage } = useUsageLimits(subscriptionTier);
  const isPlusEnabled = useFeatureFlag('carto_plus');
  const searchParams = useSearchParams();
  const router = useRouter();

  // Anonymous export usage tracking
  const anonUsage = useAnonExportUsage();

  // Combine server-side usage (for logged in) with client-side usage (for anon)
  // If authenticated, trust server. If anon, trust client hook.
  const {
    projects,
    saveProject: saveProjectApi, // Renamed to avoid collision with hook result
    deleteProject,
    renameProject,
    isAuthenticated
  } = useSavedProjects();

  const effectiveExportUsage = useMemo(() => {
    if (isAuthenticated) {
      return exportUsage;
    }

    // Construct synthetic export usage for anonymous user
    return {
      allowed: anonUsage.count < anonExportLimit,
      used: anonUsage.count,
      limit: anonExportLimit,
      remaining: Math.max(0, anonExportLimit - anonUsage.count),
      nextAvailableAt: anonUsage.nextAvailableAt
    };
  }, [isAuthenticated, exportUsage, anonUsage, anonExportLimit]);
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



  const { errors, handleError, clearError } = useErrorHandler();

  // Modal coordination
  const [showDonationModal, setShowDonationModal] = useState(false);
  const [showCreationCelebration, setShowCreationCelebration] = useState(false);
  const [showSubscriptionSuccess, setShowSubscriptionSuccess] = useState(false);

  const [exportedImage, setExportedImage] = useState<string | null>(null);
  const [isExportingStl, setIsExportingStl] = useState(false);

  // Publishing State
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showLoginWall, setShowLoginWall] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showProjectLimitModal, setShowProjectLimitModal] = useState(false);
  const [showSoftPaywall, setShowSoftPaywall] = useState(false);
  const [paywallDelay, setPaywallDelay] = useState(60);

  // Marker Dialog State
  const [pendingMarkerLocation, setPendingMarkerLocation] = useState<{ lat: number; lng: number } | null>(null);



  // Keep a reference to the map instance for thumbnail generation
  const mapInstanceRef = useRef<MapLibreGL.Map | null>(null);

  const { isExporting, isExportingRef, exportProgress, exportToPNG, setMapRef, fitToLocation, zoomIn, zoomOut } = useMapExport(config);
  const { isGeneratingGif, isGeneratingGifRef, generateOrbitGif, progress, latestFrame: gifLatestFrame } = useGifExport(mapInstanceRef, config);
  const { isExportingVideo, isExportingVideoRef, exportVideo, progress: videoProgress, latestFrame: videoLatestFrame } = useVideoExport(mapInstanceRef, config);
  const { isPlaying: isAnimationPlaying, activeAnimation, playAnimation, stopAnimation } = useMapAnimation(mapInstanceRef);

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

  // Track editor_open event on mount
  useEffect(() => {
    const sessionId = getSessionId();
    trackEventAction({
      eventType: 'editor_open',
      eventName: 'editor_opened',
      sessionId,
      metadata: {
        hasExistingProject: !!currentMapId,
        source: searchParams?.get('from') || 'direct'
      }
    });
  }, []); // Only on mount

  // Track editor_abandon when leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (currentMapStatus?.hasUnsavedChanges) {
        trackEventAction({
          eventType: 'editor_abandon',
          eventName: 'editor_abandoned',
          sessionId: getSessionId(),
          metadata: {
            hadUnsavedChanges: true,
            mapId: currentMapId,
            mapName: currentMapName
          }
        });
        // Browser may show confirmation dialog
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [currentMapStatus?.hasUnsavedChanges, currentMapId, currentMapName]);

  // Walkthrough State
  const [runTour, setRunTour] = useState(false);
  const [hasCheckedTour, setHasCheckedTour] = useState(false);

  useEffect(() => {
    if (!hasCheckedTour) {
      const hasSeenTour = localStorage.getItem('hasSeenWalkthrough');
      if (!hasSeenTour) {
        setRunTour(true);
      }
      setHasCheckedTour(true);
    }
  }, [hasCheckedTour]);

  const handleTourFinish = useCallback(() => {
    setRunTour(false);
    localStorage.setItem('hasSeenWalkthrough', 'true');
  }, []);

  const handleTourSkip = useCallback(() => {
    setRunTour(false);
    localStorage.setItem('hasSeenWalkthrough', 'true');
  }, []);

  const tourSteps: Step[] = [
    {
      target: 'body',
      placement: 'center',
      title: 'Welcome to Carto Art!',
      content: 'Let\'s take a quick tour to show you how to create stunning map posters in minutes.',
      disableBeacon: true,
    },
    {
      target: '#walkthrough-map',
      title: 'Explore the Map',
      content: 'Use Left Click to pan around and Right Click to rotate or tilt the map. Try exploring 3D buildings by tilting!',
      placement: 'right',
    },
    {
      target: '#walkthrough-sidebar',
      title: 'Customize Your Poster',
      content: 'Here you can change the location, choose from designer styles, adjust colors, and customize the text and frame.',
      placement: 'right',
    },
    {
      target: '#volumetric-terrain-control',
      title: 'Go 3D with Volumetric Terrain',
      content: 'Toggle this to enable true 3D elevation. Adjust the exaggeration to make mountains pop!',
      placement: 'right',
    },
    {
      target: '#terrain-shading-control',
      title: 'Refine with Terrain Shading',
      content: 'Control the strength of shadows and lighting direction to add depth and realism to your map.',
      placement: 'right',
    },
    {
      target: '#walkthrough-randomize',
      title: 'Feeling Lucky?',
      content: 'Click the shuffle icon to instantly generate a completely random theme and location. It\'s a great way to find inspiration!',
      placement: 'left',
    },
    {
      target: '#walkthrough-save',
      title: 'Save Your Progress',
      content: 'Sign in to save your designs and access them later from any device.',
      placement: 'left',
    },
    {
      target: '#walkthrough-export',
      title: 'Ready to Print?',
      content: 'Export your design as a high-resolution PNG image, perfect for professional printing.',
      placement: 'left',
    },
  ];

  // Check for subscription success param
  useEffect(() => {
    if (searchParams?.get('success') === 'true' && searchParams?.get('session_id')) {
      setShowSubscriptionSuccess(true);
      // Clean up URL
      router.replace('/editor');
    }
  }, [searchParams, router]);

  // Fetch soft paywall delay config
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const delay = await getSiteConfig(CONFIG_KEYS.SOFT_PAYWALL_DELAY_SECONDS);
        setPaywallDelay(delay || 60);
      } catch (err) {
        console.error('Failed to fetch soft paywall delay config', err);
      }
    };
    fetchConfig();
  }, []);

  // Soft Paywall Timer
  useEffect(() => {
    // Only show for free tier and only once per session
    if (subscriptionTier !== 'free') return;

    const timer = setTimeout(() => {
      setShowSoftPaywall(true);
    }, paywallDelay * 1000);

    return () => clearTimeout(timer);
  }, [subscriptionTier, paywallDelay]);

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
    trackEventAction({ eventType: 'interaction', eventName: 'randomize_pure', sessionId: getSessionId() });
  }, [config, setConfig]);
  // Wrap exportToPNG to handle errors and track export count
  const handleExport = useCallback(async (resolution?: ExportResolution, gifOptions?: GifExportOptions, videoOptions?: VideoExportOptions, stlOptions?: StlExportOptions) => {
    try {
      if (resolution?.name === 'ORBIT_GIF') {
        await generateOrbitGif(gifOptions);
        setExportCount(prev => prev + 1);
        return;
      }

      if (resolution?.name === 'ORBIT_VIDEO') {
        await exportVideo(videoOptions);
        setExportCount(prev => prev + 1);
        return;
      }

      if (resolution?.name === 'STL_MODEL' && stlOptions) {
        if (!mapInstanceRef.current) {
          throw new Error('Map not ready');
        }
        setIsExportingStl(true);
        try {
          const bounds = mapInstanceRef.current.getBounds().toArray().flat();
          const resolutionMap = { low: 512, medium: 1024, high: 2000 };
          const resolution = resolutionMap[stlOptions.resolution];

          const res = await fetch('/api/export/stl', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              bounds,
              resolution,
              minHeight: stlOptions.modelHeight
            })
          });

          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || 'STL generation failed');
          }

          const blob = await res.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `terrain-${config.location.city || 'model'}.stl`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
          setExportCount(prev => prev + 1);
        } finally {
          setIsExportingStl(false);
        }
        return;
      }

      const blob = await exportToPNG(resolution);
      if (blob) {
        const url = URL.createObjectURL(blob);
        setExportedImage(url);
      }
      // Increment export count on successful export
      // Increment export count on successful export
      setExportCount(prev => prev + 1);

      // If anonymous, track usage locally
      if (!isAuthenticated) {
        anonUsage.increment();
      }
    } catch (error) {
      handleError(error);
    }
  }, [exportToPNG, handleError, generateOrbitGif, exportVideo]);

  // Handle feedback submission
  const handleFeedbackSubmit = useCallback(async (data: FeedbackFormData): Promise<boolean> => {
    return await submitFeedback(data);
  }, [submitFeedback]);

  // Wrapper for SaveButton that passes current config, to maintain simpler API for EditorToolbar
  const handleSaveClick = useCallback(async (name: string) => {
    // Check project limit for free users (only on new projects or if we decide to enforce on updates too, but usually it's creation)
    // Actually, saving an EXISTING project should always be allowed if you own it.
    // The limit is on CREATION (which saveCopy is). 
    // BUT checking logic: if currentMapId is null, it's a new project.
    if (!currentMapId && projectUsage && !projectUsage.allowed && subscriptionTier === 'free') {
      setShowProjectLimitModal(true);
      return;
    }

    await saveProject(name, config);

    // Show celebration modal on first save only
    const hasSeenCelebration = localStorage.getItem('hasSeenCreationCelebration');
    if (!hasSeenCelebration) {
      setShowCreationCelebration(true);
      localStorage.setItem('hasSeenCreationCelebration', 'true');
    }

    trackEventAction({
      eventType: 'map_publish',
      eventName: 'save_project',
      sessionId: getSessionId(),
      metadata: { name, mapId: currentMapId }
    });
  }, [saveProject, config, currentMapId, projectUsage, subscriptionTier]);

  const handleSaveCopy = useCallback(async (name: string) => {
    // Saving a copy ALWAYS creates a new project, so check limit
    if (projectUsage && !projectUsage.allowed && subscriptionTier === 'free') {
      setShowProjectLimitModal(true);
      return;
    }

    await saveCopy(name);
    trackEventAction({ eventType: 'map_publish', eventName: 'save_copy', sessionId: getSessionId(), metadata: { name } });
  }, [saveCopy, projectUsage, subscriptionTier]);

  const handleCopyState = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(config, null, 2));
      trackEventAction({ eventType: 'interaction', eventName: 'copy_state_json', sessionId: getSessionId() });
      // You might want to show a toast here, but relying on button feedback for now or we can add a toast if requested.
      // Ideally we would use the toast system like:
      // toast.success('Editor state copied to clipboard'); 
      // But looking at imports, we have ErrorToastContainer/useErrorHandler.
      // I'll stick to just copying for now as per minimal requirment, 
      // maybe add a console log for dev confirmation.
      console.log('Editor state copied to clipboard');
    } catch (err) {
      console.error('Failed to copy state:', err);
      handleError(err);
    }
  }, [config, handleError]);

  const handlePublishClick = useCallback(() => {
    if (!isAuthenticated) {
      setShowLoginWall(true);
      return;
    }
    if (!currentMapId) {
      toast.error('Please save your map before publishing to the gallery!');
      return;
    }
    setShowPublishModal(true);
  }, [isAuthenticated, currentMapId]);

  const handlePublish = useCallback(async (subtitle?: string) => {
    if (!currentMapId) return;
    try {
      await publishMap(currentMapId, subtitle);
      await refreshStatus();
      toast.success('Map published to gallery!');
    } catch (error) {
      handleError(error);
    }
  }, [currentMapId, refreshStatus, handleError]);

  const handleUnpublish = useCallback(async () => {
    if (!currentMapId) return;
    try {
      await unpublishMap(currentMapId);
      await refreshStatus();
      toast.success('Map unpublished from gallery');
    } catch (error) {
      handleError(error);
    }
  }, [currentMapId, refreshStatus, handleError]);

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
  // Handle adding a marker from the context menu
  const handleAddMarker = useCallback((lat: number, lng: number) => {
    setPendingMarkerLocation({ lat, lng });
  }, []);

  const handleConfirmAddMarker = useCallback((name: string) => {
    if (!pendingMarkerLocation) return;

    const newMarker: any = {
      id: crypto.randomUUID(),
      lat: pendingMarkerLocation.lat,
      lng: pendingMarkerLocation.lng,
      type: 'pin',
      color: '#ef4444',
      size: 30,
      label: name
    };

    setConfig({
      ...config,
      markers: [...(config.markers || []), newMarker]
    });

    setPendingMarkerLocation(null);

    trackEventAction({
      eventType: 'interaction',
      eventName: 'add_marker_context_menu',
      sessionId: getSessionId()
    });
  }, [config, setConfig, pendingMarkerLocation]);

  const handleMapLoad = (map: MapLibreGL.Map) => {
    setMapRef(map);
    mapInstanceRef.current = map;
  };

  // Throttle the map state update to prevent excessive re-renders
  const throttledUpdateMapState = useMemo(
    () => throttle((center: [number, number], zoom: number, pitch: number, bearing: number) => {
      updateLocation({ center, zoom });

      // Update 3D view settings
      updateLayers({
        buildings3DPitch: pitch,
        buildings3DBearing: bearing
      });
    }, THROTTLE.MAP_MOVE),
    [updateLocation, updateLayers]
  );

  const handleMapMove = useCallback((center: [number, number], zoom: number, pitch: number, bearing: number) => {
    // Ignore map movements during export to prevent programmatic zooms from leaking into state
    if (isExportingRef.current || isGeneratingGifRef.current || isExportingVideoRef.current) return;
    throttledUpdateMapState(center, zoom, pitch, bearing);
  }, [throttledUpdateMapState, isExportingRef, isGeneratingGifRef, isExportingVideoRef]);

  const handleMapMoveEnd = useCallback((center: [number, number], zoom: number, pitch: number, bearing: number) => {
    if (isExportingRef.current || isGeneratingGifRef.current || isExportingVideoRef.current) return;

    // Calculate bounds from current viewport to ensure headless exports match live preview
    let bounds: [[number, number], [number, number]] | undefined;
    if (mapInstanceRef.current) {
      const mapBounds = mapInstanceRef.current.getBounds();
      bounds = [
        [mapBounds.getWest(), mapBounds.getSouth()], // SW corner
        [mapBounds.getEast(), mapBounds.getNorth()]  // NE corner
      ];
    }

    updateLocation({ center, zoom, bounds });
    updateLayers({
      buildings3DPitch: pitch,
      buildings3DBearing: bearing
    });
  }, [updateLocation, updateLayers, isExportingRef, isGeneratingGifRef, isExportingVideoRef]);

  return (
    <div className="relative h-full bg-gray-50 dark:bg-gray-950 overflow-hidden selection:bg-blue-500/30">
      <ErrorToastContainer errors={errors} onDismiss={clearError} />

      {pendingMarkerLocation && (
        <MarkerNameDialog
          isOpen={true}
          onClose={() => setPendingMarkerLocation(null)}
          onConfirm={handleConfirmAddMarker}
          initialLat={pendingMarkerLocation.lat}
          initialLng={pendingMarkerLocation.lng}
        />
      )}

      {/* Top Toolbar - Floating */}
      <EditorToolbar
        onUndo={() => {
          undo();
          trackEventAction({ eventType: 'interaction', eventName: 'undo', sessionId: getSessionId() });
        }}
        onRedo={() => {
          redo();
          trackEventAction({ eventType: 'interaction', eventName: 'redo', sessionId: getSessionId() });
        }}
        canUndo={canUndo}
        canRedo={canRedo}
        onRandomize={handleRandomize}
        onReset={() => {
          resetProject();
          trackEventAction({ eventType: 'interaction', eventName: 'reset_project', sessionId: getSessionId() });
        }}
        onSave={handleSaveClick}
        onSaveCopy={handleSaveCopy}
        onExport={handleExport}
        isExporting={isExporting || isGeneratingGif || isExportingVideo || isExportingStl}
        exportProgress={exportProgress}
        gifProgress={isGeneratingGif ? progress : undefined}
        videoProgress={isExportingVideo ? videoProgress : undefined}
        gifLatestFrame={isGeneratingGif ? gifLatestFrame : undefined}
        videoLatestFrame={isExportingVideo ? videoLatestFrame : undefined}
        currentMapName={currentMapName}
        hasUnsavedChanges={currentMapStatus?.hasUnsavedChanges}
        isAuthenticated={isAuthenticated}
        format={config.format}
        currentMapId={currentMapId}
        showDonationModal={showDonationModal}
        onDonationModalChange={setShowDonationModal}
        onOpenCommandMenu={() => setIsCommandMenuOpen(true)}
        onStartWalkthrough={() => setRunTour(true)}
        onBuyPrint={isEcommerceEnabled ? async () => {
          setShowDonationModal(false);

          // Track shop transition start
          trackEventAction({
            eventType: 'shop_transition_start',
            eventName: 'order_print_clicked',
            sessionId: getSessionId(),
            metadata: {
              source: 'export_success_modal',
              mapId: currentMapId
            }
          });

          if (!exportedImage) return;

          // Show loading state implicitly via button or just proceed? 
          // Ideally EditorToolbar handles async onClick. Assuming it doesn't block, we might want a toast.
          const toastId = toast.loading("Preparing your design...");

          try {
            // 1. Get Signed URLs for Direct Upload (prevents server bottleneck)
            const response = await fetch(exportedImage);
            const blob = await response.blob();

            // 2. Request upload credentials (and get path)
            const signRes = await fetch('/api/upload-design', {
              method: 'POST',
            });

            if (!signRes.ok) {
              const errorData = await signRes.json().catch(() => ({}));
              throw new Error(errorData.error || "Failed to initialize upload");
            }

            const { uploadUrl, path } = await signRes.json();

            // 3. Upload directly to Storage
            const uploadRes = await fetch(uploadUrl, {
              method: 'PUT',
              headers: {
                'Content-Type': blob.type || 'image/png',
              },
              body: blob,
            });

            if (!uploadRes.ok) throw new Error("Failed to upload image data");

            // 4. NOW request the read URL (after upload is complete)
            const readRes = await fetch(`/api/upload-design?path=${encodeURIComponent(path)}`);
            if (!readRes.ok) {
              throw new Error("Failed to generate preview link after upload");
            }
            const { readUrl } = await readRes.json();

            if (!readUrl) {
              throw new Error("No URL returned");
            }

            toast.dismiss(toastId);

            // 5. Navigate to order page
            const params = new URLSearchParams({
              image: readUrl,
              aspect: config.format.aspectRatio,
              orientation: config.format.orientation
            });

            // Track successful transition before navigation
            trackEventAction({
              eventType: 'shop_transition_success',
              eventName: 'order_print_success',
              sessionId: getSessionId(),
              metadata: {
                mapId: currentMapId
              }
            });

            router.push(`/store?${params.toString()}`);

          } catch (e) {
            console.error("Order navigation failed", e);

            // Track failure
            trackEventAction({
              eventType: 'shop_transition_error',
              eventName: 'order_print_failed',
              sessionId: getSessionId(),
              metadata: {
                error: e instanceof Error ? e.message : 'Unknown error',
                mapId: currentMapId
              }
            });

            toast.error(e instanceof Error ? e.message : "Failed to prepare order. Please try again.", { id: toastId });
          }
        } : undefined}
        onFormatChange={updateFormat}
        onCopyState={handleCopyState}
        showCopyStateButton={isCopyStateEnabled}
        exportCount={exportCount}
        subscriptionTier={subscriptionTier}
        exportUsage={effectiveExportUsage}
        onExportComplete={refreshStatus}
        exportedImage={exportedImage}
        onPublish={handlePublishClick}
        onUnpublish={handleUnpublish}
        currentMapStatus={currentMapStatus}
      />

      {/* Floating Sidebar Container - Hidden on mobile */}
      <div className={`hidden md:flex absolute top-16 left-2 bottom-2 md:top-4 md:left-4 md:bottom-4 z-40 flex-row pointer-events-none max-w-[calc(100vw-1rem)] transition-transform duration-300 ease-in-out ${!isSidebarVisible ? '-translate-x-[calc(100%+1rem)]' : 'translate-x-0'}`}>
        <div id="walkthrough-sidebar" className="pointer-events-auto flex flex-row h-full shadow-2xl rounded-2xl overflow-hidden bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200 dark:border-gray-700/50">
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
            onPublish={handlePublishClick}
            onUnpublish={handleUnpublish}
            onPublishSuccess={refreshStatus}
            onAnimationStart={playAnimation}
            onAnimationStop={stopAnimation}
            isAnimationPlaying={isAnimationPlaying}
            activeAnimation={activeAnimation}
            onRandomize={handleRandomize}
          />
        </div>

        {/* Sidebar Toggle Button - appears on the right edge of the sidebar */}
        <button
          onClick={() => setIsSidebarVisible(!isSidebarVisible)}
          className="pointer-events-auto self-center ml-2 p-2 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-lg shadow-lg border border-gray-200 dark:border-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          title={isSidebarVisible ? 'Hide control panel' : 'Show control panel'}
        >
          {isSidebarVisible ? (
            <PanelLeftClose className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          ) : (
            <PanelLeftOpen className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          )}
        </button>
      </div>

      {/* Show sidebar button when sidebar is hidden */}
      {!isSidebarVisible && (
        <button
          onClick={() => setIsSidebarVisible(true)}
          className="hidden md:flex absolute top-4 left-4 z-40 p-2 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-lg shadow-lg border border-gray-200 dark:border-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors items-center gap-2"
          title="Show control panel"
        >
          <PanelLeftOpen className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Controls</span>
        </button>
      )}

      {/* Main Content Area - Full Screen with Centered Poster */}
      <main
        className="absolute inset-0 flex items-center justify-center p-4 pb-32 md:p-12 md:pb-12 overflow-hidden"
        style={{ containerType: 'size' }}
      >
        <div className="flex items-center justify-center w-full h-full max-h-[calc(100cqh-4rem)]">
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
              onMoveEnd={handleMapMoveEnd}
              layers={config.layers}
              layerToggles={config.style.layerToggles}
              onInteraction={handleMapInteraction}
              locked={isGeneratingGif || isExportingVideo || isAnimationPlaying}
              is3DMode={config.is3DMode}
              markers={config.markers}
              onAddMarker={handleAddMarker}
              palette={config.palette}
            />

            {/* Map Interaction Helpers Overlay */}
            <div
              className={`absolute left-1/2 -translate-x-1/2 flex items-center gap-3 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md px-3 py-2 md:px-4 md:py-2.5 rounded-full border border-gray-200 dark:border-gray-700 shadow-lg pointer-events-none transition-all duration-500 z-20 ${showHelpers ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
                } ${isTouch ? 'top-4' : 'top-8'}`}
            >
              <div className="flex items-center gap-2 text-[10px] md:text-xs font-medium text-gray-600 dark:text-gray-300 whitespace-nowrap">
                <MousePointer2 className="w-3.5 h-3.5 md:w-4 md:h-4 text-blue-500" />
                <span>{isTouch ? 'Drag to Pan' : 'Left Click to Pan'}</span>
              </div>
              <div className="w-px h-3 md:h-4 bg-gray-300 dark:bg-gray-600" />
              <div className="flex items-center gap-2 text-[10px] md:text-xs font-medium text-gray-600 dark:text-gray-300 whitespace-nowrap">
                <RotateCw className="w-3.5 h-3.5 md:w-4 md:h-4 text-blue-500" />
                <span>{isTouch ? 'Two Fingers to Rotate' : 'Right Click to Rotate'}</span>
              </div>
            </div>

            {/* Floating Map Controls - Inside the paper */}
            <div className="absolute bottom-4 right-4 flex flex-col items-center gap-1 z-20 md:bottom-4 md:right-4">
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

            {/* Feedback Widget - Independent */}
            <div className="hidden md:block absolute bottom-32 right-0 z-10 pointer-events-auto">
              <FeedbackWidget />
            </div>

          </PosterCanvas>
        </div>

        <Walkthrough
          steps={tourSteps}
          run={runTour}
          onFinish={handleTourFinish}
          onSkip={handleTourSkip}
        />
      </main>

      <FeedbackModal
        isOpen={shouldShowFeedback && !showDonationModal && !showCreationCelebration}
        onClose={hideFeedback}
        onSubmit={handleFeedbackSubmit}
        isSubmitting={isFeedbackSubmitting}
        onDismiss={dismissFeedback}
      />

      {/* Creation Celebration Modal - First save only */}
      <CreationCelebrationModal
        isOpen={showCreationCelebration}
        onClose={() => setShowCreationCelebration(false)}
      />

      {isPlusEnabled && (
        <SubscriptionSuccessModal
          isOpen={showSubscriptionSuccess}
          onClose={() => setShowSubscriptionSuccess(false)}
        />
      )}

      <LoginWallModal
        isOpen={showLoginModal || showLoginWall}
        onClose={() => {
          setShowLoginModal(false);
          setShowLoginWall(false);
        }}
        title={showLoginWall ? "Sign in to Publish" : "Sign in to Order Print"}
        description={showLoginWall
          ? "Create a free account to publish your maps to the community gallery and share them with the world."
          : "Create a free account to order high-quality framed prints of your custom maps. Your design will be saved."
        }
      />

      {showPublishModal && currentMapId && currentMapName && (
        <PublishModal
          isOpen={showPublishModal}
          onClose={() => setShowPublishModal(false)}
          mapTitle={currentMapName}
          onPublish={handlePublish}
        />
      )}

      {/* Mobile Tab Bar - Above Action Bar */}
      <div className="fixed left-0 right-0 z-40 md:hidden" style={{ bottom: 'calc(72px + env(safe-area-inset-bottom, 0px))' }}>
        <div className="flex justify-around items-center bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-t border-gray-200/80 dark:border-gray-700 px-1 py-1.5">
          {[
            { id: 'essentials' as Tab, icon: Compass, label: 'Start' },
            { id: 'customize' as Tab, icon: Sliders, label: 'Edit' },
            { id: 'annotate' as Tab, icon: Type, label: 'Text' },
            { id: 'frame' as Tab, icon: Layout, label: 'Frame' },
            { id: 'animate' as Tab, icon: Film, label: 'Animate' },
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
          <div className="fixed inset-0 z-45 md:hidden">
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
                  onPublish={handlePublishClick}
                  onUnpublish={handleUnpublish}
                  onPublishSuccess={refreshStatus}
                  onAnimationStart={playAnimation}
                  onAnimationStop={stopAnimation}
                  isAnimationPlaying={isAnimationPlaying}
                  activeAnimation={activeAnimation}
                  onRandomize={handleRandomize}
                />
              </div>
            </div>
          </div>
        )
      }

      {/* Mobile Bottom Action Bar */}


      <CommandMenu
        onRandomize={handleRandomize}
        onReset={() => {
          resetProject();
          trackEventAction({ eventType: 'interaction', eventName: 'reset_project' });
        }}
        onExport={() => handleExport()}
        onToggleStudio={() => setIsAdvancedControlsOpen(prev => !prev)}
        onStartWalkthrough={() => setRunTour(true)}
        config={config}
        updateLocation={updateLocation}
        updateStyle={updateStyle}
        updateLayers={updateLayers}
        isOpen={isCommandMenuOpen}
        onOpenChange={setIsCommandMenuOpen}
      />

      <AdvancedControls
        config={config}
        updateLayers={updateLayers}
        isOpen={isAdvancedControlsOpen}
        onClose={() => setIsAdvancedControlsOpen(false)}
      />
      {projectUsage && (
        <PaywallModal
          isOpen={showProjectLimitModal}
          onClose={() => setShowProjectLimitModal(false)}
          variant="project_limit"
          usage={projectUsage}
        />
      )}

      <PaywallModal
        isOpen={showSoftPaywall}
        onClose={() => setShowSoftPaywall(false)}
        variant="soft"
      />
    </div>
  );
}
