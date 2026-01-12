'use client';

import { useEffect, useState, useRef } from 'react';
import { useMap } from 'react-map-gl/maplibre';

interface DeckTerrainLayerProps {
    /** Terrain exaggeration factor (0-5) */
    exaggeration: number;
    /** Mesh quality - lower = higher quality, slower render. 4.0 = fast, 1.0 = balanced, 0.5 = high */
    meshMaxError?: number;
    /** Tile URL template for elevation data */
    elevationData: string;
    /** Optional bounds to constrain terrain rendering */
    bounds?: [number, number, number, number];
    /** Optional visibility control */
    visible?: boolean;
    /** Ambient light intensity (0-1) */
    ambientLight?: number;
    /** Diffuse light intensity (0-1) */
    diffuseLight?: number;
    /** Light azimuth angle in degrees (0-360) */
    lightAzimuth?: number;
    /** Light altitude angle in degrees (0-90) */
    lightAltitude?: number;
    /**
     * Zoom offset to force higher resolution tiles (0-3).
     * Positive values fetch tiles at a higher zoom than the current view.
     * E.g., zoomOffset=2 at camera zoom 8 will fetch zoom 10 tiles.
     * Higher values = better quality but more tiles to load.
     */
    zoomOffset?: number;
    /** Enable terrain self-shadowing via ray-marched shadow texture */
    enableShadows?: boolean;
    /** Shadow darkness (0-1, 0=no shadow, 1=full black) */
    shadowDarkness?: number;
    /** Base terrain color when no texture [R, G, B] */
    terrainColor?: [number, number, number];
    /** Shadow tint color [R, G, B] */
    shadowColor?: [number, number, number];
    /** Highlight color for lit areas [R, G, B] */
    highlightColor?: [number, number, number];
}

/**
 * Computes a shadow-only texture from elevation data using ray marching.
 * Each pixel traces a ray toward the sun to determine if it's in shadow.
 *
 * This creates a TRANSPARENT overlay texture:
 * - Shadowed areas: dark with partial alpha (darkens underlying map)
 * - Lit areas: fully transparent (shows underlying map unchanged)
 *
 * This allows the beautiful 2D map to show through while adding cast shadows.
 */
function computeTerrainShadowTexture(
    elevationCanvas: HTMLCanvasElement,
    sunAzimuth: number,
    sunAltitude: number,
    shadowDarkness: number,
    exaggeration: number,
    shadowColor: [number, number, number]
): HTMLCanvasElement {
    const width = elevationCanvas.width;
    const height = elevationCanvas.height;

    const ctx = elevationCanvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('Could not get elevation canvas context');

    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    // Decode Terrarium elevation: elevation = (R * 256 + G + B / 256) - 32768
    const elevation = new Float32Array(width * height);
    for (let i = 0; i < width * height; i++) {
        const idx = i * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        elevation[i] = ((r * 256 + g + b / 256) - 32768) * exaggeration;
    }

    // Sun direction (azimuth: 0=North, 90=East; altitude: 0=horizon, 90=zenith)
    const azimuthRad = (sunAzimuth * Math.PI) / 180;
    const altitudeRad = (sunAltitude * Math.PI) / 180;

    // Direction TO the sun in pixel space
    const sunDirX = Math.sin(azimuthRad);
    const sunDirY = -Math.cos(azimuthRad); // Negative because canvas Y increases downward
    const sunTanAlt = Math.tan(altitudeRad);

    // Pixel scale: approximate meters per pixel (depends on zoom, ~30m at z10)
    const pixelScale = 30 * exaggeration;

    // Max ray distance
    const maxRayDist = Math.max(width, height);

    // Output shadow buffer - RGBA with transparency
    const shadowData = new Uint8ClampedArray(width * height * 4);

    // Ray march each pixel
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = y * width + x;
            const baseElev = elevation[idx];

            let inShadow = false;

            // March toward the sun
            for (let dist = 1; dist < maxRayDist; dist += 1) {
                const sampleX = Math.round(x + sunDirX * dist);
                const sampleY = Math.round(y + sunDirY * dist);

                // Out of bounds - no shadow
                if (sampleX < 0 || sampleX >= width || sampleY < 0 || sampleY >= height) {
                    break;
                }

                const sampleIdx = sampleY * width + sampleX;
                const sampleElev = elevation[sampleIdx];

                // Height threshold for blocking sunlight
                const requiredHeight = baseElev + dist * pixelScale * sunTanAlt;

                if (sampleElev > requiredHeight) {
                    inShadow = true;
                    break;
                }
            }

            const outIdx = idx * 4;

            if (inShadow) {
                // In shadow: dark overlay with transparency based on shadowDarkness
                // Use shadow color tint for artistic effect
                shadowData[outIdx] = shadowColor[0];
                shadowData[outIdx + 1] = shadowColor[1];
                shadowData[outIdx + 2] = shadowColor[2];
                // Alpha controls how much we darken - shadowDarkness of 0.7 = 70% dark overlay
                shadowData[outIdx + 3] = Math.round(shadowDarkness * 255);
            } else {
                // Lit areas: fully transparent - let the underlying map show through
                shadowData[outIdx] = 0;
                shadowData[outIdx + 1] = 0;
                shadowData[outIdx + 2] = 0;
                shadowData[outIdx + 3] = 0;
            }
        }
    }

    // Create output canvas
    const outputCanvas = document.createElement('canvas');
    outputCanvas.width = width;
    outputCanvas.height = height;
    const outputCtx = outputCanvas.getContext('2d');
    if (!outputCtx) throw new Error('Could not create output canvas context');

    outputCtx.putImageData(new ImageData(shadowData, width, height), 0, 0);
    return outputCanvas;
}

