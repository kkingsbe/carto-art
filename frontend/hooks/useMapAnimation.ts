import { useRef, useCallback, useState, useEffect } from 'react';
import type MapLibreGL from 'maplibre-gl';
import { logger } from '@/lib/logger';

export interface AnimationOptions {
    duration: number; // seconds
    totalRotation?: number; // degrees (for orbit)
    fps?: number; // usually 60 for preview
}

export type AnimationType = 'orbit' | 'cinematic' | 'spiral' | 'swoopIn' | 'rocketOut' | 'rise' | 'dive' | 'flyover';

interface UseMapAnimationReturn {
    isPlaying: boolean;
    activeAnimation: AnimationType | null;
    playAnimation: (type: AnimationType, options?: AnimationOptions) => void;
    stopAnimation: () => void;
}

const DEFAULT_OPTIONS: AnimationOptions = {
    duration: 10,
    totalRotation: 360,
    fps: 60,
};

export function useMapAnimation(
    mapRef: React.MutableRefObject<MapLibreGL.Map | null>
): UseMapAnimationReturn {
    const [isPlaying, setIsPlaying] = useState(false);
    const [activeAnimation, setActiveAnimation] = useState<AnimationType | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const startTimeRef = useRef<number | null>(null);
    const initialLocationRef = useRef<{
        center: { lng: number; lat: number };
        zoom: number;
        pitch: number;
        bearing: number;
    } | null>(null);

    const easeInOutCubic = (x: number): number => {
        return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
    };

    const stopAnimation = useCallback(() => {
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }
        setIsPlaying(false);
        setActiveAnimation(null);
        startTimeRef.current = null;

        // Restore initial state if we have it? 
        // For previews, it might be better to leave the user where they ended up, 
        // OR provide a specific "stop and restore" vs "pause/stop" behavior.
        // For now, let's NOT restore automatically on stop, letting the user explore from the new angle.
        // BUT, for repeated previews, starting from the same spot is nice. 
        // Let's decide to restore only if it was a "cancel" action? 
        // Actually, for "Cinema" automations, usually you want to see it, then maybe tweak.
        // Let's keep it simple: Stop just stops the loop.
    }, []);

    const playAnimation = useCallback((type: AnimationType, options?: AnimationOptions) => {
        const map = mapRef.current;
        if (!map) return;

        // Stop any existing animation
        stopAnimation();

        const opts = { ...DEFAULT_OPTIONS, ...options };
        const durationMs = opts.duration * 1000;

        // Capture initial state
        initialLocationRef.current = {
            center: map.getCenter(),
            zoom: map.getZoom(),
            pitch: map.getPitch(),
            bearing: map.getBearing(),
        };

        const originalBearing = initialLocationRef.current.bearing;
        const originalPitch = initialLocationRef.current.pitch;
        const originalZoom = initialLocationRef.current.zoom;

        // Cinematic specific params
        const startPitch = type === 'cinematic' ? 0 : originalPitch;
        // Ensure start pitch is set if cinematic
        if (type === 'cinematic') {
            map.jumpTo({ pitch: 0 });
        }

        const targetPitch = type === 'cinematic' ? Math.max(60, originalPitch) : originalPitch;
        const startZoom = originalZoom;
        const zoomPullback = type === 'cinematic' ? 0.5 : 0;
        const totalRotation = opts.totalRotation || 360;

        setIsPlaying(true);
        setActiveAnimation(type);
        startTimeRef.current = Date.now();

        const animate = () => {
            const now = Date.now();
            const elapsed = now - (startTimeRef.current || now);
            const p = Math.min(elapsed / durationMs, 1);

            if (p >= 1) {
                stopAnimation();
                return;
            }

            // Calculate new state
            let targetBearing = originalBearing;
            let currentTargetPitch = originalPitch;
            let currentTargetZoom = originalZoom;
            let currentTargetCenter = initialLocationRef.current!.center; // Use stored center

            switch (type) {
                case 'orbit':
                    targetBearing = originalBearing + (p * totalRotation);
                    break;
                case 'cinematic':
                    targetBearing = originalBearing + (p * (totalRotation / 4));
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
                    targetBearing = originalBearing + (p * totalRotation);
                    currentTargetZoom = originalZoom - (2 * p);
                    break;
                case 'swoopIn':
                    // Spiral Down + Pitch Up (The "Landing")
                    // Zoom: +4 (Zoom In significantly)
                    // Pitch: -> 60 (Look across the landscape)
                    // Rotation: 180 deg
                    const swoopProgress = easeInOutCubic(p);
                    targetBearing = originalBearing + (swoopProgress * 180);
                    currentTargetZoom = originalZoom + (4 * swoopProgress);
                    currentTargetPitch = originalPitch + ((60 - originalPitch) * swoopProgress);
                    break;
                case 'rocketOut':
                    // Spiral Up + Pitch Down (The "Launch")
                    // Zoom: -4 (Zoom Out significantly)
                    // Pitch: -> 0 (Look down)
                    // Rotation: -180 deg
                    const rocketProgress = easeInOutCubic(p);
                    targetBearing = originalBearing - (rocketProgress * 180);
                    currentTargetZoom = originalZoom - (4 * rocketProgress);
                    currentTargetPitch = originalPitch + ((0 - originalPitch) * rocketProgress);
                    break;
                case 'rise':
                    // Pitch from current (or 0) to 60
                    // If we want a strict 0->60, we should have set startPitch=0 in init.
                    // But for simple "rise", just interpolating to 60 is fine.
                    // Let's assume user sets view, then hits Rise. expected: pitch goes up.
                    currentTargetPitch = originalPitch + (60 - originalPitch) * p;
                    break;
                case 'dive':
                    // Pitch from current to 0
                    currentTargetPitch = originalPitch + (0 - originalPitch) * p;
                    break;
                case 'flyover':
                    // Move center forward based on bearing
                    // 1 screen height approx?
                    // Rough approximation: delta = speed / 2^zoom
                    // Let's try a fixed screen-relative movement
                    const speedFactor = 0.0005 * Math.pow(2, 20 - originalZoom); // Adjust speed based on zoom
                    // This is very rough. 
                    // Let's look at how much we want to move.
                    // Move 10% of the world at zoom 0?
                    // At zoom 0, 360 deg.
                    // At zoom 20, very small.
                    // Let's use a simpler heuristic for now: 
                    // Move forward by (1.0 / 2^zoom) * some_constant * p
                    const moveAmount = (500 / Math.pow(2, originalZoom)) * p;
                    // 500 is arbitrary "world units" or similar scaling

                    // Convert bearing to radians
                    const rad = (originalBearing * Math.PI) / 180;
                    const dLng = Math.sin(rad) * moveAmount;
                    const dLat = Math.cos(rad) * moveAmount;

                    currentTargetCenter = {
                        lng: initialLocationRef.current!.center.lng + dLng,
                        lat: initialLocationRef.current!.center.lat + dLat,
                    };
                    break;
            }

            map.jumpTo({
                bearing: targetBearing,
                pitch: currentTargetPitch,
                zoom: currentTargetZoom,
                center: currentTargetCenter,
            });

            animationFrameRef.current = requestAnimationFrame(animate);
        };

        animationFrameRef.current = requestAnimationFrame(animate);

    }, [mapRef, stopAnimation]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, []);

    return {
        isPlaying,
        activeAnimation,
        playAnimation,
        stopAnimation
    };
}
