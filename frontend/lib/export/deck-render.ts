import { Deck } from '@deck.gl/core';
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
    texture?: HTMLCanvasElement | HTMLImageElement | null;
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
    texture
}: RenderDeckOptions): Promise<HTMLCanvasElement> {
    const settings = config.layers;
    const exaggeration = settings.volumetricTerrainExaggeration ?? 1.5;

    return new Promise((resolve, reject) => {
        logger.info('Starting deck.gl terrain export render', { width, height, zoom, hasTexture: !!texture });

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
                ambient: 0.35,
                diffuse: 0.8,
                shininess: 32,
                specularColor: [30, 30, 30],
            },
            operation: 'terrain+draw',
        });

        let deck: Deck | null = null;
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

        deck = new Deck({
            canvas,
            width,
            height,
            initialViewState: {
                longitude: center.lng,
                latitude: center.lat,
                zoom,
                pitch,
                bearing,
            },
            controller: false,
            layers: [layer],
            useDevicePixels: false, // Canvas is already sized to physical pixels
            // @ts-ignore - glOptions is available in Deck class but missing in some type definitions
            glOptions: {
                preserveDrawingBuffer: true,
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
                        resolve(canvas);
                        // Don't finalize immediately, caller needs to read canvas
                        // Caller is responsible for not holding onto it forever?
                        // Actually, once resolved, we can finalize? 
                        // If we finalize, the GL context might be lost/cleared.
                        // We should finalize AFTER caller uses it. 
                        // But we return canvas. We can't easily hook into caller's usage.
                        // For now, we leave it open. The browser GC will clean up eventually, 
                        // or we explicitly leak a GL context until page refresh?
                        // Better: Copy to a new 2D canvas and finalize deck?
                        // Yes, let's return a safe 2D canvas copy.

                        const safeCanvas = document.createElement('canvas');
                        safeCanvas.width = width;
                        safeCanvas.height = height;
                        const ctx = safeCanvas.getContext('2d');
                        if (ctx) {
                            ctx.drawImage(canvas, 0, 0);
                            cleanup(); // Now safe to destroy GL context
                            resolve(safeCanvas); // Return the 2D copy
                        } else {
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
