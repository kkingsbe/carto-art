import type { PosterConfig } from '@/types/poster';
import { hexToRgba } from '@/lib/utils/color';

export const BACKDROP_ALPHAS = {
  none: 0,
  subtle: 0.82,
  strong: 0.92,
  gradient: 1.0,
} as const;

export interface GradientStop {
  pos: number;   // 0 to 1
  alpha: number; // 0 to 1
}

export interface GradientDefinition {
  direction: 'to top' | 'to bottom';
  stops: GradientStop[];
}

export function getScrimAlpha(typography: PosterConfig['typography']): number {
  const type = typography.textBackdrop || 'gradient';
  const baseAlpha = BACKDROP_ALPHAS[type];
  const userAlpha = typography.backdropAlpha ?? 1.0;
  return baseAlpha * userAlpha;
}

/**
 * Calculates the height of the backdrop band.
 * Returns a number (pixels for export) or string (percentage/cqw for CSS).
 * 
 * @param config - Poster configuration
 * @param isExport - Whether this is for canvas export (returns pixels) or CSS (returns cqw string)
 * @param exportWidth - Width of the export canvas in pixels (only used when isExport is true)
 * @param exportHeight - Height of the export canvas in pixels (only used when isExport is true)
 */
export function calculateScrimHeight(
  config: PosterConfig,
  isExport: boolean = false,
  exportWidth: number = 0,
  exportHeight: number = 0
): number | string {
  const { typography, location } = config;
  const backdropType = typography.textBackdrop || 'gradient';
  const userHeight = (typography.backdropHeight ?? 35) / 100;

  // For the 'gradient' type, we want a visible fade band
  const isEdgeGradient = backdropType === 'gradient' && (typography.position === 'bottom' || typography.position === 'top');

  if (isEdgeGradient) {
    if (isExport) {
      // userHeight is a percentage (0-1), so multiply by exportHeight for the gradient band height
      return Math.round(exportHeight * userHeight);
    }
    return `${userHeight * 100}%`;
  }

  // For non-gradient backdrops (subtle, strong), calculate based on text content
  const subtitleText = location.city || '';
  // Height formula in cqw units (container width percentage)
  const heightCqw = typography.titleSize * 2.5 + (subtitleText ? typography.subtitleSize * 1.5 : 0) + 6;

  if (isExport) {
    // Convert cqw to pixels: heightCqw is in container width %, so multiply by exportWidth/100
    return Math.round((heightCqw / 100) * exportWidth);
  }

  return `${heightCqw}cqw`;
}


/**
 * Converts our unified stops into a CSS linear-gradient string
 */
export function stopsToCssGradient(bg: string, def: GradientDefinition): string {
  const stopStrings = def.stops.map(s =>
    `${hexToRgba(bg, s.alpha)} ${Math.round(s.pos * 100)}%`
  );
  return `linear-gradient(${def.direction}, ${stopStrings.join(', ')})`;
}

/**
 * Common gradient definitions to ensure consistency between Preview and Export
 */
export function getBackdropGradientStyles(
  config: PosterConfig,
  scrimAlpha: number
): GradientDefinition | null {
  const { typography } = config;
  const backdropType = typography.textBackdrop || 'gradient';
  const s = (typography.backdropSharpness ?? 50) / 100;

  // Transition end: where the gradient becomes fully opaque (relative to its start)
  // s=0 (soft) -> 1.0 (fade over the whole area)
  // s=1 (abrupt) -> 0.05 (becomes opaque almost immediately)
  const transitionEnd = 1.0 - (s * 0.95);

  if (backdropType === 'gradient') {
    if (typography.position === 'bottom') {
      return {
        direction: 'to bottom',
        stops: [
          { pos: 0, alpha: 0 },
          { pos: transitionEnd, alpha: 1 },
          { pos: 1, alpha: 1 }
        ]
      };
    } else if (typography.position === 'top') {
      return {
        direction: 'to top',
        stops: [
          { pos: 0, alpha: 0 },
          { pos: transitionEnd, alpha: 1 },
          { pos: 1, alpha: 1 }
        ]
      };
    }
  } else if (backdropType !== 'none') {
    if (typography.position === 'top') {
      return {
        direction: 'to bottom',
        stops: [
          { pos: 0, alpha: scrimAlpha },
          { pos: 1 - (1 - transitionEnd) * 0.6, alpha: scrimAlpha * 0.5 },
          { pos: 1, alpha: 0 }
        ]
      };
    } else if (typography.position === 'bottom') {
      return {
        direction: 'to bottom',
        stops: [
          { pos: 0, alpha: 0 },
          { pos: (1 - transitionEnd) * 0.6, alpha: scrimAlpha * 0.5 },
          { pos: 1, alpha: scrimAlpha }
        ]
      };
    }
  }

  return null;
}
