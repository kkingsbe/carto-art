import { isColorDark } from '@/lib/utils/color';
import type { LayerPaintHandler, PaintContext } from './types';

export class HillshadePaintHandler implements LayerPaintHandler {
    canHandle(layer: any): boolean {
        return layer.id === 'hillshade' && layer.type === 'hillshade';
    }

    apply(layer: any, context: PaintContext): void {
        const { palette, layers } = context;
        const isDark = isColorDark(palette.background);

        // Add exaggeration from config if available, clamped between 0 and 1
        const exaggeration = Math.min(Math.max(layers?.hillshadeExaggeration ?? 0.5, 0), 1);

        if (palette.hillshade) {
            layer.paint = {
                ...layer.paint,
                'hillshade-shadow-color': palette.hillshade,
                'hillshade-highlight-color': palette.background,
                'hillshade-accent-color': palette.hillshade,
                'hillshade-exaggeration': exaggeration,
            };
        } else {
            layer.paint = {
                ...layer.paint,
                'hillshade-shadow-color': isDark ? '#000000' : (palette.secondary || palette.text),
                'hillshade-highlight-color': isDark ? (palette.secondary || palette.text) : palette.background,
                'hillshade-accent-color': isDark ? '#000000' : (palette.secondary || palette.text),
                'hillshade-exaggeration': exaggeration,
            };
        }
    }
}
