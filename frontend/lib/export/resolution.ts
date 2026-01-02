import type { PosterConfig } from '@/types/poster';
import { ASPECT_RATIOS } from '../styles/dimensions';

export interface ExportResolution {
  width: number;
  height: number;
  dpi: number;
  name: string;
  description?: string;
}

export interface BaseExportResolution {
  name: string;
  longEdge: number;
  dpi: number;
  description?: string;
}

export function calculateTargetResolution(
  base: BaseExportResolution,
  aspectRatio: PosterConfig['format']['aspectRatio'],
  orientation: 'portrait' | 'landscape'
): ExportResolution {
  const ratio = ASPECT_RATIOS[aspectRatio] || 1;

  let width: number;
  let height: number;

  const numericRatio = orientation === 'portrait' ? ratio : 1 / ratio;

  if (numericRatio <= 1) {
    // Height is longer or equal
    height = base.longEdge;
    width = Math.round(height * numericRatio);
  } else {
    // Width is longer
    width = base.longEdge;
    height = Math.round(width / numericRatio);
  }


  return {
    name: base.name,
    description: base.description,
    dpi: base.dpi,
    width,
    height
  };
}

export function getPhysicalDimensions(width: number, height: number, dpi: number): string {
  const wInches = width / dpi;
  const hInches = height / dpi;

  // Round to 1 decimal place if it's not a whole number
  const round = (val: number) => {
    const rounded = Math.round(val * 10) / 10;
    return rounded % 1 === 0 ? rounded.toString() : rounded.toFixed(1);
  };

  return `${round(wInches)} × ${round(hInches)} in`;
}


