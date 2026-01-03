'use client';

import { useRef, useCallback, useEffect, useState } from 'react';
import Map, { type MapRef } from 'react-map-gl/maplibre';
import { Loader2 } from 'lucide-react';
import type { PosterLocation, LayerToggle, PosterConfig } from '@/types/poster';
import { cn } from '@/lib/utils';
import { MarkerIcon } from './MarkerIcon';
import { MAP, TIMEOUTS, TEXTURE } from '@/lib/constants';
import { logger } from '@/lib/logger';
import 'maplibre-gl/dist/maplibre-gl.css';

interface MapPreviewProps {
  mapStyle: any;
  location: PosterLocation;
  format?: PosterConfig['format'];
  rendering?: PosterConfig['rendering'];
  showMarker?: boolean;
  markerColor?: string;
  onMapLoad?: (map: any) => void;
  onMove?: (center: [number, number], zoom: number) => void;
  onError?: (error: any) => void;
  layers?: PosterConfig['layers'];
  layerToggles?: LayerToggle[];
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
  onError,
  layers,
  layerToggles
}: MapPreviewProps) {
  const mapRef = useRef<MapRef>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Store event handler references and timeout IDs for cleanup
  const loadingHandlerRef = useRef<(() => void) | null>(null);
  const idleHandlerRef = useRef<(() => void) | null>(null);
  const timeoutHandlerRef = useRef<(() => void) | null>(null);
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate effective zoom with overzoom boost for tile detail
  // Overzoom 2 = +1 zoom level (shows tiles that would appear at next zoom level)
  const overzoomBoost = Math.log2(rendering?.overzoom ?? 1);
  const effectiveZoom = location.zoom + overzoomBoost;

  // Local viewState for smooth interaction without triggering full app re-renders on every frame
  const [viewState, setViewState] = useState({
    longitude: location.center[0],
    latitude: location.center[1],
    zoom: effectiveZoom,
    pitch: layers?.buildings3DPitch ?? 0,
    bearing: layers?.buildings3DBearing ?? 0,
  });

  // Sync with external location changes (e.g. search, button clicks)
  useEffect(() => {
    const overzoomBoost = Math.log2(rendering?.overzoom ?? 1);
    setViewState(prev => ({
      ...prev,
      longitude: location.center[0],
      latitude: location.center[1],
      zoom: location.zoom + overzoomBoost,
    }));
  }, [location.center, location.zoom, rendering?.overzoom]);

  // Sync pitch/bearing with 3D buildings layer settings
  useEffect(() => {
    setViewState(prev => ({
      ...prev,
      pitch: layers?.buildings3DPitch ?? 0,
      bearing: layers?.buildings3DBearing ?? 0,
    }));
  }, [layers?.buildings3DPitch, layers?.buildings3DBearing]);


  const handleLoad = useCallback(() => {
    if (mapRef.current && onMapLoad) {
      const map = mapRef.current.getMap();
      onMapLoad(map);

      // Create named handler functions for proper cleanup
      const loadingHandler = () => {
        console.log('[MapPreview] Dataloading event received');
        setIsLoading(true);
      };
      const idleHandler = () => {
        console.log('[MapPreview] Idle event received');
        setIsLoading(false);
        // Clear any pending timeout when map becomes idle
        if (timeoutIdRef.current) {
          clearTimeout(timeoutIdRef.current);
          timeoutIdRef.current = null;
        }
      };

      // Safety timeout: if we're still "loading" after 10 seconds, clear it
      // This prevents being stuck on "Loading Tiles" if some tiles fail silently
      const timeoutHandler = () => {
        // Clear any existing timeout
        if (timeoutIdRef.current) {
          clearTimeout(timeoutIdRef.current);
        }
        // Set new timeout
        timeoutIdRef.current = setTimeout(() => {
          console.warn('[MapPreview] Map loading timed out - forcing idle state');
          setIsLoading(false);
        }, TIMEOUTS.MAP_LOADING);
        // Clear timeout when map becomes idle
        map.once('idle', () => {
          if (timeoutIdRef.current) {
            clearTimeout(timeoutIdRef.current);
            timeoutIdRef.current = null;
          }
        });
      };

      // Store handler references
      loadingHandlerRef.current = loadingHandler;
      idleHandlerRef.current = idleHandler;
      timeoutHandlerRef.current = timeoutHandler;

      // Setup loading listeners
      map.on('dataloading', loadingHandler);
      map.on('idle', idleHandler);
      map.on('dataloading', timeoutHandler);
    }
  }, [onMapLoad]);

  // Cleanup event listeners and timeouts when component unmounts or map changes
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        const map = mapRef.current.getMap();

        // Remove event listeners
        if (loadingHandlerRef.current) {
          map.off('dataloading', loadingHandlerRef.current);
          loadingHandlerRef.current = null;
        }
        if (idleHandlerRef.current) {
          map.off('idle', idleHandlerRef.current);
          idleHandlerRef.current = null;
        }
        if (timeoutHandlerRef.current) {
          map.off('dataloading', timeoutHandlerRef.current);
          timeoutHandlerRef.current = null;
        }

        // Clear any pending timeouts
        if (timeoutIdRef.current) {
          clearTimeout(timeoutIdRef.current);
          timeoutIdRef.current = null;
        }
      }
    };
  }, [mapStyle]); // Re-run cleanup when map style changes (new map instance)

  const handleMove = useCallback((evt: any) => {
    setViewState(evt.viewState);
    if (onMove) {
      onMove([evt.viewState.longitude, evt.viewState.latitude], evt.viewState.zoom);
    }
  }, [onMove]);

  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleError = useCallback((e: any) => {
    logger.error('MapLibre error details:', {
      message: e.error?.message || e.message || 'Unknown map error',
      error: e.error,
      originalEvent: e
    });
    setHasError(true);
    const msg = e.error?.message || e.message || 'Unable to load map data';
    setErrorMessage(msg);
    if (onError) {
      onError(e);
    }
  }, [onError]);

  // Check for edge cases (Antarctica, very remote locations)
  const isEdgeCase = location.center[1] < -60 || Math.abs(location.center[0]) > 170;

  return (
    <div className="relative w-full h-full">
      {hasError || isEdgeCase ? (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 dark:bg-gray-900 z-10">
          <div className="text-center p-8 max-w-md">
            <div className="text-4xl mb-4">🗺️</div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {hasError ? 'Map Loading Error' : 'Limited Map Data'}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {hasError
                ? errorMessage || 'Unable to load map data for this location. Try a different area or zoom level.'
                : 'Map data may be limited for this remote location. Try adjusting the zoom level or selecting a different area.'
              }
            </p>
            <button
              onClick={() => {
                setHasError(false);
                setErrorMessage(null);
                if (mapRef.current) {
                  const map = mapRef.current.getMap();
                  map.resize();
                }
              }}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              Try Again
            </button>
          </div>
        </div>
      ) : null}
      <Map
        ref={mapRef}
        key={`${format?.aspectRatio}-${format?.orientation}`}
        {...viewState}
        style={{ width: '100%', height: '100%' }}
        mapStyle={mapStyle}
        attributionControl={false}
        preserveDrawingBuffer={true}
        onLoad={handleLoad}
        onMove={handleMove}
        onMoveEnd={handleMove}
        onError={handleError}
        antialias={true}
        pixelRatio={MAP.PIXEL_RATIO}
        maxZoom={MAP.MAX_ZOOM}
        minZoom={MAP.MIN_ZOOM}
      >
        {showMarker && (
          <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
            <MarkerIcon
              type={layers?.markerType || 'crosshair'}
              color={markerColor}
              size={40}
            />
          </div>
        )}
      </Map>

      {/* Tile Loading Indicator */}
      <div
        className={cn(
          "absolute top-4 left-4 z-30 transition-opacity duration-300 pointer-events-none",
          isLoading ? "opacity-100" : "opacity-0"
        )}
      >
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm px-2 py-1 rounded-md border border-gray-200 dark:border-gray-700 flex items-center gap-2 shadow-sm">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600" />
          <span className="text-[10px] font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">
            Loading Tiles...
          </span>
        </div>
      </div>

      {/* Zoom Level Indicator */}
      <div className="absolute top-4 right-4 z-30 pointer-events-none">
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm px-2 py-1 rounded-md border border-gray-200 dark:border-gray-700 shadow-sm">
          <span className="text-[10px] font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">
            Zoom: {viewState.zoom.toFixed(1)}
          </span>
        </div>
      </div>

      {/* Texture Overlay */}
      {format?.texture && format.texture !== 'none' && (
        <div
          className="absolute inset-0 pointer-events-none z-20 mix-blend-multiply"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
            opacity: (format.textureIntensity || TEXTURE.DEFAULT_INTENSITY) / 100,
            filter: format.texture === 'canvas' ? 'contrast(120%) brightness(110%)' : 'none'
          }}
        />
      )}
    </div>
  );
}

