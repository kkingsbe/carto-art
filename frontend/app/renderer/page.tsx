'use client';

import { Suspense, useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { MapPreview } from '@/components/map/MapPreview';
import { TextOverlay } from '@/components/map/TextOverlay';
import { getStyleById, styles } from '@/lib/styles';
import { applyPaletteToStyle } from '@/lib/styles/applyPalette';
import { PosterConfig } from '@/types/poster';
import { DEFAULT_CONFIG } from '@/lib/config/defaults';
import { Loader2 } from 'lucide-react';
import { exportMapToPNG } from '@/lib/export/exportCanvas';
import type MapLibreGL from 'maplibre-gl';

// Extend window object to allow config injection
declare global {
    interface Window {
        renderPoster: (config: Partial<PosterConfig>) => void;
        generatePosterImage: (resolution: { width: number; height: number; dpi: number; name: string }) => Promise<string>;
        posterConfig?: Partial<PosterConfig>;
    }
}

/**
 * Merges a partial config with defaults to create a complete PosterConfig.
 * This ensures the renderer doesn't crash when receiving incomplete API payloads.
 */
function mergeWithDefaults(partial: Partial<PosterConfig>): PosterConfig {
    console.log('[RendererState] Merging partial config with defaults', {
        hasStyle: !!partial.style,
        styleId: partial.style?.id,
        hasPalette: !!partial.palette,
        paletteId: partial.palette?.id
    });

    const merged = {
        ...DEFAULT_CONFIG,
        ...partial,
        location: { ...DEFAULT_CONFIG.location, ...partial.location },
        style: partial.style ? { ...DEFAULT_CONFIG.style, ...partial.style } : DEFAULT_CONFIG.style,
        palette: partial.palette ? { ...DEFAULT_CONFIG.palette, ...partial.palette } : DEFAULT_CONFIG.palette,
        typography: { ...DEFAULT_CONFIG.typography, ...partial.typography },
        format: { ...DEFAULT_CONFIG.format, ...partial.format },
        layers: { ...DEFAULT_CONFIG.layers, ...partial.layers },
    };

    console.log('[RendererState] Merged style ID:', merged.style.id);
    return merged;
}

function RendererContent() {
    const searchParams = useSearchParams();
    const [config, setConfig] = useState<PosterConfig | null>(null);
    const [isMapIdle, setIsMapIdle] = useState(false);
    const [fontsLoaded, setFontsLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);
    const mapRef = useRef<MapLibreGL.Map | null>(null);

    // 1. Listen for config injection
    useEffect(() => {
        // Check if config is already available (injected before hydration)
        if (window.posterConfig) {
            setConfig(mergeWithDefaults(window.posterConfig));
        }

        // Expose render function for Puppeteer
        window.renderPoster = (newConfig: Partial<PosterConfig>) => {
            console.log('[RendererState] Received config via window.renderPoster', JSON.stringify(newConfig, null, 2));
            console.log('[RendererState] Setting config state...');
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
        // Expose image generation function
        window.generatePosterImage = async (resolution) => {
            console.log('[RendererState] generatePosterImage called', { resolution, configExists: !!config, mapExists: !!mapRef.current });
            if (!config) throw new Error('No config loaded');
            if (!mapRef.current) {
                console.error('[RendererState] Map not loaded when generatePosterImage called');
                throw new Error('Map not loaded');
            }

            try {
                console.log('[RendererState] Calling exportMapToPNG...');
                const blob = await exportMapToPNG({
                    map: mapRef.current,
                    config,
                    resolution
                });

                console.log('[RendererState] Export successful, converting to base64');
                // Convert blob to base64
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        const base64 = reader.result as string;
                        // helper defines prefix as "data:image/png;base64," - we might want just the data
                        resolve(base64.split(',')[1]);
                    };
                    reader.onerror = (e) => {
                        console.error('[RendererState] FileReader error', e);
                        reject(new Error('Base64 conversion failed'));
                    };
                    reader.readAsDataURL(blob);
                });
            } catch (error) {
                console.error('[RendererState] Failed to generate poster image', error);
                throw error;
            }
        };
    }, [searchParams, config]);


    // 2. Load Fonts
    useEffect(() => {
        if (!config) return;

        const loadFonts = async () => {
            try {
                // Failsafe for fonts - if they don't load in 3s, proceed anyway
                const fontTimeout = new Promise(resolve => setTimeout(resolve, 3000));
                await Promise.race([document.fonts.ready, fontTimeout]);

                console.log('[RendererState] Fonts loaded (or timed out)');
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

        const styleId = config.style?.id;
        console.log('[RendererState] Computing mapStyle for ID:', styleId);

        const baseStyle = getStyleById(styleId as string);
        if (!baseStyle) {
            console.error('[RendererState] Style not found for ID:', styleId, 'Available IDs:', styles.map(s => s.id));
            return null;
        }

        // Apply palette and layer toggles
        // Note: This needs to match the logic in the main editor
        console.log('[RendererState] Applying palette to style...');
        return applyPaletteToStyle(baseStyle.mapStyle, config.palette, config.layers, baseStyle.layerToggles);
    }, [config]);

    useEffect(() => {
        if (config && mapStyle) {
            console.log('[RendererState] Config and MapStyle ready, rendering MapPreview');
        }
    }, [config, mapStyle]);

    // 4. Handle Map Events
    const handleMapLoad = useCallback((map: any) => {
        console.log('[RendererState] handleMapLoad event received from MapPreview');
        mapRef.current = map;

        // We can't trust the map to fire idle consistently in headless mode,
        // so we start a failsafe timer as soon as we get the load event.
        setTimeout(() => {
            console.warn('[RendererState] Failsafe: Forcing map idle state after 5s');
            setIsMapIdle(true);
        }, 5000);

        map.once('idle', () => {
            console.log('[RendererState] Map idle event finally received');
            setIsMapIdle(true);
        });
    }, []);

    // 5. Render
    const handleMapError = useCallback((error: any) => {
        console.error('[RendererState] handleMapError received:', error);
        setHasError(true);
    }, []);

    // Global failsafe: If nothing happens for 15 seconds, and we have a map, force idle to at least get a screenshot
    useEffect(() => {
        if (!config || isMapIdle) return;

        const timer = setTimeout(() => {
            if (!isMapIdle && mapRef.current) {
                console.warn('[RendererState] Global Failsafe: Forcing map idle state after 15s');
                setIsMapIdle(true);
            } else if (!isMapIdle && !mapRef.current) {
                console.error('[RendererState] Global Failsafe: Map still not initialized after 15s');
                setHasError(true);
            }
        }, 15000);
        return () => clearTimeout(timer);
    }, [isMapIdle, config]);

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
                    onError={handleMapError}
                />
            </div>

            {/* Text Overlay */}
            <TextOverlay config={config} />

            {/* Completion Signal for Puppeteer */}
            {isMapIdle && fontsLoaded && (
                <div id="render-complete" style={{ display: 'none' }} data-timestamp={Date.now()} />
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
