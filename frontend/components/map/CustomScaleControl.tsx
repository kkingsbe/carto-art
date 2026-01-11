'use client';

import { useEffect, useState } from 'react';
import { useMap } from 'react-map-gl/maplibre';

const SCALE_MAX_WIDTH = 100; // px

const getDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371000; // Radius of the earth in m
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lng2 - lng1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c;
    return d;
};

interface CustomScaleControlProps {
    className?: string;
}

export function CustomScaleControl({ className }: CustomScaleControlProps) {
    const { current: map } = useMap();
    const [scale, setScale] = useState<{ width: number; text: string } | null>(null);

    useEffect(() => {
        if (!map) return;

        const updateScale = () => {
            const container = map.getContainer();
            if (!container) return;

            const y = container.clientHeight / 2;

            // Calculate distance for SCALE_MAX_WIDTH pixels at center latitude
            const p1 = map.unproject([0, y]);
            const p2 = map.unproject([SCALE_MAX_WIDTH, y]);

            const dist = getDistance(p1.lat, p1.lng, p2.lat, p2.lng);

            if (dist === 0) return;

            const maxDistance = dist;
            const distanceMagnitude = Math.pow(10, Math.floor(Math.log10(maxDistance)));
            const d = maxDistance / distanceMagnitude;

            let suffix = 'm';

            let niceDistance = 1 * distanceMagnitude;
            if (d >= 10) niceDistance = 10 * distanceMagnitude;
            else if (d >= 5) niceDistance = 5 * distanceMagnitude;
            else if (d >= 2) niceDistance = 2 * distanceMagnitude;
            else niceDistance = 1 * distanceMagnitude;

            let displayDistance = niceDistance;
            if (displayDistance >= 1000) {
                displayDistance /= 1000;
                suffix = 'km';
            }

            const width = (niceDistance / maxDistance) * SCALE_MAX_WIDTH;

            setScale({
                width,
                text: `${Math.round(displayDistance)} ${suffix}`
            });
        };

        updateScale();
        map.on('move', updateScale);
        map.on('zoom', updateScale);
        map.on('resize', updateScale);

        return () => {
            map.off('move', updateScale);
            map.off('zoom', updateScale);
            map.off('resize', updateScale);
        };
    }, [map]);

    if (!scale) return null;

    return (
        <div
            className={`absolute top-14 left-4 z-20 flex flex-col items-start pointer-events-none fade-in slide-in-from-top-2 duration-300 ${className || ''}`}
            style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
        >
            <div
                className="text-xs font-semibold text-white/90 mb-1 font-mono tracking-wider ml-0.5"
            >
                {scale.text}
            </div>
            <div
                className="h-2 flex items-end transition-all duration-300 ease-out relative"
                style={{ width: scale.width }}
            >
                {/* Left Ticker */}
                <div className="absolute left-0 bottom-0 w-[1px] h-2 bg-white/90 shadow-sm" />

                {/* Main Bar */}
                <div className="absolute bottom-0 h-[2px] w-full bg-white/80 shadow-sm" />

                {/* Right Ticker */}
                <div className="absolute right-0 bottom-0 w-[1px] h-2 bg-white/90 shadow-sm" />
            </div>
        </div>
    );
}