/**
 * Loads elevation tiles for the visible area and composites them into a single canvas.
 */
async function loadElevationTiles(
    elevationUrlTemplate: string,
    bounds: { west: number; south: number; east: number; north: number },
    zoom: number
): Promise<HTMLCanvasElement | null> {
    // Calculate tile coordinates for the bounds
    const tileZoom = Math.min(Math.floor(zoom), 12); // Cap at zoom 12 for reasonable tile count

    const lon2tile = (lon: number, z: number) => Math.floor((lon + 180) / 360 * Math.pow(2, z));
    const lat2tile = (lat: number, z: number) => Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, z));

    const minTileX = lon2tile(bounds.west, tileZoom);
    const maxTileX = lon2tile(bounds.east, tileZoom);
    const minTileY = lat2tile(bounds.north, tileZoom); // Note: north has lower Y
    const maxTileY = lat2tile(bounds.south, tileZoom);

    const tilesX = maxTileX - minTileX + 1;
    const tilesY = maxTileY - minTileY + 1;

    console.log('[loadElevationTiles] Tile calculation:', {
        tileZoom,
        minTileX, maxTileX, minTileY, maxTileY,
        tilesX, tilesY,
        totalTiles: tilesX * tilesY
    });

    // Limit tile count for performance
    if (tilesX * tilesY > 16) {
        console.log('[loadElevationTiles] Too many tiles, skipping');
        return null; // Too many tiles
    }

    const tileSize = 256;
    const compositeCanvas = document.createElement('canvas');
    compositeCanvas.width = tilesX * tileSize;
    compositeCanvas.height = tilesY * tileSize;
    const ctx = compositeCanvas.getContext('2d');
    if (!ctx) return null;

    // Load all tiles in parallel
    const tilePromises: Promise<{ img: HTMLImageElement; x: number; y: number } | null>[] = [];

    for (let ty = minTileY; ty <= maxTileY; ty++) {
        for (let tx = minTileX; tx <= maxTileX; tx++) {
            const url = elevationUrlTemplate
                .replace('{z}', String(tileZoom))
                .replace('{x}', String(tx))
                .replace('{y}', String(ty));

            const promise = new Promise<{ img: HTMLImageElement; x: number; y: number } | null>((resolve) => {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                img.onload = () => resolve({
                    img,
                    x: (tx - minTileX) * tileSize,
                    y: (ty - minTileY) * tileSize
                });
                img.onerror = () => resolve(null);
                img.src = url;
            });

            tilePromises.push(promise);
        }
    }

    const results = await Promise.all(tilePromises);

    // Draw tiles to composite canvas
    for (const result of results) {
        if (result) {
            ctx.drawImage(result.img, result.x, result.y);
        }
    }

    return compositeCanvas;
}

