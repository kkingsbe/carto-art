import { Deck, LightingEffect, AmbientLight, DirectionalLight, MapView } from '@deck.gl/core';
import { TerrainLayer } from '@deck.gl/geo-layers';

import { getAwsTerrariumTileUrl } from '@/lib/styles/tileUrl';
import { TERRAIN_QUALITY_PRESETS } from '@/components/map/DeckTerrainLayer';
import type { PosterConfig } from '@/types/poster';
import { logger } from '@/lib/logger';

const MAX_SAFE_SIZE = 4096;
let cachedMaxTextureSize: number | null = null;

/**
 * Detects the maximum texture size supported by the current hardware/browser.
 * Falls back to 4096 if detection fails.
 */
function getMaxTextureSize(): number {
    if (cachedMaxTextureSize !== null) return cachedMaxTextureSize;
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
        if (!gl) return MAX_SAFE_SIZE;
        const size = (gl as any).getParameter((gl as any).MAX_TEXTURE_SIZE);
        cachedMaxTextureSize = (size as number) || MAX_SAFE_SIZE;
        return cachedMaxTextureSize;
    } catch {
        return MAX_SAFE_SIZE;
    }
}

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
    /** Internal use for tiled rendering */
    _tileConfig?: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
}

/**
 * Renders deck.gl terrain to an offscreen canvas for export.
 * Automatically handles tiled rendering if dimensions exceed WebGL limits.
 */
export async function renderDeckTerrain(options: RenderDeckOptions): Promise<HTMLCanvasElement> {
    const { width, height, texture } = options;
    const maxSize = Math.min(getMaxTextureSize(), 8192); // Cap at 8192 for browser stability

    // If within limits, render directly
    if (width <= maxSize && height <= maxSize) {
        return renderSingleDeckTerrain(options);
    }

    // Tiled rendering required
    const tilesX = Math.ceil(width / maxSize);
    const tilesY = Math.ceil(height / maxSize);

    logger.info('Dimensions exceed WebGL limits, performing tiled deck.gl render', {
        width,
        height,
        maxSize,
        tilesX,
        tilesY
    });

    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = width;
    finalCanvas.height = height;
    const finalCtx = finalCanvas.getContext('2d');
    if (!finalCtx) throw new Error('Could not create final composite canvas context');

    // Render tiles sequentially
    for (let ty = 0; ty < tilesY; ty++) {
        for (let tx = 0; tx < tilesX; tx++) {
            const tileX = tx * maxSize;
            const tileY = ty * maxSize;
            const tileWidth = Math.min(maxSize, width - tileX);
            const tileHeight = Math.min(maxSize, height - tileY);

            logger.info(`Rendering terrain tile [${tx}, ${ty}]`, { tileX, tileY, tileWidth, tileHeight });

            // Crop texture for this tile to stay within WebGL texture limits
            let tileTexture = null;
            if (texture) {
                const cropCanvas = document.createElement('canvas');
                cropCanvas.width = tileWidth;
                cropCanvas.height = tileHeight;
                const cropCtx = cropCanvas.getContext('2d');
                if (cropCtx) {
                    cropCtx.drawImage(texture, tileX, tileY, tileWidth, tileHeight, 0, 0, tileWidth, tileHeight);
                    tileTexture = cropCanvas;
                }
            }

            const tileCanvas = await renderSingleDeckTerrain({
                ...options,
                texture: tileTexture,
                _tileConfig: {
                    x: tileX,
                    y: tileY,
                    width: tileWidth,
                    height: tileHeight
                }
            });

            finalCtx.drawImage(tileCanvas, tileX, tileY);
        }
    }

    return finalCanvas;
}

/**
 * Internal rendering function for a single tile/viewport.
 */
