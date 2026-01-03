'use client';

import { Suspense, useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { MapPreview } from '@/components/map/MapPreview';
import { TextOverlay } from '@/components/map/TextOverlay';
import { getStyleById } from '@/lib/styles';
import { applyPaletteToStyle } from '@/lib/styles/applyPalette';
import { PosterConfig } from '@/types/poster';
import { DEFAULT_CONFIG } from '@/lib/config/defaults';
import { Loader2 } from 'lucide-react';

// Extend window object to allow config injection
declare global {
    interface Window {
        renderPoster: (config: Partial<PosterConfig>) => void;
        posterConfig?: Partial<PosterConfig>;
    }
}

/**
 * Merges a partial config with defaults to create a complete PosterConfig.
 * This ensures the renderer doesn't crash when receiving incomplete API payloads.
 */
function mergeWithDefaults(partial: Partial<PosterConfig>): PosterConfig {
    return {
        ...DEFAULT_CONFIG,
        ...partial,
        location: { ...DEFAULT_CONFIG.location, ...partial.location },
        style: partial.style || DEFAULT_CONFIG.style,
        palette: { ...DEFAULT_CONFIG.palette, ...partial.palette },
        typography: { ...DEFAULT_CONFIG.typography, ...partial.typography },
        format: { ...DEFAULT_CONFIG.format, ...partial.format },
        layers: { ...DEFAULT_CONFIG.layers, ...partial.layers },
    };
}

function RendererContent() {
    const searchParams = useSearchParams();
    const [config, setConfig] = useState<PosterConfig | null>(null);
    const [isMapIdle, setIsMapIdle] = useState(false);
    const [fontsLoaded, setFontsLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);

    // 1. Listen for config injection
    useEffect(() => {
        // Check if config is already available (injected before hydration)
        if (window.posterConfig) {
            setConfig(mergeWithDefaults(window.posterConfig));
        }

        // Expose render function for Puppeteer
        window.renderPoster = (newConfig: Partial<PosterConfig>) => {
            console.log('Received config for rendering', newConfig);
            console.log('Setting config state...');
            setConfig(mergeWithDefaults(newConfig));
        };

        // Fallback: Check query param (useful for debugging)
        const encodedConfig = searchParams.get('config');
        if (encodedConfig && !config) {
            try {
                const parsed = JSON.parse(decodeURIComponent(encodedConfig));
                setConfig(mergeWithDefaults(parsed));
            } catch (e) {
                console.error('Failed to parse config from URL', e);
                setHasError(true);
            }
        }
    }, [searchParams]);


    // 2. Load Fonts
    useEffect(() => {
        if (!config) return;

        const loadFonts = async () => {
            try {
                // Construct font strings compatible with FontFace or Google Fonts loading
                // For now, assuming standard Google Fonts are available or added to layout

                // Wait a bit to ensure fonts are applied
                await document.fonts.ready;
                setFontsLoaded(true);
            } catch (e) {
                console.error('Font loading error', e);
                // Continue anyway, don't block render
                setFontsLoaded(true);
            }
        };

        loadFonts();
    }, [config]);

    useEffect(() => {
        console.log(`[RendererState] Fonts loaded: ${fontsLoaded}`);
    }, [fontsLoaded]);

    useEffect(() => {
        console.log(`[RendererState] Map idle: ${isMapIdle}`);
    }, [isMapIdle]);

    // 3. Compute Map Style
    const mapStyle = useMemo(() => {
        if (!config) return null;

        const baseStyle = getStyleById(config.style.id as string);
        if (!baseStyle) return null;

        // Apply palette and layer toggles
        // Note: This needs to match the logic in the main editor
        return applyPaletteToStyle(baseStyle.mapStyle, config.palette, config.layers);
    }, [config]);

    useEffect(() => {
        if (config && mapStyle) {
            console.log('[RendererState] Config and MapStyle ready, rendering MapPreview');
        }
    }, [config, mapStyle]);

    // 4. Handle Map Events
    const handleMapLoad = (map: any) => {
        console.log('Map loaded');
        // MapPreview handles idle internally, but we can hook into map.once('idle') here too if we have access
        // But MapPreview doesn't expose the map instance via prop except on Load.

        map.once('idle', () => {
            console.log('Map idle');
            setIsMapIdle(true);
        });
    };

    // 5. Render
    if (hasError) return <div id="render-error">Configuration Error</div>;
    if (!config || !mapStyle) return <div className="flex items-center justify-center h-screen"><Loader2 className="animate-spin" /></div>;

    // Calculate dimensions based on aspect ratio
    // For the renderer, we want to fill the viewport, and Puppeteer will set the viewport size to match the target resolution

    return (
        <div
            className="relative w-screen h-screen overflow-hidden bg-white"
            style={{ backgroundColor: config.palette.background }}
        >
            {/* Map Layer */}
            <div className="absolute inset-0 z-0">
                <MapPreview
                    mapStyle={mapStyle}
                    location={config.location}
                    format={config.format}
                    showMarker={config.layers.marker}
                    markerColor={config.layers.markerColor || config.palette.text}
                    layers={config.layers}
                    onMapLoad={handleMapLoad}
                />
            </div>

            {/* Text Overlay */}
            <TextOverlay config={config} />

            {/* Completion Signal for Puppeteer */}
            {isMapIdle && fontsLoaded && (
                <div id="render-complete" style={{ display: 'none' }} />
            )}
        </div>
    );
}

export default function RendererPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center h-screen"><Loader2 className="animate-spin" /></div>}>
            <RendererContent />
        </Suspense>
    );
}
