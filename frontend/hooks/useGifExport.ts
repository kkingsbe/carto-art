'use client';

import { useState, useRef, useCallback } from 'react';
import type MapLibreGL from 'maplibre-gl';
import { logger } from '@/lib/logger';
import GIF from 'gif.js';
import type { PosterConfig } from '@/types/poster';
import { trackEventAction } from '@/lib/actions/events';

export interface GifExportOptions {
    duration: number; // seconds
    totalRotation: number; // degrees
    fps: number; // frames per second
}

interface UseGifExportReturn {
    isGeneratingGif: boolean;
    isGeneratingGifRef: React.MutableRefObject<boolean>;
    generateOrbitGif: (options?: GifExportOptions) => Promise<void>;
    progress: number;
}

const DEFAULT_GIF_OPTIONS: GifExportOptions = {
    duration: 7,
    totalRotation: 90,
    fps: 20,
};

export function useGifExport(
    mapRef: React.MutableRefObject<MapLibreGL.Map | null>,
    config: PosterConfig
): UseGifExportReturn {
    const [isGeneratingGif, setIsGeneratingGif] = useState(false);
    const isGeneratingGifRef = useRef(false);
    const [progress, setProgress] = useState(0);
    const abortControllerRef = useRef<AbortController | null>(null);

    const generateOrbitGif = useCallback(async (options?: GifExportOptions) => {
        const { duration, totalRotation, fps } = { ...DEFAULT_GIF_OPTIONS, ...options };
        if (!mapRef.current) {
            logger.error('generateOrbitGif: Map reference is null');
            return;
        }
        const map = mapRef.current;

        // Safety check - if already generating, ignore
        if (isGeneratingGifRef.current) {
            logger.warn('generateOrbitGif: Already generating GIF');
            return;
        }

        logger.info('Starting GIF generation...');
        const startTime = Date.now();

        setIsGeneratingGif(true);
        isGeneratingGifRef.current = true;
        setProgress(0);
        abortControllerRef.current = new AbortController();

        try {
            const originalBearing = map.getBearing();
            const originalPitch = map.getPitch();
            const originalCenter = map.getCenter();
            const originalZoom = map.getZoom();

            logger.info('Initial map state', { originalBearing, originalPitch, originalCenter, originalZoom });

            const gif = new GIF({
                workers: 2,
                quality: 10,
                width: map.getCanvas().width,
                height: map.getCanvas().height,
                workerScript: '/gif.worker.js',
            });

            gif.on('finished', async (blob) => {
                logger.info('GIF encoding finished, size:', blob.size);
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `orbit-${Date.now()}.gif`;
                link.click();
                URL.revokeObjectURL(url);

                setProgress(100);

                // Track export event
                await trackEventAction({
                    eventType: 'poster_export',
                    eventName: 'Orbit GIF Exported',
                    metadata: {
                        location_name: config.location.name,
                        location_coords: config.location.center,
                        style_id: config.style.id,
                        style_name: config.style.name,
                        resolution: {
                            name: 'ORBIT_GIF',
                            width: map.getCanvas().width,
                            height: map.getCanvas().height,
                            dpi: 72
                        },
                        source: 'in-app',
                        render_time_ms: Date.now() - startTime,
                        options: { duration, totalRotation, fps }
                    }
                });

                // Keep modal open for a few seconds to ensure download starts
                setTimeout(() => {
                    setIsGeneratingGif(false);
                    isGeneratingGifRef.current = false;
                    setProgress(0);
                }, 2000);

                // Restore original state
                map.jumpTo({
                    bearing: originalBearing,
                    pitch: originalPitch,
                    center: originalCenter,
                    zoom: originalZoom
                });
            });

            gif.on('progress', (p) => {
                // Encoding progress (50-100% of total)
                setProgress(50 + Math.round(p * 50));
            });

            // Helper function to wait for map idle
            const waitForMapIdle = (): Promise<void> => {
                return new Promise((resolve) => {
                    let resolved = false;

                    // Safety timeout
                    const timeoutId = setTimeout(() => {
                        if (!resolved) {
                            resolved = true;
                            logger.warn('Map idle timeout - forcing capture');
                            map.off('idle', onIdle);
                            resolve();
                        }
                    }, 4000); // Increased timeout for safety

                    const onIdle = () => {
                        if (!resolved) {
                            resolved = true;
                            clearTimeout(timeoutId);
                            console.log('Map idle event fired'); // Direct console log to be sure
                            resolve();
                        }
                    };

                    map.once('idle', onIdle);
                });
            };

            // animation loop
            const totalFrames = Math.round(duration * fps);
            const anglePerFrame = totalRotation / totalFrames;
            const frameDelay = Math.round(1000 / fps); // ms per frame

            logger.info('Starting capture loop', { totalFrames, anglePerFrame });

            for (let i = 0; i < totalFrames; i++) {
                if (abortControllerRef.current?.signal.aborted) {
                    logger.warn('GIF generation aborted');
                    throw new Error('Aborted');
                }

                const targetBearing = originalBearing + (i * anglePerFrame);

                // Set up listener before triggering the change
                const idlePromise = waitForMapIdle();

                // Update bearing
                logger.info(`Setting bearing to ${targetBearing}`);
                map.setBearing(targetBearing);

                // Wait for the map to fully settle
                await idlePromise;

                // Extra safety wait for canvas buffer
                await new Promise(r => setTimeout(r, 100));

                const currentBearing = map.getBearing();
                logger.info(`Capturing frame ${i + 1}/${totalFrames}`, {
                    targetBearing,
                    currentBearing,
                    diff: Math.abs(currentBearing - targetBearing)
                });

                // Verify canvas content isn't empty (sanity check)
                const canvas = map.getCanvas();
                if (canvas.width === 0 || canvas.height === 0) {
                    logger.error('Canvas has 0 dimensions!');
                }

                // Add frame
                gif.addFrame(canvas, { delay: frameDelay, copy: true });

                // Update capture progress (0-50% of total)
                setProgress(Math.round((i / totalFrames) * 50));
            }

            logger.info('Capture complete, rendering GIF...');
            gif.render();

        } catch (error) {
            logger.error('Failed to generate GIF', error);
            setIsGeneratingGif(false);
            isGeneratingGifRef.current = false;
        }
    }, [mapRef, config]);

    return {
        isGeneratingGif,
        isGeneratingGifRef,
        generateOrbitGif,
        progress
    };
}
