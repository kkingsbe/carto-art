import type { PosterConfig } from '@/types/poster';

export const ASPECT_RATIOS: Record<string, number> = {
  '2:3': 2 / 3,
  '3:4': 3 / 4,
  '4:5': 4 / 5,
  '1:1': 1,
  'ISO': 1 / Math.sqrt(2),
  '16:9': 16 / 9,
  '16:10': 16 / 10,
  '9:16': 9 / 16,
  '9:19.5': 9 / 19.5,
};


export function getNumericRatio(
  aspectRatio: PosterConfig['format']['aspectRatio'],
  orientation: 'portrait' | 'landscape'
): number {
  const base = ASPECT_RATIOS[aspectRatio] || 1;
  return orientation === 'portrait' ? base : 1 / base;
}

export function getAspectRatioCSS(
  aspectRatio: PosterConfig['format']['aspectRatio'],
  orientation: 'portrait' | 'landscape'
): string {
  if (aspectRatio === 'ISO') {
    return orientation === 'portrait' ? '1 / 1.414' : '1.414 / 1';
  }
  const [w, h] = aspectRatio.split(':').map(Number);
  return orientation === 'portrait' ? `${w}/${h}` : `${h}/${w}`;
}

