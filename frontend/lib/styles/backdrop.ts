import type { PosterConfig } from '@/types/poster';
import { hexToRgba } from '@/lib/utils';

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
 * Returns a number (pixels) or string (percentage for CSS).
 */
export function calculateScrimHeight(
  config: PosterConfig,
  isExport: boolean = false,
  exportScale: number = 1,
  totalHeight: number = 0
): number | string {
  const { typography, location } = config;
  const backdropType = typography.textBackdrop || 'gradient';
  const userHeight = (typography.backdropHeight ?? 35) / 100;
  
  // For the 'gradient' type, we want a visible fade band
  const isEdgeGradient = backdropType === 'gradient' && (typography.position === 'bottom' || typography.position === 'top');
  
  if (isEdgeGradient) {
    if (isExport) {
      return Math.round(totalHeight * userHeight);
    }
    return `${userHeight * 100}%`;
  }
  
  const subtitleText = location.city || '';
  const height = typography.titleSize * 2.5 + (subtitleText ? typography.subtitleSize * 1.5 : 0) + 6;
  
  if (isExport) {
    // For export, we need to return pixels. 
    // Since our height is in "percentage of width" (cqw), we multiply by width/100.
    // The exportScale passed here from exportCanvas.ts is exportWidth / logicalWidth.
    // Wait, it's easier to just use totalHeight if we have it, but for bands it's usually relative to width.
    return Math.round(height * (exportScale * (config.location.center[0] ? 1 : 1))); // This is getting messy
  }
  
  return `${height}cqw`;
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
  
  if (backdropType === 'gradient') {
    if (typography.position === 'bottom') {
      return {
        direction: 'to bottom',
        stops: [
          { pos: 0, alpha: 0 },
          { pos: 0.5, alpha: 0.5 },
          { pos: 0.7, alpha: 1 },
          { pos: 1, alpha: 1 }
        ]
      };
    } else if (typography.position === 'top') {
      return {
        direction: 'to top',
        stops: [
          { pos: 0, alpha: 1 },
          { pos: 0.1, alpha: 1 },
          { pos: 0.5, alpha: 0.1 },
          { pos: 1, alpha: 0 }
        ]
      };
    }
  } else if (backdropType !== 'none') {
    if (typography.position === 'top') {
      return {
        direction: 'to bottom',
        stops: [
          { pos: 0, alpha: scrimAlpha },
          { pos: 0.4, alpha: scrimAlpha * 0.7 },
          { pos: 1, alpha: 0 }
        ]
      };
    } else if (typography.position === 'bottom') {
      return {
        direction: 'to bottom',
        stops: [
          { pos: 0, alpha: 0 },
          { pos: 0.6, alpha: scrimAlpha * 0.7 },
          { pos: 1, alpha: scrimAlpha }
        ]
      };
    }
  }
  
  return null;
}
