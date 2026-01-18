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

// PNG-only export resolutions
export const PNG_RESOLUTIONS: BaseExportResolution[] = [
  {
    name: 'Small',
    longEdge: 12,
    dpi: 150,
    description: 'Perfect for web sharing and small prints'
  },
  {
    name: 'Medium',
    longEdge: 18,
    dpi: 150,
    description: 'Good for standard prints (8×10 in)'
  },
  {
    name: 'Large',
    longEdge: 24,
    dpi: 150,
    description: 'High quality for larger prints (12×16 in)'
  },
  {
    name: 'Extra Large',
    longEdge: 36,
    dpi: 150,
    description: 'Maximum quality for professional printing (18×24 in)'
  }
];

export function getPngResolutions(aspectRatio: PosterConfig['format']['aspectRatio']): ExportResolution[] {
  return PNG_RESOLUTIONS.map(res => calculateTargetResolution(res, aspectRatio, 'landscape'));
}
