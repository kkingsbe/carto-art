import type { LayerPaintHandler, PaintContext } from './types';

export class WaterPaintHandler implements LayerPaintHandler {
    canHandle(layer: any): boolean {
        return layer.id === 'water' && layer.type === 'fill';
    }

    apply(layer: any, context: PaintContext): void {
        const { palette, layers } = context;

        const terrainUnderWaterEnabled = layers?.terrainUnderWater ?? true;
        const baseOpacity = layer.paint?.['fill-opacity'] ?? 1;

        // If terrainUnderWater is disabled, force full opacity to hide hillshade
        // Otherwise, use the style's opacity (but ensure it's at least 0.95 to mostly hide hillshade)
        const waterOpacity = terrainUnderWaterEnabled
            ? Math.max(baseOpacity, 0.95) // Allow slight transparency only when underwater terrain is enabled
            : 1.0; // Full opacity when disabled to completely hide hillshade

        layer.paint = {
            ...layer.paint,
            'fill-color': palette.water,
            'fill-opacity': waterOpacity
        };
    }
}
