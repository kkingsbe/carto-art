import type { ColorPalette, PosterConfig } from '@/types/poster';

export interface PaintContext {
    palette: ColorPalette;
    layers?: PosterConfig['layers'];
    labelAdjustment: number;
    roadWeightMultiplier: number;
}

export interface LayerPaintHandler {
    canHandle(layer: any): boolean;
    apply(layer: any, context: PaintContext): void;
}
