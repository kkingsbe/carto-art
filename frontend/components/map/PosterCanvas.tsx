'use client';

import { useMemo } from 'react';
import type { PosterConfig } from '@/types/poster';
import { TextOverlay } from '@/components/map/TextOverlay';
import { CompassRose } from '@/components/map/CompassRose';
import { getAspectRatioCSS } from '@/lib/styles/dimensions';
import { cn } from '@/lib/utils';

interface PosterCanvasProps {
    config: PosterConfig;
    children: React.ReactNode; // The MapPreview component or similar
    className?: string;
    style?: React.CSSProperties;
    showCompass?: boolean; // Override to strictly show/hide if needed, defaults to config
}

export function PosterCanvas({ config, children, className, style, showCompass }: PosterCanvasProps) {
    const { format, palette } = config;

    return (
        <div
            className={cn(
                "relative shadow-2xl bg-white flex flex-col transition-all duration-300 ease-out ring-1 ring-black/5",
                className
            )}
            style={{
                aspectRatio: getAspectRatioCSS(format.aspectRatio, format.orientation),
                backgroundColor: palette.background,
                containerType: 'size',
                ...style
            }}
        >
            {/* The masked map area */}
            <div
                className="absolute overflow-hidden min-h-0 min-w-0"
                style={{
                    top: `${format.margin}cqw`,
                    left: `${format.margin}cqw`,
                    right: `${format.margin}cqw`,
                    bottom: `${format.margin}cqw`,
                    borderRadius: (format.maskShape || 'rectangular') === 'circular' ? '50%' : '0',
                }}
            >
                {children}
            </div>

            {/* Text Overlay */}
            <TextOverlay config={config} />

            {/* Border Overlay */}
            {format.borderStyle !== 'none' && (
                <div
                    className="absolute pointer-events-none z-30"
                    style={{
                        top: `${format.margin}cqw`,
                        left: `${format.margin}cqw`,
                        right: `${format.margin}cqw`,
                        bottom: `${format.margin}cqw`,
                        padding: format.borderStyle === 'inset' ? '2cqw' : '0',
                    }}
                >
                    <div
                        className="w-full h-full"
                        style={{
                            border: `${format.borderStyle === 'thick' ? '1.5cqw' : '0.5cqw'} solid ${palette.accent || palette.text}`,
                            borderRadius: (format.maskShape || 'rectangular') === 'circular' ? '50%' : '0',
                        }}
                    />

                    {/* Compass Rose Preview */}
                    <CompassRose format={format} palette={palette} />
                </div>
            )}
        </div>
    );
}
