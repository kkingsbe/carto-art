import { isColorDark, mixColor, darkenColor, saturateColor, adjustColorHue } from '@/lib/utils/color';
import type { LayerPaintHandler, PaintContext } from './types';

export class LandcoverPaintHandler implements LayerPaintHandler {
    canHandle(layer: any): boolean {
        return layer.id.startsWith('landcover-') && layer.type === 'fill';
    }

    apply(layer: any, context: PaintContext): void {
        const { palette } = context;
        const { id } = layer;

        const baseGreenSpace = palette.greenSpace || palette.parks || '#90EE90';
        let color = baseGreenSpace;
        let opacity = layer.paint?.['fill-opacity'] || 0.3;

        if (id === 'landcover-farmland') {
            const isDark = isColorDark(palette.background);
            const earthTone = isDark ? '#8B4513' : '#F4D03F';
            color = mixColor(baseGreenSpace, earthTone, 0.35);
            opacity = 0.3;
        } else if (id === 'landcover-ice') {
            color = '#F0F8FF';
            if (isColorDark(palette.background)) {
                color = '#1E90FF';
            }
            opacity = 0.45;
        } else if (id === 'landcover-wood') {
            color = darkenColor(baseGreenSpace, 0.25);
            color = saturateColor(color, 0.1);
            opacity = 0.45;
        } else if (id === 'landcover-grass') {
            color = adjustColorHue(baseGreenSpace, 5);
            color = saturateColor(color, 0.2);
        }

        layer.paint = {
            ...layer.paint,
            'fill-color': color,
            'fill-opacity': opacity
        };
    }
}
