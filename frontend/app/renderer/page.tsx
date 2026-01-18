'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { PosterConfig } from '@/types/poster';
import { DEFAULT_CONFIG } from '@/lib/config/defaults';
import { Loader2 } from 'lucide-react';
import { exportMapToPNG } from '@/lib/export/exportCanvas';
import { calculateTargetResolution } from '@/lib/export/resolution';
import { DEFAULT_EXPORT_RESOLUTION } from '@/lib/export/constants';

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
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [isExporting, setIsExporting] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
                setErrorMessage('Failed to parse configuration from URL');
            }
        }

        // Expose image generation function for backward compatibility
        window.generatePosterImage = async (resolution) => {
            console.log('[RendererState] generatePosterImage called', { resolution, configExists: !!config });
            if (!config) throw new Error('No config loaded');

            try {
                console.log('[RendererState] Calling exportMapToPNG...');
                const blob = await exportMapToPNG({
                    config,
                    resolution
                });

                console.log('[RendererState] Export successful, converting to base64');
                // Convert blob to base64
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        const base64 = reader.result as string;
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

    // 2. Export the poster using the same pipeline as the export button
    useEffect(() => {
        if (!config) return;

        const exportPoster = async () => {
            setIsExporting(true);
            setHasError(false);
            setErrorMessage(null);

            try {
                console.log('[RendererState] Starting export using exportMapToPNG pipeline...');

                // Calculate target resolution (same as export button)
                const resolution = calculateTargetResolution(
                    DEFAULT_EXPORT_RESOLUTION,
                    config.format.aspectRatio,
                    config.format.orientation
                );

                console.log('[RendererState] Export resolution:', resolution);

                // Call the same export function used by the export button
                // Note: We don't pass a map parameter, so it will run headless
                const blob = await exportMapToPNG({
                    config,
                    resolution,
                    onProgress: (stage, percent) => {
                        console.log(`[RendererState] Export progress: ${stage} (${percent}%)`);
                    }
                });

                console.log('[RendererState] Export successful, creating image URL');
                const url = URL.createObjectURL(blob);
                setImageUrl(url);

                // Signal completion for Puppeteer
                const completeElement = document.getElementById('render-complete');
                if (completeElement) {
                    completeElement.setAttribute('data-timestamp', Date.now().toString());
                }
            } catch (error) {
                console.error('[RendererState] Export failed:', error);
                setHasError(true);
                setErrorMessage(error instanceof Error ? error.message : 'Unknown error during export');
            } finally {
                setIsExporting(false);
            }
        };

        exportPoster();
    }, [config]);

    if (hasError) {
        return (
            <div id="render-error" className="flex items-center justify-center h-screen bg-white">
                <div className="text-center p-8">
                    <div className="text-4xl mb-4">❌</div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Export Error</h3>
                    <p className="text-sm text-gray-600">{errorMessage || 'Failed to render poster'}</p>
                </div>
            </div>
        );
    }

    if (!config) {
        return (
            <div className="flex items-center justify-center h-screen bg-white">
                <Loader2 className="animate-spin" />
            </div>
        );
    }

    if (isExporting || !imageUrl) {
        return (
            <div className="flex items-center justify-center h-screen bg-white">
                <div className="text-center">
                    <Loader2 className="animate-spin mx-auto mb-4" />
                    <p className="text-sm text-gray-600">Rendering poster...</p>
                </div>
            </div>
        );
    }

    // Display the exported image - this is identical to what the export button produces
    return (
        <div className="w-screen h-screen overflow-hidden bg-white flex items-center justify-center">
            <img
                src={imageUrl}
                alt="CartoArt Poster"
                className="max-w-full max-h-full object-contain"
                id="poster-image"
            />
            {/* Completion Signal for Puppeteer */}
            <div id="render-complete" style={{ display: 'none' }} data-timestamp={Date.now()} />
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