async function renderSingleDeckTerrain({
    config,
    width: fullWidth,
    height: fullHeight,
    center,
    zoom,
    pitch,
    bearing,
    fov = 36.87,
    texture,
    _tileConfig
}: RenderDeckOptions): Promise<HTMLCanvasElement> {
    const renderWidth = _tileConfig ? _tileConfig.width : fullWidth;
    const renderHeight = _tileConfig ? _tileConfig.height : fullHeight;

    // Guard against zero-dimension canvases
    if (renderWidth <= 0 || renderHeight <= 0) {
        logger.warn('Skipping deck.gl terrain render due to invalid dimensions', { renderWidth, renderHeight });
        const emptyCanvas = document.createElement('canvas');
        emptyCanvas.width = Math.max(1, renderWidth);
        emptyCanvas.height = Math.max(1, renderHeight);
        return emptyCanvas;
    }

    const settings = config.layers;
    const exaggeration = settings.volumetricTerrainExaggeration ?? 1.5;

    return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        canvas.width = renderWidth;
        canvas.height = renderHeight;

        const layer = new TerrainLayer({
            id: 'terrain-export',
            minZoom: 0,
            maxZoom: 14,
            strategy: 'no-overlap',
            elevationDecoder: {
                rScaler: 256 * exaggeration,
                gScaler: 1 * exaggeration,
                bScaler: (1 / 256) * exaggeration,
                offset: -32768 * exaggeration,
            },
            elevationData: getAwsTerrariumTileUrl(),
            texture: (texture || null) as any,
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

        timeoutId = setTimeout(() => {
            cleanup();
            reject(new Error('Deck.gl render timed out'));
        }, 60000); // Increased timeout for high-res

        let isResolved = false;

        const lightAzimuth = settings.terrainLightAzimuth ?? 315;
        const lightAltitude = settings.terrainLightAltitude ?? 45;
        const ambientIntensity = settings.terrainAmbientLight ?? 0.35;
        const diffuseIntensity = settings.terrainDiffuseLight ?? 0.8;

        const azimuthRad = (lightAzimuth * Math.PI) / 180;
        const altitudeRad = (lightAltitude * Math.PI) / 180;
        const lightDirection = [
            -Math.sin(azimuthRad) * Math.cos(altitudeRad),
            -Math.cos(azimuthRad) * Math.cos(altitudeRad),
            -Math.sin(altitudeRad)
        ];

        const lightingEffect = new LightingEffect({
            ambientLight: new AmbientLight({ color: [255, 255, 255], intensity: ambientIntensity }),
            directionalLight: new DirectionalLight({
                color: [255, 255, 255],
                intensity: diffuseIntensity,
                direction: lightDirection as [number, number, number],
            })
        });

        // Calculate offset view for tiled rendering
        // MapView x,y are where the view starts on the canvas. 
        // We set logical size to fullWidth/Height and offset by -x, -y to show the correct part.
        const view = new MapView({
            id: 'view',
            controller: false,
            fovy: fov,
            x: _tileConfig ? -_tileConfig.x : 0,
            y: _tileConfig ? -_tileConfig.y : 0,
            width: fullWidth,
            height: fullHeight,
        });

        deck = new Deck({
            canvas,
            width: renderWidth,
            height: renderHeight,
            views: [view],
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
            useDevicePixels: false,
            deviceProps: {
                preserveDrawingBuffer: true,
                depth: true,
            } as any,
            onAfterRender: () => {
                if (!deck || isResolved) return;
                const layers = (deck as any).layerManager?.getLayers();
                const terrainLayer = layers?.find((l: any) => l.id === 'terrain-export');

                if (terrainLayer && terrainLayer.isLoaded) {
                    isResolved = true;
                    requestAnimationFrame(() => {
                        const safeCanvas = document.createElement('canvas');
                        safeCanvas.width = renderWidth;
                        safeCanvas.height = renderHeight;
                        const ctx = safeCanvas.getContext('2d');
                        if (ctx && canvas.width > 0 && canvas.height > 0) {
                            ctx.drawImage(canvas, 0, 0);
                            cleanup();
                            resolve(safeCanvas);
                        } else {
                            cleanup();
                            resolve(canvas);
                        }
                    });
                }
            }
        });
    });
}

