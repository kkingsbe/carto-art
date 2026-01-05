'use client';

import { useState, useRef, useCallback } from 'react';
import type MapLibreGL from 'maplibre-gl';
import { logger } from '@/lib/logger';

export interface VideoExportOptions {
    duration: number; // seconds
    totalRotation: number; // degrees
    fps?: number;
}

interface UseVideoExportReturn {
    isExportingVideo: boolean;
    isExportingVideoRef: React.MutableRefObject<boolean>;
    exportVideo: (options?: VideoExportOptions) => Promise<void>;
    progress: number;
}

const DEFAULT_VIDEO_OPTIONS: VideoExportOptions = {
    duration: 5,
    totalRotation: 360,
    fps: 60,
};

export function useVideoExport(
    mapRef: React.MutableRefObject<MapLibreGL.Map | null>
): UseVideoExportReturn {
    const [isExportingVideo, setIsExportingVideo] = useState(false);
    const isExportingVideoRef = useRef(false);
    const [progress, setProgress] = useState(0);
    const abortControllerRef = useRef<AbortController | null>(null);

    const exportVideo = useCallback(async (options?: VideoExportOptions) => {
        const { duration, totalRotation, fps = 60 } = { ...DEFAULT_VIDEO_OPTIONS, ...options };

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

        logger.info('Starting Video generation (Frame Buffer Mode)...');
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

            const frames: Blob[] = [];
            const canvas = map.getCanvas();
            const totalFrames = Math.round(duration * fps);
            const anglePerFrame = totalRotation / totalFrames;

            // Phase 1: Capture Frames
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

                const targetBearing = originalBearing + (i * anglePerFrame);

                // Set bearing and wait for idle
                const idlePromise = waitForMapIdle();
                map.setBearing(targetBearing);
                await idlePromise;

                // Extra safety wait for simple rendering
                await new Promise(r => setTimeout(r, 50));

                // Capture Frame
                const blob = await new Promise<Blob | null>(resolve =>
                    canvas.toBlob(resolve, 'image/jpeg', 0.95)
                );

                if (blob) {
                    frames.push(blob);
                } else {
                    logger.error(`Failed to capture frame ${i}`);
                }

                // Update Progress (0-50%)
                setProgress(Math.round((i / totalFrames) * 50));
            }

            logger.info(`Captured ${frames.length} frames. Starting encoding...`);

            // Phase 2: Encode Video from Buffer
            const playbackCanvas = document.createElement('canvas');
            playbackCanvas.width = canvas.width;
            playbackCanvas.height = canvas.height;
            const ctx = playbackCanvas.getContext('2d');

            if (!ctx) throw new Error('Failed to create playback context');

            // Find supported mime type
            const mimeTypes = [
                'video/webm;codecs=vp9',
                'video/webm;codecs=vp8',
                'video/webm',
                'video/mp4'
            ];
            const selectedMimeType = mimeTypes.find(type => MediaRecorder.isTypeSupported(type));
            if (!selectedMimeType) throw new Error('No supported video mime type');

            const stream = playbackCanvas.captureStream(fps);
            const recorder = new MediaRecorder(stream, {
                mimeType: selectedMimeType,
                videoBitsPerSecond: 12000000 // 12 Mbps
            });

            const chunks: Blob[] = [];
            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunks.push(e.data);
            };

            const recordingComplete = new Promise<void>((resolve) => {
                recorder.onstop = () => {
                    resolve();
                };
            });

            recorder.start();

            // Playback Loop
            const frameInterval = 1000 / fps;

            // We use a recursive timeout loop to feed frames to the recorder
            // behaving like a real-time source.
            for (let i = 0; i < frames.length; i++) {
                if (abortControllerRef.current?.signal.aborted) {
                    recorder.stop();
                    throw new Error('Aborted');
                }

                // Create ImageBitmap for fast drawing
                const bitmap = await createImageBitmap(frames[i]);
                ctx.drawImage(bitmap, 0, 0);
                bitmap.close();

                // Update Progress (50-100%)
                setProgress(50 + Math.round((i / frames.length) * 50));

                // Wait for one frame duration to simulate real-time playback
                await new Promise(resolve => setTimeout(resolve, frameInterval));
            }

            recorder.stop();
            await recordingComplete;

            // Save File
            const blob = new Blob(chunks, { type: selectedMimeType });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            const ext = selectedMimeType.includes('mp4') ? 'mp4' : 'webm';
            link.download = `orbit-video-${Date.now()}.${ext}`;
            link.click();
            URL.revokeObjectURL(url);

            logger.info('Video export complete');
            setProgress(100);

            // Cleanup
            playbackCanvas.remove();

            setTimeout(() => {
                setIsExportingVideo(false);
                isExportingVideoRef.current = false;
                setProgress(0);
            }, 2000);

            // Restore state
            map.jumpTo({
                bearing: originalBearing,
                pitch: originalPitch,
                center: originalCenter,
                zoom: originalZoom
            });

        } catch (error) {
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
    }, [mapRef]);

    return {
        isExportingVideo,
        isExportingVideoRef,
        exportVideo,
        progress
    };
}
