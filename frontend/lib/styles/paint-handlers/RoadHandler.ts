import type { ColorPalette } from '@/types/poster';
import type { PosterConfig } from '@/types/poster';

/**
 * Handles styling for road, bridge, and tunnel layers.
 * Extracted from applyPalette.ts to adhere to SRP.
 */
export function handleRoadLayer(
    layer: any,
    palette: ColorPalette,
    labelAdjustment: number
) {
    // Ensure we are dealing with a line layer
    if (layer.type !== 'line') return;

    // Bridge casings use background color
    if (layer.id.includes('bridge') && layer.id.includes('casing')) {
        layer.paint['line-color'] = palette.background;
        return;
    }

    const classes = [
        'motorway',
        'trunk',
        'primary',
        'secondary',
        'tertiary',
        'residential',
        'service',
    ];
    const matchedClass = classes.find((cls) => layer.id.includes(cls));

    if (matchedClass) {
        const roadColor = (palette.roads as any)[matchedClass];
        if (roadColor) {
            layer.paint['line-color'] = roadColor;
            // Glow layers get reduced opacity
            if (layer.id.includes('glow')) {
                layer.paint['line-opacity'] =
                    (layer.paint?.['line-opacity'] ?? 0.4) * labelAdjustment;
            } else {
                layer.paint['line-opacity'] =
                    (layer.paint?.['line-opacity'] ?? 1.0) * labelAdjustment;
            }
            return;
        }
    }

    // Glow fallback when no specific class match
    if (layer.id.includes('glow')) {
        layer.paint = {
            ...layer.paint,
            'line-color': palette.roads?.motorway || palette.primary || palette.text,
            'line-opacity': (layer.paint?.['line-opacity'] ?? 0.4) * labelAdjustment,
        };
        return;
    }

    // General fallback for other line layers
    const isSecondary = ['road-street', 'road-residential', 'road-tertiary', 'road-service'].includes(
        layer.id
    );
    const fallbackColor = isSecondary
        ? palette.secondary || palette.roads?.secondary
        : palette.primary || palette.roads?.primary;

    layer.paint = {
        ...layer.paint,
        'line-color': fallbackColor,
        'line-opacity': (layer.paint?.['line-opacity'] ?? (isSecondary ? 0.8 : 1.0)) * labelAdjustment,
    };
}
