'use client';

import { useState, useRef, useCallback } from 'react';
import type MapLibreGL from 'maplibre-gl';
import { logger } from '@/lib/logger';
import type { PosterConfig } from '@/types/poster';
import { trackEventAction } from '@/lib/actions/events';
import { getSessionId } from '@/lib/utils';
import * as Mp4Muxer from 'mp4-muxer';

export interface VideoExportOptions {
    duration: number; // seconds
    totalRotation: number; // degrees
    fps?: number;
    animationMode: 'orbit' | 'cinematic' | 'spiral' | 'zoomIn' | 'zoomOut' | 'rise' | 'dive' | 'flyover';
}

interface UseVideoExportReturn {
    isExportingVideo: boolean;
    isExportingVideoRef: React.MutableRefObject<boolean>;
    exportVideo: (options?: VideoExportOptions) => Promise<void>;
    progress: number;
    latestFrame: string | null;
}

const DEFAULT_VIDEO_OPTIONS: VideoExportOptions = {
    duration: 5,
    totalRotation: 360,
    fps: 60,
    animationMode: 'orbit',
};

export function useVideoExport(
    mapRef: React.MutableRefObject<MapLibreGL.Map | null>,
    config: PosterConfig
): UseVideoExportReturn {
    const [isExportingVideo, setIsExportingVideo] = useState(false);
    const isExportingVideoRef = useRef(false);
    const [progress, setProgress] = useState(0);
    const [latestFrame, setLatestFrame] = useState<string | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    const easeInOutCubic = (x: number): number => {
        return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
    };

    const exportVideo = useCallback(async (options?: VideoExportOptions) => {
        const { duration, totalRotation, fps = 60, animationMode } = { ...DEFAULT_VIDEO_OPTIONS, ...options };

        if (!mapRef.current) {
            logger.error('exportVideo: Map reference is null');
            return;
        }
        const map = mapRef.current;

        // Safety check
        if (isExportingVideoRef.current) {
            logger.warn('exportVideo: Already exporting video');
            return;
        }

        logger.info('Starting Video generation (WebCodecs Mode)...');
        const startTime = Date.now();
        const sessionId = getSessionId();

        // Track export start
        await trackEventAction({
            eventType: 'export_start',
            eventName: 'video_export_started',
            sessionId,
            metadata: {
                animationMode,
                duration,
                fps,
                location_name: config.location.name
            }
        });

        setIsExportingVideo(true);
        isExportingVideoRef.current = true;
        setProgress(0);
        abortControllerRef.current = new AbortController();

        let originalBearing = 0;
        let originalPitch = 0;
        let originalCenter = map.getCenter();
        let originalZoom = map.getZoom();

        try {
            originalBearing = map.getBearing();
            originalPitch = map.getPitch();

            const canvas = map.getCanvas();
            const width = canvas.width;
            const height = canvas.height;
            // Ensure even dimensions for encoding
            const evenWidth = width % 2 === 0 ? width : width - 1;
            const evenHeight = height % 2 === 0 ? height : height - 1;

            const totalFrames = Math.round(duration * fps);

            // Setup Muxer
            const muxer = new Mp4Muxer.Muxer({
                target: new Mp4Muxer.ArrayBufferTarget(),
                video: {
                    codec: 'avc', // H.264
                    width: evenWidth,
                    height: evenHeight,
                },
                fastStart: 'in-memory',
            });

            // Setup VideoEncoder
            const videoEncoder = new VideoEncoder({
                output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
                error: (e) => {
                    logger.error('VideoEncoder error:', e);
                    throw e;
                },
            });

            videoEncoder.configure({
                codec: 'avc1.4d0033', // Main Profile Level 5.1 (supports up to 4K / 4096x2304)
                width: evenWidth,
                height: evenHeight,
                bitrate: 12_000_000, // 12 Mbps
                framerate: fps,
            });

            const startPitch = animationMode === 'cinematic' ? 0 : originalPitch;
            const targetPitch = animationMode === 'cinematic' ? Math.max(60, originalPitch) : originalPitch;
            const startZoom = originalZoom;
            const zoomPullback = animationMode === 'cinematic' ? 0.5 : 0;

            logger.info(`Starting capture of ${totalFrames} frames`);

            // Helper to determine when map is fully loaded
            const waitForMapIdle = (): Promise<void> => {
                return new Promise((resolve) => {
                    let resolved = false;
                    const timeoutId = setTimeout(() => {
                        if (!resolved) {
                            resolved = true;
                            map.off('idle', onIdle);
                            resolve();
                        }
                    }, 4000); // Timeout safety

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

            for (let i = 0; i < totalFrames; i++) {
                if (abortControllerRef.current?.signal.aborted) throw new Error('Aborted');

                const p = i / (totalFrames - 1 || 1);

                let currentTargetBearing = originalBearing;
                let currentTargetPitch = originalPitch;
                let currentTargetZoom = originalZoom;
                let currentTargetCenter = originalCenter;

                switch (animationMode) {
                    case 'orbit':
                        currentTargetBearing = originalBearing + (p * totalRotation);
                        break;
                    case 'cinematic':
                        currentTargetBearing = originalBearing + (p * (totalRotation / 4));
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
                        break;
                    case 'spiral':
                        currentTargetBearing = originalBearing + (p * totalRotation);
                        currentTargetZoom = originalZoom - (2 * p);
                        break;
                    case 'zoomIn':
                        currentTargetZoom = originalZoom + (2 * p);
                        break;
                    case 'zoomOut':
                        currentTargetZoom = originalZoom - (2 * p);
                        break;
                    case 'rise':
                        currentTargetPitch = originalPitch + (60 - originalPitch) * p;
                        break;
                    case 'dive':
                        currentTargetPitch = originalPitch + (0 - originalPitch) * p;
                        break;
                    case 'flyover':
                        const moveAmount = (500 / Math.pow(2, originalZoom)) * p;
                        const rad = (originalBearing * Math.PI) / 180;
                        const dLng = Math.sin(rad) * moveAmount;
                        const dLat = Math.cos(rad) * moveAmount;
                        currentTargetCenter = {
                            lng: originalCenter.lng + dLng,
                            lat: originalCenter.lat + dLat,
                        } as any; // Cast because maplibre center might be LngLat object vs {lng, lat}
                        break;
                }

                // Update map
                map.jumpTo({
                    bearing: currentTargetBearing,
                    pitch: currentTargetPitch,
                    zoom: currentTargetZoom,
                    center: currentTargetCenter,
                });

                // Wait for idle
                await waitForMapIdle();

                // Small buffer to ensure paint is done
                await new Promise(r => requestAnimationFrame(r));

                // Capture Frame immediately
                // We create a bitmap instead of blob to keep it on GPU/fast path
                const bitmap = await createImageBitmap(canvas, {
                    resizeWidth: evenWidth,
                    resizeHeight: evenHeight,
                    resizeQuality: 'high'
                });

                // Create VideoFrame
                // Timestamp in microseconds
                const timestamp = (i / fps) * 1_000_000;
                const frame = new VideoFrame(bitmap, { timestamp });

                // Encode immediately
                // This is key: we don't store the frame, we push it to encoder and drop it
                videoEncoder.encode(frame, { keyFrame: i % (fps * 2) === 0 });

                // Cleanup immediately
                frame.close();
                bitmap.close();

                // Capture latest frame for preview (every 10th frame)
                if (i % 10 === 0) {
                    setLatestFrame(canvas.toDataURL('image/jpeg', 0.5));
                }

                // Update Progress (0-100%)
                setProgress(Math.round((i / totalFrames) * 100));
            }

            // Finish encoding
            await videoEncoder.flush();
            muxer.finalize();

            const { buffer } = muxer.target;
            const blob = new Blob([buffer], { type: 'video/mp4' });

            // Save File
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `orbit-video-${Date.now()}.mp4`;
            link.click();
            URL.revokeObjectURL(url);

            logger.info('Video export complete');
            setProgress(100);

            // Track export event
            await trackEventAction({
                eventType: 'poster_export',
                eventName: 'Orbit Video Exported',
                sessionId: getSessionId(),
                metadata: {
                    location_name: config.location.name,
                    location_coords: config.location.center,
                    style_id: config.style.id,
                    style_name: config.style.name,
                    resolution: {
                        name: 'ORBIT_VIDEO',
                        width: evenWidth,
                        height: evenHeight,
                        dpi: 72
                    },
                    source: 'in-app',
                    render_time_ms: Date.now() - startTime,
                    options: { duration, totalRotation, fps }
                }
            });

            // Cleanup
            setTimeout(() => {
                setIsExportingVideo(false);
                isExportingVideoRef.current = false;
                setProgress(0);
                setLatestFrame(null);
            }, 2000);

            // Restore state
            map.jumpTo({
                bearing: originalBearing,
                pitch: originalPitch,
                center: originalCenter,
                zoom: originalZoom
            });

        } catch (error) {
            // Track export failure
            await trackEventAction({
                eventType: 'export_fail',
                eventName: 'video_export_failed',
                sessionId,
                metadata: {
                    animationMode,
                    error: error instanceof Error ? error.message : 'Unknown error',
                    duration_ms: Date.now() - startTime
                }
            });
            logger.error('Failed to export video', error);
            setIsExportingVideo(false);
            isExportingVideoRef.current = false;
            try {
                map.jumpTo({
                    bearing: originalBearing,
                    pitch: originalPitch,
                    center: originalCenter,
                    zoom: originalZoom
                });
            } catch (e) {
                console.error('Error restoring map state', e);
            }
        }
    }, [mapRef, config]);

    return {
        isExportingVideo,
        isExportingVideoRef,
        exportVideo,
        progress,
        latestFrame
    };
}

