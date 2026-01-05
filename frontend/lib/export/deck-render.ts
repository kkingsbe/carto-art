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
    const maxTextureSize = getMaxTextureSize();
    const maxSize = Math.min(maxTextureSize, 16384); // Increased from 8192 to support ultra-high res single-pass

    logger.info('Deck.gl render constraints', {
        width,
        height,
        maxTextureSize,
        maxSize,
        willTile: width > maxSize || height > maxSize
    });

    // If within limits, render directly
    if (width <= maxSize && height <= maxSize) {
        return renderSingleDeckTerrain(options);
    }

    // Tiled rendering required
    const tilesX = Math.ceil(width / maxSize);
    const tilesY = Math.ceil(height / maxSize);

    // Validate tiling config
    if (tilesX <= 0 || tilesY <= 0) {
        throw new Error(`Invalid tiling configuration: ${tilesX}x${tilesY} tiles for ${width}x${height} area`);
    }

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
        throw new Error(`Cannot render 3D terrain: invalid dimensions (${renderWidth}x${renderHeight})`);
    }

    logger.info('renderSingleDeckTerrain start', {
        renderWidth,
        renderHeight,
        pitch,
        bearing,
        zoom,
        center,
        hasTexture: !!texture
    });

    const settings = config.layers;
    const exaggeration = settings.volumetricTerrainExaggeration ?? 1.5;

    return new Promise((resolve, reject) => {
        // Create a hidden container to attach the canvas to
        // This ensures deck.gl's resize logic sees valid clientWidth/clientHeight
        // instead of 0x0 for detached elements
        const hiddenContainer = document.createElement('div');
        hiddenContainer.style.width = `${renderWidth}px`;
        hiddenContainer.style.height = `${renderHeight}px`;
        hiddenContainer.style.position = 'fixed';
        hiddenContainer.style.top = '-9999px';
        hiddenContainer.style.left = '-9999px';
        hiddenContainer.style.opacity = '0';
        hiddenContainer.style.pointerEvents = 'none';
        document.body.appendChild(hiddenContainer);

        const canvas = document.createElement('canvas');
        canvas.width = Math.floor(renderWidth);
        canvas.height = Math.floor(renderHeight);

        // Add CSS dimensions to prevent deck.gl from resizing to 0x0
        // deck.gl's internal resize logic checks CSS dimensions, and without them it defaults to 0x0
        canvas.style.width = `${renderWidth}px`;
        canvas.style.height = `${renderHeight}px`;

        // Attach canvas to container BEFORE deck.gl initialization
        // This ensures clientWidth/clientHeight are valid
        hiddenContainer.appendChild(canvas);

        // Verify allocation success
        if (canvas.width !== Math.floor(renderWidth) || canvas.height !== Math.floor(renderHeight)) {
            // Clean up container on error
            if (document.body.contains(hiddenContainer)) {
                document.body.removeChild(hiddenContainer);
            }
            reject(new Error(`Failed to allocate deck.gl canvas: requested ${renderWidth}x${renderHeight}, got ${canvas.width}x${canvas.height}. This usually indicates you have exceeded your browser or hardware's maximum canvas size.`));
            return;
        }

        // Verify the canvas has valid client dimensions now that it's attached
        logger.info('Canvas attached to DOM', {
            canvasWidth: canvas.width,
            canvasHeight: canvas.height,
            clientWidth: canvas.clientWidth,
            clientHeight: canvas.clientHeight
        });

        const detailLevel = settings.terrainDetailLevel || 'normal';
        const zoomOffset = detailLevel === 'ultra' ? 2 : detailLevel === 'high' ? 1 : 0;

        const layer = new TerrainLayer({
            id: 'terrain-export',
            minZoom: 0,
            maxZoom: 14,
            strategy: 'no-overlap',
            zoomOffset,
            elevationDecoder: {
                rScaler: 256 * exaggeration,
                gScaler: 1 * exaggeration,
                bScaler: (1 / 256) * exaggeration,
                offset: -32768 * exaggeration,
            },
            elevationData: getAwsTerrariumTileUrl(),
            texture: (texture || null) as any,
            meshMaxError: TERRAIN_QUALITY_PRESETS[settings.terrainMeshQuality || 'export'],
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
            // Remove hidden container from DOM
            if (document.body.contains(hiddenContainer)) {
                document.body.removeChild(hiddenContainer);
            }
        };

        timeoutId = setTimeout(() => {
            cleanup();
            reject(new Error('Deck.gl render timed out after 120s'));
        }, 120000); // Massive timeout for ultra high-res

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

                if (terrainLayer) {
                    const { isLoaded, numInstances } = terrainLayer;
                    // Only log occasionally to avoid flooding
                    if (Math.random() < 0.05) {
                        logger.info('onAfterRender status', { isLoaded, numInstances });
                    }
                }
                if (terrainLayer && terrainLayer.isLoaded) {
                    isResolved = true;
                    requestAnimationFrame(() => {
                        // Log canvas dimensions before capture for diagnostics
                        logger.info('Capturing deck.gl canvas', {
                            canvasWidth: canvas.width,
                            canvasHeight: canvas.height,
                            cssWidth: canvas.style.width,
                            cssHeight: canvas.style.height
                        });

                        const safeCanvas = document.createElement('canvas');
                        safeCanvas.width = canvas.width;
                        safeCanvas.height = canvas.height;

                        const ctx = safeCanvas.getContext('2d');
                        if (ctx && canvas.width > 0 && canvas.height > 0) {
                            try {
                                ctx.drawImage(canvas, 0, 0);
                                cleanup();
                                resolve(safeCanvas);
                            } catch (e) {
                                cleanup();
                                reject(new Error(`Failed to capture 3D terrain: ${e instanceof Error ? e.message : String(e)}`));
                            }
                        } else {
                            cleanup();
                            reject(new Error(`Failed to capture 3D terrain: invalid source canvas (${canvas.width}x${canvas.height}) or 2D context failure. This can happen if the GPU hangs during a high-resolution render.`));
                        }
                    });
                }
            }
        });
    });
}

