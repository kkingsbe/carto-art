'use client';

import { useRef, useCallback, useEffect, useState, useMemo } from 'react';
import Map, { type MapRef, Source, Layer } from 'react-map-gl/maplibre';
import maplibregl from 'maplibre-gl';
import { Loader2 } from 'lucide-react';
import type { PosterLocation, LayerToggle, PosterConfig } from '@/types/poster';
import { cn } from '@/lib/utils';
import { MarkerIcon } from './MarkerIcon';
import { DeckTerrainLayer, TERRAIN_QUALITY_PRESETS } from './DeckTerrainLayer';
import { getAwsTerrariumTileUrl } from '@/lib/styles/tileUrl';
import { MAP, TIMEOUTS, TEXTURE } from '@/lib/constants';
import { logger } from '@/lib/logger';
import { setupMapLibreContour } from '@/lib/map/setup';
import { generateGraticuleGeoJSON } from '@/lib/map/graticules';
import 'maplibre-gl/dist/maplibre-gl.css';

// Initialize contour protocol
// Initialize contour protocol
if (typeof window !== 'undefined') {
  setupMapLibreContour(maplibregl);
}

interface MapPreviewProps {
  mapStyle: any;
  location: PosterLocation;
  format?: PosterConfig['format'];
  rendering?: PosterConfig['rendering'];
  showMarker?: boolean;
  markerColor?: string;
  onMapLoad?: (map: any) => void;
  onMove?: (center: [number, number], zoom: number, pitch: number, bearing: number) => void;
  onMoveEnd?: (center: [number, number], zoom: number, pitch: number, bearing: number) => void;
  onError?: (error: any) => void;
  layers?: PosterConfig['layers'];
  layerToggles?: LayerToggle[];
  onInteraction?: () => void;
  locked?: boolean;
}

