import type { ColorPalette } from '@/types/poster';

/**
 * Creates railroad layer definitions.
 * Uses a dashed line style typical for railroads.
 */
export function createRailroadLayers(
    palette: ColorPalette
): any[] {
    const railroadColor = palette.roads?.railroad || palette.secondary || palette.text;

    return [
        // Railroad casing/background (for the "ties" effect)
        {
            id: 'railroad-casing',
            type: 'line',
            source: 'openmaptiles',
            'source-layer': 'transportation',
            filter: ['all',
                ['==', ['get', 'class'], 'rail'],
                ['!=', ['get', 'brunnel'], 'tunnel']
            ],
            paint: {
                'line-color': railroadColor,
                'line-width': [
                    'interpolate', ['linear'], ['zoom'],
                    10, 0.5,
                    12, 1,
                    14, 2,
                    16, 3
                ],
                'line-opacity': 0.6
            }
        },
        // Railroad main line (dashed)
        {
            id: 'railroad-main',
            type: 'line',
            source: 'openmaptiles',
            'source-layer': 'transportation',
            filter: ['all',
                ['==', ['get', 'class'], 'rail'],
                ['!=', ['get', 'brunnel'], 'tunnel']
            ],
            layout: {
                'line-cap': 'butt',
                'line-join': 'miter'
            },
            paint: {
                'line-color': palette.background,
                'line-width': [
                    'interpolate', ['linear'], ['zoom'],
                    10, 0.3,
                    12, 0.6,
                    14, 1.2,
                    16, 2
                ],
                'line-dasharray': [2, 2]
            }
        }
    ];
}
