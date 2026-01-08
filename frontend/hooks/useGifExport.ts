'use client';

import { useState, useRef, useCallback } from 'react';
import type MapLibreGL from 'maplibre-gl';
import { logger } from '@/lib/logger';
import GIF from 'gif.js';
import type { PosterConfig } from '@/types/poster';
import { trackEventAction } from '@/lib/actions/events';
import { getSessionId } from '@/lib/utils';

export interface GifExportOptions {
    duration: number; // seconds
    totalRotation: number; // degrees
    fps: number; // frames per second
    animationMode: 'orbit' | 'cinematic';
}

interface UseGifExportReturn {
    isGeneratingGif: boolean;
    isGeneratingGifRef: React.MutableRefObject<boolean>;
    generateOrbitGif: (options?: GifExportOptions) => Promise<void>;
    progress: number;
    latestFrame: string | null;
}

const DEFAULT_GIF_OPTIONS: GifExportOptions = {
    duration: 7,
    totalRotation: 90,
    fps: 20,
    animationMode: 'orbit',
};

export function useGifExport(
    mapRef: React.MutableRefObject<MapLibreGL.Map | null>,
    config: PosterConfig
): UseGifExportReturn {
    const [isGeneratingGif, setIsGeneratingGif] = useState(false);
    const isGeneratingGifRef = useRef(false);
    const [progress, setProgress] = useState(0);
    const [latestFrame, setLatestFrame] = useState<string | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    const easeInOutCubic = (x: number): number => {
        return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
    };

    const generateOrbitGif = useCallback(async (options?: GifExportOptions) => {
        const { duration, totalRotation, fps, animationMode } = { ...DEFAULT_GIF_OPTIONS, ...options };
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
        const sessionId = getSessionId();

        // Track export start
        await trackEventAction({
            eventType: 'export_start',
            eventName: 'gif_export_started',
            sessionId,
            metadata: {
                animationMode,
                duration,
                fps,
                location_name: config.location.name
            }
        });

        setIsGeneratingGif(true);
        isGeneratingGifRef.current = true;
        setProgress(0);
        abortControllerRef.current = new AbortController();

        try {
            const originalBearing = map.getBearing();
            const originalPitch = map.getPitch();
            const originalCenter = map.getCenter();
            const originalZoom = map.getZoom();

            const startPitch = animationMode === 'cinematic' ? 0 : originalPitch;
            const targetPitch = animationMode === 'cinematic' ? Math.max(60, originalPitch) : originalPitch;
            const startZoom = originalZoom;
            const zoomPullback = animationMode === 'cinematic' ? 0.5 : 0;

            logger.info('Initial map state', { originalBearing, originalPitch, originalCenter, originalZoom, animationMode });

            const gif = new GIF({
                workers: 4, // Increased workers
                quality: 10,
                width: map.getCanvas().width,
                height: map.getCanvas().height,
                workerScript: '/gif.worker.js',
                background: '#000000', // Ensure black background for transparency edge-cases
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
                    sessionId: getSessionId(),
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
                    setLatestFrame(null);
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
                            // logger.warn('Map idle timeout - forcing capture');
                            map.off('idle', onIdle);
                            resolve();
                        }
                    }, 2000); // Reduced timeout for speed

                    const onIdle = () => {
                        if (!resolved) {
                            resolved = true;
                            clearTimeout(timeoutId);
                            resolve();
                        }
                    };

                    map.once('idle', onIdle);
                });
            };

            // capture loop configuration
            const totalFrames = Math.round(duration * fps);
            const frameDelay = Math.round(1000 / fps); // ms per frame

            logger.info('Starting capture loop', { totalFrames, animationMode });

            for (let i = 0; i < totalFrames; i++) {
                if (abortControllerRef.current?.signal.aborted) {
                    logger.warn('GIF generation aborted');
                    throw new Error('Aborted');
                }

                const p = i / (totalFrames - 1 || 1);
                const targetBearing = originalBearing + (p * totalRotation);
                let currentTargetPitch = startPitch;
                let currentTargetZoom = startZoom;

                if (animationMode === 'cinematic') {
                    if (p < 0.2) {
                        const t = easeInOutCubic(p / 0.2);
                        currentTargetPitch = startPitch + (targetPitch - startPitch) * t;
                        currentTargetZoom = startZoom - (zoomPullback * t);
                    } else if (p < 0.8) {
                        currentTargetPitch = targetPitch;
                        currentTargetZoom = startZoom - zoomPullback;
                    } else {
                        const t = easeInOutCubic((p - 0.8) / 0.2);
                        currentTargetPitch = targetPitch - (targetPitch - startPitch) * t;
                        currentTargetZoom = (startZoom - zoomPullback) + (zoomPullback * t);
                    }
                }

                // Update map state
                map.jumpTo({
                    bearing: targetBearing,
                    pitch: currentTargetPitch,
                    zoom: currentTargetZoom,
                });

                // Wait for idle
                await waitForMapIdle();

                // Use requestAnimationFrame for tightly coupled render-capture
                await new Promise(r => requestAnimationFrame(r));

                const canvas = map.getCanvas();

                // Add frame
                // We pass copy: true so gif.js copies pixel data immediately
                gif.addFrame(canvas, { delay: frameDelay, copy: true });

                // Capture latest frame for preview (every 5th frame to reduce overhead)
                if (i % 5 === 0) {
                    setLatestFrame(canvas.toDataURL('image/jpeg', 0.5));
                }

                // Update capture progress (0-50% of total)
                setProgress(Math.round((i / totalFrames) * 50));
            }

            logger.info('Capture complete, rendering GIF...');
            gif.render();

        } catch (error) {
            // Track export failure
            await trackEventAction({
                eventType: 'export_fail',
                eventName: 'gif_export_failed',
                sessionId,
                metadata: {
                    animationMode,
                    error: error instanceof Error ? error.message : 'Unknown error',
                    duration_ms: Date.now() - startTime
                }
            });
            logger.error('Failed to generate GIF', error);
            setIsGeneratingGif(false);
            isGeneratingGifRef.current = false;
        }
    }, [mapRef, config]);

    return {
        isGeneratingGif,
        isGeneratingGifRef,
        generateOrbitGif,
        progress,
        latestFrame
    };
}