export function MapPreview({
  mapStyle,
  location,
  format,
  rendering,
  showMarker = true,
  markerColor,
  onMapLoad,
  onMove,
  onMoveEnd,
  onError,
  layers,
  layerToggles,
  onInteraction,
  locked = false
}: MapPreviewProps) {
  const mapRef = useRef<MapRef>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasRenderedOnce, setHasRenderedOnce] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isWebGLError, setIsWebGLError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isMoving, setIsMoving] = useState(false);

  // Ensure contour protocol is registered
  useEffect(() => {
    setupMapLibreContour(maplibregl);
  }, []);

  // Store event handler references and timeout IDs for cleanup
  const loadingHandlerRef = useRef<(() => void) | null>(null);
  const idleHandlerRef = useRef<(() => void) | null>(null);
  const timeoutHandlerRef = useRef<(() => void) | null>(null);
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate effective zoom with overzoom boost for tile detail
  const overzoomBoost = Math.log2(rendering?.overzoom ?? 1);
  const effectiveZoom = location.zoom + overzoomBoost;

  // Local viewState
  const [viewState, setViewState] = useState({
    longitude: location.center[0],
    latitude: location.center[1],
    zoom: effectiveZoom,
    pitch: layers?.buildings3DPitch ?? 0,
    bearing: layers?.buildings3DBearing ?? 0,
  });

  // Generate graticule data
  const graticuleData = useMemo(() => {
    if (!layers?.graticules) return null;
    return generateGraticuleGeoJSON(layers.graticuleDensity ?? 10);
  }, [layers?.graticules, layers?.graticuleDensity]);

  // Sync with external location changes
  useEffect(() => {
    if (isMoving || locked) return;
    const overzoomBoost = Math.log2(rendering?.overzoom ?? 1);
    setViewState(prev => ({
      ...prev,
      longitude: location.center[0],
      latitude: location.center[1],
      zoom: location.zoom + overzoomBoost,
    }));
  }, [location.center[0], location.center[1], location.zoom, rendering?.overzoom, isMoving, locked]);

  // Sync pitch/bearing
  useEffect(() => {
    if (isMoving || locked) return;
    setViewState(prev => ({
      ...prev,
      pitch: layers?.buildings3DPitch ?? 0,
      bearing: layers?.buildings3DBearing ?? 0,
    }));
  }, [layers?.buildings3DPitch, layers?.buildings3DBearing, isMoving, locked]);

  // Ensure graticule layers render on top to prevent z-fighting
  useEffect(() => {
    if (!mapRef.current || !layers?.graticules) return;

    const map = mapRef.current.getMap();

    // Wait for the map to be fully loaded and graticule layers to exist
    const moveGraticulesToTop = () => {
      if (map.getLayer('graticule-lines') && map.getLayer('graticule-labels')) {
        // Move graticule layers to the top of the layer stack
        try {
          map.moveLayer('graticule-lines');
          map.moveLayer('graticule-labels');
        } catch (e) {
          // Layer might not exist yet, will retry on next render
        }
      }
    };

    // Try immediately
    moveGraticulesToTop();

    // Also try after style changes
    map.once('styledata', moveGraticulesToTop);

    return () => {
      map.off('styledata', moveGraticulesToTop);
    };
  }, [layers?.graticules, mapStyle]);

  const handleError = useCallback((e: any) => {
    // Sanitize error object to avoid circular references and SecurityErrors
    const safeError = {
      message: e.error?.message || e.message || 'Unknown map error',
      status: e.error?.status,
      url: e.error?.url,
      type: e.error?.type || e.type
    };

    logger.error('MapLibre error details:', safeError);
    setHasError(true);

    // Check for WebGL context creation errors
    const isWebGLError =
      safeError.type === 'webglcontextcreationerror' ||
      safeError.message?.toLowerCase().includes('webgl') ||
      safeError.message?.toLowerCase().includes('gl_vendor');

    let msg: string;
    if (isWebGLError) {
      setIsWebGLError(true);
      msg = 'WebGL is not available on your device. This is required for map rendering.';
    } else {
      msg = safeError.message || 'Unable to load map data';
    }

    setErrorMessage(msg);
    if (onError) {
      onError(safeError);
    }
  }, [onError]);

  const handleLoad = useCallback(() => {
    if (mapRef.current && onMapLoad) {
      const map = mapRef.current.getMap();
      onMapLoad(map);

      const loadingHandler = () => {
        setIsLoading(true);
      };
      const idleHandler = () => {
        setIsLoading(false);
        setHasRenderedOnce(true);
        if (timeoutIdRef.current) {
          clearTimeout(timeoutIdRef.current);
          timeoutIdRef.current = null;
        }
      };

      const timeoutHandler = () => {
        if (timeoutIdRef.current) {
          clearTimeout(timeoutIdRef.current);
        }
        timeoutIdRef.current = setTimeout(() => {
          setIsLoading(false);
        }, TIMEOUTS.MAP_LOADING);
        map.once('idle', () => {
          if (timeoutIdRef.current) {
            clearTimeout(timeoutIdRef.current);
            timeoutIdRef.current = null;
          }
        });
      };

      loadingHandlerRef.current = loadingHandler;
      idleHandlerRef.current = idleHandler;
      timeoutHandlerRef.current = timeoutHandler;

      map.on('dataloading', loadingHandler);
      map.on('idle', idleHandler);
      map.on('dataloading', timeoutHandler);
    }
  }, [onMapLoad]);

  useEffect(() => {
    return () => {
      if (mapRef.current) {
        const map = mapRef.current.getMap();
        if (loadingHandlerRef.current) map.off('dataloading', loadingHandlerRef.current);
        if (idleHandlerRef.current) map.off('idle', idleHandlerRef.current);
        if (timeoutHandlerRef.current) map.off('dataloading', timeoutHandlerRef.current);
        if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current);
      }
    };
  }, [mapStyle]);

  const handleMoveStart = useCallback(() => setIsMoving(true), []);

  const handleMove = useCallback((evt: any) => {
    setViewState(evt.viewState);
    if (onMove) {
      onMove(
        [evt.viewState.longitude, evt.viewState.latitude],
        evt.viewState.zoom - overzoomBoost,
        evt.viewState.pitch,
        evt.viewState.bearing
      );
    }
  }, [onMove, overzoomBoost]);

  const handleMoveEnd = useCallback((evt: any) => {
    setIsMoving(false);
    setViewState(evt.viewState);
    if (onMoveEnd) {
      onMoveEnd(
        [evt.viewState.longitude, evt.viewState.latitude],
        evt.viewState.zoom - overzoomBoost,
        evt.viewState.pitch,
        evt.viewState.bearing
      );
    }
  }, [onMoveEnd, overzoomBoost]);

  const getZoomLabel = (zoom: number): string => {
    if (zoom >= 16) return 'Street';
    if (zoom >= 14) return 'Neighborhood';
    if (zoom >= 11) return 'City';
    if (zoom >= 8) return 'Region';
    if (zoom >= 5) return 'Country';
    return 'World';
  };

  const isEdgeCase = location.center[1] < -60 || Math.abs(location.center[0]) > 170;

  return (
    <div id="walkthrough-map" className="relative w-full h-full overflow-hidden">
      {/* Initial Loading Skeleton */}
      {!hasRenderedOnce && !hasError && (
        <div className="absolute inset-0 z-15 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="flex flex-col items-center gap-4 animate-in fade-in duration-700">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-gray-200 dark:border-gray-800 border-t-blue-500 animate-spin" />
              <div className="absolute inset-0 m-1 rounded-full border border-blue-500/20 animate-pulse" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Preparing Map</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Loading tiles...</p>
            </div>
          </div>
        </div>
      )}

      {(hasError || isEdgeCase) && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 dark:bg-gray-900 z-25">
          <div className="text-center p-8 max-w-md">
            <div className="text-4xl mb-4">{isWebGLError ? '⚠️' : '🗺️'}</div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {hasError ? (isWebGLError ? 'WebGL Not Available' : 'Map Loading Error') : 'Limited Map Data'}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {hasError ? errorMessage || 'Unable to load map data.' : 'Map data may be limited.'}
            </p>

            {isWebGLError && (
              <div className="text-left bg-gray-100 dark:bg-gray-800 rounded-lg p-4 mb-4">
                <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Try these steps:</p>
                <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1.5">
                  <li>• Enable hardware acceleration in your browser settings</li>
                  <li>• Update your graphics drivers</li>
                  <li>• Try a different browser (Chrome, Firefox, Edge)</li>
                  <li>• Disable browser extensions that may block WebGL</li>
                </ul>
              </div>
            )}

            <button
              onClick={() => {
                setHasError(false);
                setIsWebGLError(false);
                setErrorMessage(null);
                if (mapRef.current) mapRef.current.getMap().resize();
              }}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      <Map
        ref={mapRef}
        {...(locked ? {} : viewState)}
        style={{ width: '100%', height: '100%' }}
        mapStyle={mapStyle}
        attributionControl={false}
        preserveDrawingBuffer={true}
        onLoad={handleLoad}
        onMoveStart={handleMoveStart}
        onMove={handleMove}
        onMoveEnd={handleMoveEnd}
        onError={handleError}
        onMouseDown={onInteraction}
        onTouchStart={onInteraction}
        onWheel={onInteraction}
        onContextMenu={onInteraction}
        antialias={true}
        pixelRatio={MAP.PIXEL_RATIO}
        maxZoom={MAP.MAX_ZOOM}
        minZoom={MAP.MIN_ZOOM}
        mapLib={maplibregl}
      >

        {showMarker && (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
            <MarkerIcon type={layers?.markerType || 'crosshair'} color={markerColor} size={40} />
          </div>
        )}

        {layers?.graticules && graticuleData && (
          <Source id="graticules" type="geojson" data={graticuleData}>
            <Layer
              id="graticule-lines"
              type="line"
              paint={{
                'line-color': markerColor || '#888',
                'line-width': layers.graticuleWeight ?? 1.0,
                'line-opacity': 0.5
              }}
            />
            <Layer
              id="graticule-labels"
              type="symbol"
              layout={{
                'text-field': ['get', 'text'],
                'text-size': layers.graticuleLabelSize ?? 12,
                'text-anchor': 'bottom',
                'text-offset': [0, -0.5],
                'symbol-placement': 'point'
              }}
              paint={{
                'text-color': markerColor || '#888',
                'text-opacity': 0.8,
                'text-halo-color': 'rgba(255,255,255,0.5)',
                'text-halo-width': 1
              }}
            />
          </Source>
        )}

        {/* Deck.gl Terrain Layer - Disabled for Preview to allow native texture draping
        {layers?.volumetricTerrain && (
          <DeckTerrainLayer
            exaggeration={layers.volumetricTerrainExaggeration ?? 1.5}
            meshMaxError={TERRAIN_QUALITY_PRESETS[(layers.terrainMeshQuality ?? 'balanced') as keyof typeof TERRAIN_QUALITY_PRESETS]}
            elevationData={getAwsTerrariumTileUrl()}
          />
        )}
        */}
      </Map>

      {/* Tile Loading Indicator */}
      <div className={cn(
        "absolute top-4 left-4 z-20 transition-opacity duration-300 pointer-events-none",
        isLoading && hasRenderedOnce ? "opacity-100" : "opacity-0"
      )}>
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 flex items-center gap-2 shadow-sm">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600" />
          <span className="text-[11px] font-medium text-gray-600 dark:text-gray-300 tracking-wide">
            Updating tiles...
          </span>
        </div>
      </div>

      {/* Zoom Level Indicator */}
      <div className="absolute top-4 right-4 z-20 pointer-events-none hidden md:block">
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 shadow-sm">
          <span className="text-[11px] font-medium text-gray-600 dark:text-gray-300 tracking-wide">
            {getZoomLabel(viewState.zoom)} View
          </span>
        </div>
      </div>

      {/* Texture Overlay */}
      {format?.texture && format.texture !== 'none' && (
        <div
          className="absolute inset-0 pointer-events-none z-5 mix-blend-multiply"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
            opacity: (format.textureIntensity || TEXTURE.DEFAULT_INTENSITY) / 100,
            filter: format.texture === 'canvas' ? 'contrast(120%) brightness(110%)' : 'none'
          }}
        />
      )}

      {/* Map Attribution */}
      <div className="absolute bottom-1 right-1 z-20 pointer-events-none">
        <div className="bg-white/40 dark:bg-black/40 backdrop-blur-[2px] px-1.5 py-0.5 rounded-sm flex items-center gap-1">
          <span className="text-[8px] text-gray-600 dark:text-gray-400 font-medium tracking-tight">
            © <a href="https://openfreemap.org" className="hover:underline">OpenFreeMap</a> © <a href="https://www.openstreetmap.org/copyright" className="hover:underline">OpenStreetMap</a>
          </span>
        </div>
      </div>
    </div>
  );
}
