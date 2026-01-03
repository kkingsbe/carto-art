import type { LayerPaintHandler, PaintContext } from './types';

export class BackgroundPaintHandler implements LayerPaintHandler {
    canHandle(layer: any): boolean {
        return layer.id === 'background' && layer.type === 'background';
    }

    apply(layer: any, context: PaintContext): void {
        layer.paint = { 'background-color': context.palette.background };
    }
}
