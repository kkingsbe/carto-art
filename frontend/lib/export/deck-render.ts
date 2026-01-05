import { Deck, LightingEffect, AmbientLight, DirectionalLight, MapView } from '@deck.gl/core';
import { TerrainLayer } from '@deck.gl/geo-layers';

import { getAwsTerrariumTileUrl } from '@/lib/styles/tileUrl';
import { TERRAIN_QUALITY_PRESETS } from '@/components/map/DeckTerrainLayer';
import type { PosterConfig } from '@/types/poster';
import { logger } from '@/lib/logger';

interface RenderDeckOptions {
    config: PosterConfig;
    width: number;
    height: number;
    center: { lng: number; lat: number };
    zoom: number;
    pitch: number;
    bearing: number;
    fov?: number;
    texture?: HTMLCanvasElement | HTMLImageElement | ImageBitmap | null;
}

/**
 * Renders deck.gl terrain to an offscreen canvas for export.
 * Creates a standalone Deck instance, loads terrain tiles, and renders a high-quality mesh.
 */
export async function renderDeckTerrain({
    config,
    width,
    height,
    center,
    zoom,
    pitch,
    bearing,
    fov = 36.87,
    texture
}: RenderDeckOptions): Promise<HTMLCanvasElement> {
    // Guard against zero-dimension canvases
    if (width <= 0 || height <= 0) {
        logger.warn('Skipping deck.gl terrain render due to invalid dimensions', { width, height });
        const emptyCanvas = document.createElement('canvas');
        emptyCanvas.width = Math.max(1, width);
        emptyCanvas.height = Math.max(1, height);
        return emptyCanvas;
    }

    const settings = config.layers;
    const exaggeration = settings.volumetricTerrainExaggeration ?? 1.5;

    return new Promise((resolve, reject) => {
        logger.info('Starting deck.gl terrain export render', {
            width,
            height,
            zoom,
            pitch,
            bearing,
            fov,
            hasTexture: !!texture
        });

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const layer = new TerrainLayer({
            id: 'terrain-export',
            minZoom: 0,
            maxZoom: 14,
            strategy: 'no-overlap',
            elevationDecoder: {
                // Terrarium encoding: elevation = (R * 256 + G + B / 256) - 32768
                // Scale by exaggeration factor
                rScaler: 256 * exaggeration,
                gScaler: 1 * exaggeration,
                bScaler: (1 / 256) * exaggeration,
                offset: -32768 * exaggeration,
            },
            elevationData: getAwsTerrariumTileUrl(),
            texture: (texture || null) as any, // Cast to any to bypass complex union type mismatch
            meshMaxError: TERRAIN_QUALITY_PRESETS.export,
            color: [255, 255, 255],
            material: {
                ambient: settings.terrainAmbientLight ?? 0.35,
                diffuse: settings.terrainDiffuseLight ?? 0.8,
                shininess: 32,
                specularColor: [30, 30, 30],
            },
            operation: 'terrain+draw',
        });

        let deck: Deck<any> | null = null;
        let timeoutId: NodeJS.Timeout;

        const cleanup = () => {
            if (timeoutId) clearTimeout(timeoutId);
            if (deck) {
                deck.finalize();
                deck = null;
            }
        };

        // Safety timeout (45s for high res export)
        timeoutId = setTimeout(() => {
            cleanup();
            reject(new Error('Deck.gl render timed out'));
        }, 45000);

        let isResolved = false;

        // Create lighting effect based on terrain light settings
        const lightAzimuth = settings.terrainLightAzimuth ?? 315;
        const lightAltitude = settings.terrainLightAltitude ?? 45;
        const ambientIntensity = settings.terrainAmbientLight ?? 0.35;
        const diffuseIntensity = settings.terrainDiffuseLight ?? 0.8;

        // Convert azimuth (compass degrees) and altitude to deck.gl light direction
        // deck.gl SunLight uses timestamp or direction vector
        const azimuthRad = (lightAzimuth * Math.PI) / 180;
        const altitudeRad = (lightAltitude * Math.PI) / 180;
        const lightDirection = [
            -Math.sin(azimuthRad) * Math.cos(altitudeRad),
            -Math.cos(azimuthRad) * Math.cos(altitudeRad),
            -Math.sin(altitudeRad)
        ];

        const ambientLight = new AmbientLight({
            color: [255, 255, 255],
            intensity: ambientIntensity
        });

        const directionalLight = new DirectionalLight({
            color: [255, 255, 255],
            intensity: diffuseIntensity,
            direction: lightDirection as [number, number, number],
        });

        const lightingEffect = new LightingEffect({ ambientLight, directionalLight });

        deck = new Deck({
            canvas,
            width,
            height,
            views: [new MapView({ id: 'view', controller: false, fovy: fov })],
            initialViewState: {
                view: {
                    longitude: center.lng,
                    latitude: center.lat,
                    zoom,
                    pitch,
                    bearing,
                },
            },
            controller: false,
            layers: [layer],
            effects: [lightingEffect],
            useDevicePixels: false, // Canvas is already sized to physical pixels
            // @ts-ignore - glOptions is available in Deck class but missing in some type definitions
            glOptions: {
                preserveDrawingBuffer: true,
                depth: true,
            },
            onAfterRender: () => {
                if (!deck || isResolved) return;

                // Check if layer is loaded
                // We access the internal layer manager to check status
                const layers = (deck as any).layerManager?.getLayers();
                const terrainLayer = layers?.find((l: any) => l.id === 'terrain-export');

                if (terrainLayer && terrainLayer.isLoaded) {
                    isResolved = true;
                    // Give one more frame to ensure draw
                    requestAnimationFrame(() => {
                        logger.info('Deck.gl render complete', {
                            glCanvasWidth: canvas.width,
                            glCanvasHeight: canvas.height,
                            hasCtx: !!canvas.getContext('webgl2') || !!canvas.getContext('webgl')
                        });

                        // Copy to a safe 2D canvas to prevent context loss
                        const safeCanvas = document.createElement('canvas');
                        safeCanvas.width = width;
                        safeCanvas.height = height;
                        const ctx = safeCanvas.getContext('2d');
                        if (ctx && canvas.width > 0 && canvas.height > 0) {
                            ctx.drawImage(canvas, 0, 0);
                            cleanup(); // Now safe to destroy GL context
                            resolve(safeCanvas); // Return the 2D copy
                        } else {
                            logger.warn('Deck.gl fallback or invalid dimensions', {
                                ctx: !!ctx,
                                w: canvas.width,
                                h: canvas.height
                            });
                            // Fallback
                            cleanup();
                            resolve(canvas);
                        }
                    });
                }
            }
        });
    });
}