/**
 * DeckTerrainLayer - High-quality 3D terrain rendering using deck.gl TerrainLayer.
 *
 * This component integrates with react-map-gl/maplibre to overlay a deck.gl TerrainLayer
 * that provides higher mesh quality than MapLibre's native terrain implementation.
 *
 * Key features:
 * - Configurable mesh quality via meshMaxError (lower = higher quality)
 * - Terrarium elevation decoder matching AWS terrain tiles
 * - Material settings for cartographic lighting
 * - Ray-marched self-shadowing when enabled
 *
 * @example
 * ```tsx
 * <Map>
 *   <DeckTerrainLayer
 *     exaggeration={1.5}
 *     meshMaxError={4.0}
 *     elevationData="/api/tiles/aws-terrain/terrarium/{z}/{x}/{y}.png"
 *     enableShadows={true}
 *   />
 * </Map>
 * ```
 */
export function DeckTerrainLayer({
    exaggeration = 1.5,
    meshMaxError = 4.0,
    elevationData,
    bounds,
    visible = true,
    ambientLight = 0.4,
    diffuseLight = 0.8,
    lightAzimuth,
    lightAltitude,
    zoomOffset = 0,
    enableShadows = true,
    shadowDarkness = 0.7,
    terrainColor = [200, 200, 200],
    shadowColor = [60, 60, 80],
    highlightColor = [255, 255, 255],
}: DeckTerrainLayerProps) {
    const { current: map } = useMap();
    const [shadowTexture, setShadowTexture] = useState<string | null>(null);
    const [shadowBounds, setShadowBounds] = useState<[number, number, number, number] | null>(null);
    const computingRef = useRef(false);
    const lastComputeParamsRef = useRef<string>('');

    // Compute shadow texture when view stabilizes and shadows are enabled
    useEffect(() => {
        console.log('[DeckTerrainLayer] Shadow effect triggered', { enableShadows, hasMap: !!map });

        if (!enableShadows || !map) {
            console.log('[DeckTerrainLayer] Shadows disabled or no map, clearing texture');
            setShadowTexture(null);
            setShadowBounds(null);
            return;
        }

        const computeShadows = async () => {
            if (!map) return;

            const mapBounds = map.getBounds();
            const zoom = map.getZoom();

            console.log('[DeckTerrainLayer] Computing shadows for bounds:', {
                west: mapBounds.getWest(),
                south: mapBounds.getSouth(),
                east: mapBounds.getEast(),
                north: mapBounds.getNorth(),
                zoom
            });

            // Create a params string to check if we need to recompute
            const azimuth = lightAzimuth ?? 315;
            const altitude = lightAltitude ?? 45;
            const paramsKey = `${mapBounds.getWest().toFixed(4)},${mapBounds.getSouth().toFixed(4)},${mapBounds.getEast().toFixed(4)},${mapBounds.getNorth().toFixed(4)},${zoom.toFixed(1)},${azimuth},${altitude},${shadowDarkness},${exaggeration}`;

            if (paramsKey === lastComputeParamsRef.current || computingRef.current) {
                console.log('[DeckTerrainLayer] Skipping - already computed or computing');
                return;
            }

            computingRef.current = true;
            lastComputeParamsRef.current = paramsKey;

            try {
                console.log('[DeckTerrainLayer] Loading elevation tiles...');
                const elevationCanvas = await loadElevationTiles(
                    elevationData,
                    {
                        west: mapBounds.getWest(),
                        south: mapBounds.getSouth(),
                        east: mapBounds.getEast(),
                        north: mapBounds.getNorth()
                    },
                    zoom
                );

                if (elevationCanvas) {
                    console.log('[DeckTerrainLayer] Elevation tiles loaded, computing shadows...', {
                        width: elevationCanvas.width,
                        height: elevationCanvas.height
                    });

                    const shadowCanvas = computeTerrainShadowTexture(
                        elevationCanvas,
                        azimuth,
                        altitude,
                        shadowDarkness,
                        exaggeration,
                        shadowColor
                    );

                    console.log('[DeckTerrainLayer] Shadow texture computed, applying...');
                    setShadowTexture(shadowCanvas.toDataURL());
                    // Store bounds for positioning the shadow overlay
                    setShadowBounds([
                        mapBounds.getWest(),
                        mapBounds.getSouth(),
                        mapBounds.getEast(),
                        mapBounds.getNorth()
                    ]);
                } else {
                    console.log('[DeckTerrainLayer] No elevation canvas returned (too many tiles?)');
                }
            } catch (err) {
                console.warn('[DeckTerrainLayer] Failed to compute terrain shadows:', err);
            } finally {
                computingRef.current = false;
            }
        };

        // Debounce shadow computation
        const timeoutId = setTimeout(computeShadows, 500);
        return () => clearTimeout(timeoutId);
    }, [
        enableShadows,
        map,
        elevationData,
        lightAzimuth,
        lightAltitude,
        shadowDarkness,
        exaggeration,
        shadowColor,
    ]);

    // Also recompute when map stops moving
    useEffect(() => {
        if (!enableShadows || !map) return;

        const handleMoveEnd = () => {
            // Trigger recompute by clearing the last params
            lastComputeParamsRef.current = '';
        };

        map.on('moveend', handleMoveEnd);
        return () => {
            map.off('moveend', handleMoveEnd);
        };
    }, [enableShadows, map]);

    // Add shadow overlay as a MapLibre layer so it gets draped over the terrain
    // This is key - MapLibre's terrain drapes all its layers over the 3D mesh
    useEffect(() => {
        if (!map) return;

        const sourceId = 'terrain-shadow-source';
        const layerId = 'terrain-shadow-layer';

        // Clean up function
        const cleanup = () => {
            const mapLibre = map.getMap();
            try {
                if (mapLibre.getLayer(layerId)) {
                    mapLibre.removeLayer(layerId);
                }
                if (mapLibre.getSource(sourceId)) {
                    mapLibre.removeSource(sourceId);
                }
            } catch (e) {
                // Ignore errors during cleanup (map might be destroyed)
            }
        };

        // If no shadow texture, just clean up and return
        if (!enableShadows || !shadowTexture || !shadowBounds) {
            cleanup();
            return cleanup;
        }

        console.log('[DeckTerrainLayer] Adding shadow overlay as MapLibre layer', {
            bounds: shadowBounds
        });

        try {
            // Remove existing layer/source if present
            cleanup();

            // Add the shadow texture as an image source
            // Bounds format: [west, south, east, north] -> coordinates for image corners
            const coordinates: [[number, number], [number, number], [number, number], [number, number]] = [
                [shadowBounds[0], shadowBounds[3]], // top-left (west, north)
                [shadowBounds[2], shadowBounds[3]], // top-right (east, north)
                [shadowBounds[2], shadowBounds[1]], // bottom-right (east, south)
                [shadowBounds[0], shadowBounds[1]], // bottom-left (west, south)
            ];

            const mapLibre = map.getMap();
            mapLibre.addSource(sourceId, {
                type: 'image',
                url: shadowTexture,
                coordinates: coordinates,
            });

            // Add a raster layer to display the shadow
            // This layer will be draped over the terrain automatically
            mapLibre.addLayer({
                id: layerId,
                type: 'raster',
                source: sourceId,
                paint: {
                    'raster-opacity': 1,
                    'raster-fade-duration': 0,
                },
            });

            console.log('[DeckTerrainLayer] Shadow layer added successfully');
        } catch (err) {
            console.warn('[DeckTerrainLayer] Failed to add shadow layer:', err);
        }

        return cleanup;
    }, [map, enableShadows, shadowTexture, shadowBounds]);

    return null;
}

/**
 * Quality presets for terrain mesh rendering.
 * Maps user-friendly names to meshMaxError values.
 */
export const TERRAIN_QUALITY_PRESETS = {
    fast: 4.0,      // Quick preview, lower mesh resolution
    balanced: 2.0,  // Good quality, reasonable performance
    high: 1.0,      // High quality, slower rendering
    export: 0.5,    // Maximum quality for print export
    ultra: 0.25,    // Ultra quality for artistic renders
} as const;

export type TerrainQualityPreset = keyof typeof TERRAIN_QUALITY_PRESETS;
