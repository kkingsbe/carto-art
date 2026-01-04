/**
 * Unified dimension calculations for preview and export consistency.
 * 
 * This module centralizes layout calculations to ensure the preview (CSS)
 * and export (Canvas) render identically.
 * 
 * Key concept: All values are stored as "container width percentages" (cqw units)
 * which can be converted to CSS strings or pixel values.
 */

import type { PosterConfig } from '@/types/poster';

export interface TextLayoutConfig {
    /** Container width in pixels (for export) or undefined (for preview CSS) */
    containerWidth?: number;
    /** Container height in pixels (for export) or undefined (for preview CSS) */
    containerHeight?: number;
    /** Typography configuration */
    typography: PosterConfig['typography'];
    /** Format configuration */
    format: PosterConfig['format'];
}

/**
 * Spacing values in container width percentage (cqw).
 * These match the CSS values used in TextOverlay.tsx.
 */
export const TEXT_SPACING = {
    /** Top padding offset from margin (cqw) */
    TOP_PADDING_OFFSET: 3,
    /** Bottom padding offset from margin (cqw) */
    BOTTOM_PADDING_OFFSET: 5,
    /** Horizontal padding offset from margin (cqw) */
    HORIZONTAL_PADDING_OFFSET: 4,

    /** Gap between title and subtitle as percentage of title size */
    TITLE_SUBTITLE_GAP_RATIO: 0.75 / 6, // ~0.125, derived from 0.75rem at 6cqw title
    /** Fixed margin-top for subtitle in cqw (when using rem fallback) */
    TITLE_SUBTITLE_GAP_CQW: 0.75,

    /** Margin-top for coordinates in cqw */
    COORDS_MARGIN_TOP_CQW: 0.5,

    /** Line height multiplier for title */
    TITLE_LINE_HEIGHT: 1.1,
    /** Line height multiplier for subtitle */
    SUBTITLE_LINE_HEIGHT: 1.0,

    /** Decorative line width in cqw (4.8cqw matches preview) */
    DECORATIVE_LINE_WIDTH_CQW: 4.8,
    /** Decorative line gap from text in cqw (1.6cqw matches preview) */
    DECORATIVE_LINE_GAP_CQW: 1.6,
    /** Decorative line thickness in cqw (0.15cqw matches preview) */
    DECORATIVE_LINE_THICKNESS_CQW: 0.15,
} as const;

/**
 * Convert a cqw value to CSS string
 */
export function toCqw(value: number): string {
    return `${value}cqw`;
}

/**
 * Convert a cqw value to pixels
 * @param value - Value in container width percentage
 * @param containerWidth - Container width in pixels
 */
export function cqwToPixels(value: number, containerWidth: number): number {
    return (value / 100) * containerWidth;
}

/**
 * Convert pixels to cqw value
 * @param pixels - Value in pixels
 * @param containerWidth - Container width in pixels
 */
export function pixelsToCqw(pixels: number, containerWidth: number): number {
    return (pixels / containerWidth) * 100;
}

/**
 * Calculate text position Y coordinate.
 * Returns the Y position in pixels (for export) based on text position setting.
 */
export function calculateTextPositionY(
    position: 'top' | 'center' | 'bottom',
    margin: number,
    containerWidth: number,
    containerHeight: number,
    textBlockHeight: number
): number {
    const topPadding = cqwToPixels(margin + TEXT_SPACING.TOP_PADDING_OFFSET, containerWidth);
    const bottomPadding = cqwToPixels(margin + TEXT_SPACING.BOTTOM_PADDING_OFFSET, containerWidth);

    switch (position) {
        case 'top':
            return topPadding;
        case 'bottom':
            return containerHeight - bottomPadding - textBlockHeight;
        case 'center':
        default:
            return (containerHeight - textBlockHeight) / 2;
    }
}

/**
 * Calculate the vertical positions for all text elements.
 * Returns Y coordinates in pixels for title, subtitle, and coordinates.
 */
export function calculateTextElementPositions(
    config: PosterConfig,
    containerWidth: number,
    containerHeight: number
): { titleY: number; subtitleY: number; coordsY: number } {
    const { typography, location, format } = config;

    const margin = format.margin;
    const showTitle = typography.showTitle !== false;
    const showSubtitle = typography.showSubtitle !== false && !!location.city;
    const showCoords = typography.showCoordinates !== false;

    // Calculate sizes in pixels
    const titleSizePx = cqwToPixels(typography.titleSize, containerWidth);
    const subtitleSizePx = cqwToPixels(typography.subtitleSize, containerWidth);
    const coordsSizePx = subtitleSizePx * 0.65;

    // Spacing values (matching CSS from TextOverlay.tsx)
    // Title to subtitle gap: marginTop: '0.75rem' ≈ 12px at typical scale, or use cqw
    const titleSubtitleGap = titleSizePx * 0.125; // Proportional gap
    // Coords margin-top: '0.5cqw'
    const coordsMarginTop = cqwToPixels(TEXT_SPACING.COORDS_MARGIN_TOP_CQW, containerWidth);

    // Calculate total text block height
    let textBlockHeight = 0;
    if (showTitle) textBlockHeight += titleSizePx;
    if (showSubtitle) textBlockHeight += titleSubtitleGap + subtitleSizePx;
    if (showCoords) textBlockHeight += coordsMarginTop + coordsSizePx;

    // Get base Y position
    let baseY = calculateTextPositionY(
        typography.position,
        margin,
        containerWidth,
        containerHeight,
        textBlockHeight
    );

    // Calculate individual element positions
    let titleY = -1000, subtitleY = -1000, coordsY = -1000;
    let currentY = baseY;

    if (typography.position === 'top' || typography.position === 'center') {
        // Top-down layout
        if (showTitle) {
            titleY = currentY + titleSizePx / 2;
            currentY += titleSizePx;
        }
        if (showSubtitle) {
            currentY += titleSubtitleGap;
            subtitleY = currentY + subtitleSizePx / 2;
            currentY += subtitleSizePx;
        }
        if (showCoords) {
            currentY += coordsMarginTop;
            coordsY = currentY + coordsSizePx / 2;
        }
    } else {
        // Bottom-up layout (position === 'bottom')
        currentY = baseY + textBlockHeight;

        if (showCoords) {
            coordsY = currentY - coordsSizePx / 2;
            currentY -= (coordsSizePx + coordsMarginTop);
        }
        if (showSubtitle) {
            subtitleY = currentY - subtitleSizePx / 2;
            currentY -= (subtitleSizePx + titleSubtitleGap);
        }
        if (showTitle) {
            titleY = currentY - titleSizePx / 2;
        }
    }

    return { titleY, subtitleY, coordsY };
}

/**
 * Calculate decorative line dimensions for the subtitle.
 * Returns dimensions in pixels.
 */
export function calculateDecorativeLineDimensions(
    containerWidth: number,
    _exportScale: number = 1
): { width: number; gap: number; thickness: number } {
    return {
        width: cqwToPixels(TEXT_SPACING.DECORATIVE_LINE_WIDTH_CQW, containerWidth),
        gap: cqwToPixels(TEXT_SPACING.DECORATIVE_LINE_GAP_CQW, containerWidth),
        thickness: Math.max(1, cqwToPixels(TEXT_SPACING.DECORATIVE_LINE_THICKNESS_CQW, containerWidth)),
    };
}
