'use client';

import { useRef, useCallback, useEffect, useState } from 'react';
import Map, { type MapRef } from 'react-map-gl/maplibre';
import { Loader2 } from 'lucide-react';
import type { PosterLocation, LayerToggle, PosterConfig } from '@/types/poster';
import { cn } from '@/lib/utils';
import 'maplibre-gl/dist/maplibre-gl.css';

interface MapPreviewProps {
  mapStyle: any;
  location: PosterLocation;
  format?: PosterConfig['format'];
  showMarker?: boolean;
  markerColor?: string;
  onMapLoad?: (map: any) => void;
  onMove?: (center: [number, number], zoom: number) => void;
  layers?: PosterConfig['layers'];
  layerToggles?: LayerToggle[];
}

export function MapPreview({ 
  mapStyle, 
  location, 
  format,
  showMarker = true, 
  markerColor = '#ef4444', 
  onMapLoad, 
  onMove 
  , layers, layerToggles
}: MapPreviewProps) {
  const mapRef = useRef<MapRef>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Local viewState for smooth interaction without triggering full app re-renders on every frame
  const [viewState, setViewState] = useState({
    longitude: location.center[0],
    latitude: location.center[1],
    zoom: location.zoom,
  });

  // Sync with external location changes (e.g. search, button clicks)
  useEffect(() => {
    setViewState({
      longitude: location.center[0],
      latitude: location.center[1],
      zoom: location.zoom,
    });
  }, [location.center, location.zoom]);

  const handleLoad = useCallback(() => {
    if (mapRef.current && onMapLoad) {
      const map = mapRef.current.getMap();
      onMapLoad(map);

      // Setup loading listeners
      map.on('dataloading', () => setIsLoading(true));
      map.on('idle', () => setIsLoading(false));
      
      // Safety timeout: if we're still "loading" after 10 seconds, clear it
      // This prevents being stuck on "Loading Tiles" if some tiles fail silently
      map.on('dataloading', () => {
        const timeoutId = setTimeout(() => setIsLoading(false), 10000);
        map.once('idle', () => clearTimeout(timeoutId));
      });
    }
  }, [onMapLoad]);

  const handleMove = useCallback((evt: any) => {
    setViewState(evt.viewState);
    if (onMove) {
      onMove([evt.viewState.longitude, evt.viewState.latitude], evt.viewState.zoom);
    }
  }, [onMove]);

  const handleError = useCallback((e: any) => {
    console.error('MapLibre error details:', {
      message: e.error?.message || e.message || 'Unknown map error',
      error: e.error,
      originalEvent: e
    });
  }, []);

  useEffect(() => {
    if (!mapRef.current || !layers || !layerToggles?.length) return;
    const map = mapRef.current.getMap();
    if (!map) return;

    const applyLayers = () => {
      layerToggles.forEach(toggle => {
        const isVisible = layers[toggle.id as keyof PosterConfig['layers']];
        const labelScale = layers.labelSize || 1;
        const contourDensity = layers.contourDensity || 50;
        
        toggle.layerIds.forEach(layerId => {
          if (!map.getLayer(layerId)) return;
          
          // Apply visibility
          map.setLayoutProperty(layerId, 'visibility', isVisible ? 'visible' : 'none');

          // Apply contour density filter if this is a contour layer
          const layer = map.getLayer(layerId);
          if (toggle.id === 'contours' && isVisible && (layer as any).sourceLayer === 'contour') {
            const ele: any = ['to-number', ['get', 'ele'], 0];
            const density = Number(contourDensity);
            console.log(`Applying contour filter to ${layerId} with density: ${density}`);
            
            if (layerId.includes('index')) {
              map.setFilter(layerId, ['all', ['has', 'ele'], ['==', ['%', ele, density * 5], 0]]);
            } else if (layerId.includes('regular')) {
              map.setFilter(layerId, [
                'all',
                ['has', 'ele'],
                ['==', ['%', ele, density], 0],
                ['!=', ['%', ele, density * 5], 0]
              ]);
            } else {
              map.setFilter(layerId, ['all', ['has', 'ele'], ['==', ['%', ele, density], 0]]);
            }
          }

          // If it's the labels toggle, also apply scale
          if (toggle.id === 'labels' && isVisible) {
            if (layer && layer.type === 'symbol') {
              // We need to get the original text-size to scale it, 
              // but MapLibre doesn't make it easy to get the *unresolved* value easily 
              // from the layer object in a way that we can just multiply it.
              // For now, we'll apply a base size scaled by our factor.
              // A better approach would be to have the style use a variable, 
              // but MapLibre doesn't support that directly in layout properties.
              
              // Standard sizes for our styles: base 16 at zoom 12
              map.setLayoutProperty(layerId, 'text-size', [
                'interpolate',
                ['linear'],
                ['zoom'],
                4, 10 * labelScale,
                12, 16 * labelScale,
                16, 24 * labelScale
              ]);
            }
          }
        });
      });
    };

    if (map.isStyleLoaded()) {
      applyLayers();
    } else {
      map.once('styledata', applyLayers);
    }

    return () => {
      map.off('styledata', applyLayers);
    };
  }, [layers, layerToggles, mapStyle]);

  return (
    <div className="relative w-full h-full">
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
        pixelRatio={2}
        maxZoom={14.9}
        minZoom={1}
      >
      {showMarker && (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
          <div className="relative flex items-center justify-center" aria-hidden>
            <span
              className="absolute w-[1px] h-full"
              style={{
                backgroundColor: markerColor,
                opacity: 0.6,
              }}
            />
            <span
              className="absolute h-[1px] w-full"
              style={{
                backgroundColor: markerColor,
                opacity: 0.6,
              }}
            />
            <span
              className="absolute rounded-full"
              style={{
                width: 44,
                height: 44,
                border: `1px solid ${markerColor}`,
                opacity: 0.35,
              }}
            />
            <span
              className="absolute rounded-full"
              style={{
                width: 22,
                height: 22,
                border: `1px solid ${markerColor}`,
                opacity: 0.55,
              }}
            />
            <span
              className="absolute rounded-full"
              style={{
                width: 10,
                height: 10,
                backgroundColor: markerColor,
              }}
            />
          </div>
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
            opacity: (format.textureIntensity || 20) / 100,
            filter: format.texture === 'canvas' ? 'contrast(120%) brightness(110%)' : 'none'
          }}
        />
      )}
    </div>
  );
}

