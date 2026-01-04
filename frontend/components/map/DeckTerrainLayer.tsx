'use client';

import { useEffect, useMemo } from 'react';
import { useControl } from 'react-map-gl/maplibre';
import { MapboxOverlay } from '@deck.gl/mapbox';
import { TerrainLayer } from '@deck.gl/geo-layers';
import type { MapboxOverlayProps } from '@deck.gl/mapbox';

interface DeckTerrainLayerProps {
    /** Terrain exaggeration factor (0-5) */
    exaggeration: number;
    /** Mesh quality - lower = higher quality, slower render. 4.0 = fast, 1.0 = balanced, 0.5 = high */
    meshMaxError?: number;
    /** Tile URL template for elevation data */
    elevationData: string;
    /** Optional bounds to constrain terrain rendering */
    bounds?: [number, number, number, number];
    /** Optional visibility control */
    visible?: boolean;
}

/**
 * Deck.gl-based MapboxOverlay controller hook for react-map-gl.
 * Creates and manages a MapboxOverlay instance with the provided layers.
 */
function useDeckOverlay(props: MapboxOverlayProps & { interleaved?: boolean }) {
    const overlay = useControl<MapboxOverlay>(
        () => new MapboxOverlay(props),
        { position: undefined }
    );

    // Update overlay when props change
    useEffect(() => {
        overlay.setProps(props);
    }, [overlay, props]);

    return overlay;
}

/**
 * DeckTerrainLayer - High-quality 3D terrain rendering using deck.gl TerrainLayer.
 * 
 * This component integrates with react-map-gl/maplibre to overlay a deck.gl TerrainLayer
 * that provides higher mesh quality than MapLibre's native terrain implementation.
 * 
 * Key features:
 * - Configurable mesh quality via meshMaxError (lower = higher quality)
 * - Terrarium elevation decoder matching AWS terrain tiles
 * - Material settings for cartographic lighting
 * 
 * @example
 * ```tsx
 * <Map>
 *   <DeckTerrainLayer
 *     exaggeration={1.5}
 *     meshMaxError={4.0}
 *     elevationData="/api/tiles/aws-terrain/terrarium/{z}/{x}/{y}.png"
 *   />
 * </Map>
 * ```
 */
export function DeckTerrainLayer({
    exaggeration = 1.5,
    meshMaxError = 4.0,
    elevationData,
    bounds,
    visible = true,
}: DeckTerrainLayerProps) {

    const terrainLayer = useMemo(() => {
        return new TerrainLayer({
            id: 'deck-terrain',
            minZoom: 0,
            maxZoom: 14,
            strategy: 'no-overlap',
            elevationDecoder: {
                // Terrarium encoding: elevation = (R * 256 + G + B / 256) - 32768
                // Scale by exaggeration factor
                rScaler: 256 * exaggeration,
                gScaler: 1 * exaggeration,
                bScaler: (1 / 256) * exaggeration,
                offset: -32768 * exaggeration,
            },
            elevationData,
            // Use a solid color texture since MapLibre handles the actual map rendering
            // The terrain layer provides the 3D mesh displacement
            texture: null,
            meshMaxError,
            bounds,
            // Terrain mesh exaggeration
            // Note: TerrainLayer uses elevation in its own units, we scale via shader
            wireframe: false,
            material: {
                ambient: 0.35,
                diffuse: 0.8,
                shininess: 32,
                specularColor: [30, 30, 30],
            },
            visible,
            // Tell deck.gl this layer handles terrain + drawing
            operation: 'terrain+draw',
        });
    }, [exaggeration, meshMaxError, elevationData, bounds, visible]);

    // Use the overlay hook to integrate with MapLibre
    useDeckOverlay({
        layers: [terrainLayer],
        interleaved: true,
    });

    return null;
}

/**
 * Quality presets for terrain mesh rendering.
 * Maps user-friendly names to meshMaxError values.
 */
export const TERRAIN_QUALITY_PRESETS = {
    fast: 4.0,      // Quick preview, lower mesh resolution
    balanced: 2.0,  // Good quality, reasonable performance
    high: 1.0,      // High quality, slower rendering
    export: 0.5,    // Maximum quality for print export
} as const;

export type TerrainQualityPreset = keyof typeof TERRAIN_QUALITY_PRESETS;
