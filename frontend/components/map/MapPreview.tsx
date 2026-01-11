'use client';

import { useRef, useCallback, useEffect, useState, useMemo } from 'react';
import Map, { type MapRef, Source, Layer, Marker } from 'react-map-gl/maplibre';
import maplibregl from 'maplibre-gl';
import { Loader2 } from 'lucide-react';
import type { PosterLocation, LayerToggle, PosterConfig, CustomMarker, ColorPalette } from '@/types/poster';
import { hexToRgb, isColorDark } from '@/lib/utils/color';
import { cn } from '@/lib/utils';
import { MarkerIcon } from './MarkerIcon';
import { MapContextMenu } from './MapContextMenu';
import { CustomScaleControl } from './CustomScaleControl';
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
  thumbnailUrl?: string | null;
  is3DMode?: boolean;
  markers?: CustomMarker[];
  onAddMarker?: (lat: number, lng: number) => void;
  palette?: ColorPalette;
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
  locked = false,
  thumbnailUrl,
  is3DMode = false,
  markers,
  onAddMarker,
  palette
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
  const loadingHandlerRef = useRef<((e?: any) => void) | null>(null);
  const idleHandlerRef = useRef<((e?: any) => void) | null>(null);
  const timeoutHandlerRef = useRef<((e?: any) => void) | null>(null);
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

  // Calculate distances for labels
  const distanceLabelData = useMemo(() => {
    if (!layers?.showSegmentLengths || !markers || markers.length < 2) return null;

    const features = [];
    for (let i = 0; i < markers.length - 1; i++) {
      const start = markers[i];
      const end = markers[i + 1];

      // Simple Haversine distance
      const R = 6371; // km
      const dLatAndRad = (end.lat - start.lat) * Math.PI / 180;
      const dLonAndRad = (end.lng - start.lng) * Math.PI / 180;
      const lat1 = start.lat * Math.PI / 180;
      const lat2 = end.lat * Math.PI / 180;

      const a = Math.sin(dLatAndRad / 2) * Math.sin(dLatAndRad / 2) +
        Math.sin(dLonAndRad / 2) * Math.sin(dLonAndRad / 2) * Math.cos(lat1) * Math.cos(lat2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const d = R * c;

      // Calculate initial bearing
      const y = Math.sin(dLonAndRad) * Math.cos(lat2);
      const x = Math.cos(lat1) * Math.sin(lat2) -
        Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLonAndRad);
      const bearing = Math.atan2(y, x) * 180 / Math.PI;

      // Midpoint
      const midLat = (start.lat + end.lat) / 2;
      const midLng = (start.lng + end.lng) / 2;

      // Format distance: use meters if < 1km
      const distanceText = d < 1
        ? `${Math.round(d * 1000)} m`
        : d < 10
          ? `${d.toFixed(1)} km`
          : `${Math.round(d)} km`;

      features.push({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [midLng, midLat] },
        properties: {
          distance: distanceText,
          bearing: bearing
        }
      });
    }

    return {
      type: 'FeatureCollection',
      features
    };
  }, [markers, layers?.showSegmentLengths]);

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

  // ... (previous code)

  // Sync pitch/bearing
  useEffect(() => {
    if (isMoving || locked) return;

    // In 3D mode, force isometric-like view
    if (is3DMode) {
      setViewState(prev => ({
        ...prev,
        pitch: 60,
        bearing: 45,
      }));
    } else {
      setViewState(prev => ({
        ...prev,
        pitch: layers?.buildings3DPitch ?? 0,
        bearing: layers?.buildings3DBearing ?? 0,
      }));
    }
  }, [layers?.buildings3DPitch, layers?.buildings3DBearing, isMoving, locked, is3DMode]);

  // Handle layer visibility toggles
  useEffect(() => {
    if (!mapRef.current || !layers || !layerToggles) return;
    const map = mapRef.current.getMap();

    // Map specific boolean flags from 'layers' config to layerToggle IDs
    // The keys in layers (e.g. 'streets', 'population') often match layerToggle.id
    // We iterate through all defined toggles to set their state
    layerToggles.forEach(toggle => {
      const isVisible = layers[toggle.id as keyof typeof layers];

      // If the config explicitly defines this toggle state (boolean), apply it
      if (typeof isVisible === 'boolean') {
        toggle.layerIds.forEach(layerId => {
          if (map.getLayer(layerId)) {
            map.setLayoutProperty(
              layerId,
              'visibility',
              isVisible ? 'visible' : 'none'
            );
          }
        });
      }
    });
  }, [layers, layerToggles, mapStyle]); // Re-run when config or style changes

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
    if (mapRef.current) {
      const map = mapRef.current.getMap();
      if (onMapLoad) {
        onMapLoad(map);
      }

      const loadingHandler = (e: any) => {
        // Ignore local GeoJSON sources to prevent flicker and render loops
        if (e.sourceId?.startsWith('marker-') || e.sourceId === 'graticules') {
          return;
        }
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

  // Context Menu Handling
  const [contextMenuInfo, setContextMenuInfo] = useState<{
    x: number;
    y: number;
    lat: number;
    lng: number;
  } | null>(null);

  const handleContextMenu = useCallback((evt: any) => {
    if (onInteraction) onInteraction();

    // Only allow context menu if onAddMarker is provided and we are not moving/rotating
    if (!onAddMarker || isMoving) return;

    evt.originalEvent.preventDefault();

    setContextMenuInfo({
      x: evt.originalEvent.clientX,
      y: evt.originalEvent.clientY,
      lat: evt.lngLat.lat,
      lng: evt.lngLat.lng,
    });
  }, [onAddMarker, onInteraction, isMoving]);

  const closeContextMenu = useCallback(() => setContextMenuInfo(null), []);



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
          {/* Show thumbnail fallback for WebGL errors when available */}
          {isWebGLError && thumbnailUrl ? (
            <img
              src={thumbnailUrl}
              alt="Map preview"
              className="w-full h-full object-cover"
            />
          ) : (
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
          )}
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
        onContextMenu={handleContextMenu}
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


        {/* Render Custom Markers Path and Fill */}
        {((layers?.connectMarkers) || (layers?.fillMarkers)) && markers && markers.length > 1 && (
          <>
            <Source
              id="marker-path"
              type="geojson"
              data={{
                type: 'Feature',
                properties: {},
                geometry: layers?.fillMarkers ? {
                  type: 'Polygon',
                  coordinates: [[
                    ...markers.map(m => [m.lng, m.lat]),
                    [markers[0].lng, markers[0].lat]
                  ]]
                } : {
                  type: 'LineString',
                  coordinates: markers.map(m => [m.lng, m.lat])
                }
              }}
            >
              {/* Fill Layer */}
              {layers?.fillMarkers && (
                <Layer
                  id="marker-fill-layer"
                  type="fill"
                  paint={{
                    'fill-color': layers.markerFillColor || layers.markerPathColor || markerColor || '#000',
                    'fill-opacity': 0.2
                  }}
                />
              )}

              {/* Line Layer - Only if connect is enabled */}
              {layers?.connectMarkers && (
                <Layer
                  id="marker-path-layer"
                  type="line"
                  paint={{
                    'line-color': layers.markerPathColor || markerColor || '#000',
                    'line-width': layers.markerPathWidth ?? 2,
                    'line-dasharray': layers.markerPathStyle === 'dashed' ? [2, 2] : [1, 0]
                  }}
                />
              )}
            </Source>
          </>
        )}

        {/* Distance Labels */}
        {layers?.showSegmentLengths && distanceLabelData?.features && distanceLabelData.features.map((feature: any, i: number) => {
          // Calculate offset to place label next to line instead of on top
          // We want the label perpendicular to the line direction
          const segmentBearing = feature.properties.bearing;
          const mapBearing = viewState.bearing;
          const relativeAngle = (segmentBearing - mapBearing) * Math.PI / 180;

          // Offset vector perpendicular to the line (rotated 90 degrees right)
          // Standard rotation: x' = x cos θ - y sin θ, y' = x sin θ + y cos θ
          // For 90 deg: x' = -y, y' = x
          // But effectively we just want to project length along the perpendicular angle
          // Angle of perpendicular = relativeAngle + 90 deg
          // Screen X = r * cos(angle), Screen Y = r * sin(angle) (inverted Y? no, standard CSS offset)
          // Let's use simple trig: 
          // 0 deg segment (Up) -> Perpendicular is Right (90 deg) -> offset [d, 0]
          // 90 deg segment (Right) -> Perpendicular is Down (180 deg) -> offset [0, d]

          // Estimate label width based on character count (approx 7px per char for typical font size)
          const charWidth = 7;
          const labelLength = feature.properties.distance.length;
          const estimatedLabelWidth = labelLength * charWidth;

          // Base padding + half of label width to ensure it clears the line
          const offsetDist = 15 + (estimatedLabelWidth / 2);
          const finalAngle = relativeAngle; // The relative angle of the line itself on screen

          // Perpendicular offset: (x,y) = (d * cos(angle), d * sin(angle))
          // Wait, cos(0) = 1 (Right), sin(0) = 0 (Down).
          // If line is 0 deg (Up on screen), we want offset Right.
          // cos(0-90) = 0, sin(0-90) = -1 (Up).
          // Let's stick to the proven math:
          // x = d * cos(ang)
          // y = d * sin(ang)
          // If line is Up (0 deg bearing), screen angle is -90 deg (standard math 0 is Right).
          // Let's just adjust the input angle to be standard math angle.
          // Compass 0 (Up) = Math -90. Compass 90 (Right) = Math 0.
          // MathAngle = CompassAngle - 90.

          const mathAngle = (segmentBearing - mapBearing - 90) * Math.PI / 180;

          // Perpendicular (+90 deg to line)
          const perpAngle = mathAngle + Math.PI / 2;

          const offsetX = offsetDist * Math.cos(perpAngle);
          const offsetY = offsetDist * Math.sin(perpAngle);

          return (
            <Marker
              key={`distance-${i}`}
              longitude={feature.geometry.coordinates[0]}
              latitude={feature.geometry.coordinates[1]}
              anchor="center"
              offset={[offsetX, offsetY]}
              style={{
                zIndex: 5 // Ensure below main markers but above lines if possible ( Markers are z-indexed by DOM order usually)
              }}
            >
              <MarkerIcon
                type="none"
                // Use configured styles
                label={feature.properties.distance}
                labelStyle={layers.markerPathLabelStyle || 'standard'}
                labelSize={layers.markerPathLabelSize || 12}
                // These colors need to match the style logic in MarkerIcon if we passed them,
                // but MarkerIcon handles the style->color mapping internally for background/border.
                // For 'standard', we might want to pass the text color if it's not black.
                labelColor={layers.markerPathLabelStyle === 'glass' || layers.markerPathLabelStyle === 'elevated' ? 'black' :
                  layers.markerPathLabelStyle === 'vintage' ? '#4a3b2a' :
                    (layers.markerPathColor || markerColor || '#000')}
                size={0} // Irrelevant since type='none', but keeps it clean
                shadow={false}
              />
            </Marker>
          );
        })}

        {/* Render Custom Markers */}
        {markers?.map(marker => (
          <Marker
            key={marker.id}
            longitude={marker.lng}
            latitude={marker.lat}
            anchor="center"
          >
            <MarkerIcon
              type={marker.type}
              color={marker.color}
              size={marker.size}
              label={marker.label}
              labelStyle={marker.labelStyle}
              labelColor={marker.labelColor}
              labelSize={marker.labelSize}
            />
          </Marker>
        ))}

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

        {/* Deck.gl Terrain Layer - Rendered for volumetric terrain OR 3D print preview mode */}
        {(layers?.volumetricTerrain || is3DMode) && (() => {
          // Derive terrain shadow colors from palette (matching 2D hillshade logic)
          let derivedTerrainColor: [number, number, number] = [220, 220, 220];
          let derivedShadowColor: [number, number, number] = [80, 80, 100];
          let derivedHighlightColor: [number, number, number] = [255, 255, 255];

          if (palette) {
            const isDark = isColorDark(palette.background);

            // Highlight color: from background (same as 2D hillshade)
            const bgRgb = hexToRgb(palette.background);
            if (bgRgb) {
              derivedHighlightColor = bgRgb;
            }

            // Shadow color: from hillshade color or secondary/text (same as 2D hillshade)
            const shadowHex = palette.hillshade || palette.secondary || palette.text;
            if (shadowHex) {
              const shadowRgb = hexToRgb(shadowHex);
              if (shadowRgb) {
                derivedShadowColor = shadowRgb;
              }
            }

            // Terrain base color: blend between shadow and highlight for mid-tones
            // Use landuse color if available, otherwise mix shadow and highlight
            const baseHex = palette.landuse || palette.background;
            const baseRgb = hexToRgb(baseHex);
            if (baseRgb) {
              // Mix with a slight tint toward the shadow color for terrain depth
              derivedTerrainColor = [
                Math.round(baseRgb[0] * 0.7 + derivedShadowColor[0] * 0.3),
                Math.round(baseRgb[1] * 0.7 + derivedShadowColor[1] * 0.3),
                Math.round(baseRgb[2] * 0.7 + derivedShadowColor[2] * 0.3),
              ];
            }
          }

          return (
            <DeckTerrainLayer
              exaggeration={layers?.volumetricTerrainExaggeration ?? 1.5}
              meshMaxError={TERRAIN_QUALITY_PRESETS[(layers?.terrainMeshQuality ?? 'balanced') as keyof typeof TERRAIN_QUALITY_PRESETS]}
              elevationData={getAwsTerrariumTileUrl()}
              visible={true}
              lightAzimuth={layers?.terrainLightAzimuth}
              lightAltitude={layers?.terrainLightAltitude}
              ambientLight={layers?.terrainAmbientLight ?? 0.15}
              diffuseLight={layers?.terrainDiffuseLight ?? 1.0}
              zoomOffset={layers?.terrainDetailLevel === 'high' ? 1 : layers?.terrainDetailLevel === 'ultra' ? 2 : 0}
              // Shadow settings - use palette-derived colors, or explicit overrides if set
              enableShadows={layers?.terrainShadows ?? true}
              shadowDarkness={layers?.terrainShadowDarkness ?? 0.7}
              terrainColor={layers?.terrainColor as [number, number, number] ?? derivedTerrainColor}
              shadowColor={layers?.terrainShadowColor as [number, number, number] ?? derivedShadowColor}
              highlightColor={layers?.terrainHighlightColor as [number, number, number] ?? derivedHighlightColor}
            />
          );
        })()}
        {layers?.showScale && (
          <CustomScaleControl />
        )}
      </Map>

      {/* Context Menu */}
      {contextMenuInfo && onAddMarker && (
        <MapContextMenu
          x={contextMenuInfo.x}
          y={contextMenuInfo.y}
          onClose={closeContextMenu}
          onAddMarker={() => {
            onAddMarker(contextMenuInfo.lat, contextMenuInfo.lng);
            closeContextMenu();
          }}
        />
      )}

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

      {/* 3D Mode Overlay Label */}
      {is3DMode && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
          <div className="bg-blue-600/90 backdrop-blur-md px-4 py-1.5 rounded-full shadow-lg border border-blue-400/50">
            <span className="text-xs font-bold text-white tracking-wide uppercase flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              STL Preview Mode
            </span>
          </div>
        </div>
      )}

      {/* Zoom Level Indicator */}
      {!is3DMode && (
        <div className="absolute top-4 right-4 z-20 pointer-events-none hidden md:block">
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 shadow-sm">
            <span className="text-[11px] font-medium text-gray-600 dark:text-gray-300 tracking-wide flex items-center gap-1.5">
              <span>{getZoomLabel(viewState.zoom)} View</span>
              <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
              <span className="font-mono text-[10px] opacity-75">z{viewState.zoom.toFixed(1)}</span>
            </span>
          </div>
        </div>
      )}

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
