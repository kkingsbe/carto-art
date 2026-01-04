import type { PosterConfig } from '@/types/poster';
import { formatCoordinates } from '../utils';
import { hexToRgba } from '../utils/color';
import { getScrimAlpha, calculateScrimHeight, getBackdropGradientStyles } from '../styles/backdrop';
import { drawTextWithHalo } from './drawing';
import { cqwToPixels, TEXT_SPACING, calculateDecorativeLineDimensions } from './dimensions';

export function drawTextOverlay(
  ctx: CanvasRenderingContext2D,
  config: PosterConfig,
  exportWidth: number,
  exportHeight: number,
  exportScale: number
) {
  const { typography, location, palette, format } = config;

  ctx.fillStyle = palette.text;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const rawTitleText = String(location.name || 'WHERE WE MET');
  const titleText = typography.titleAllCaps !== false ? rawTitleText.toUpperCase() : rawTitleText;
  const subtitleText = String(location.city || '').toUpperCase();
  const coordsText = formatCoordinates(location.center);

  const showTitle = typography.showTitle !== false;
  const showSubtitle = typography.showSubtitle !== false && !!subtitleText;
  const showCoords = typography.showCoordinates !== false;

  // Convert cqw values to pixels using consistent formula
  const titleSizePx = cqwToPixels(typography.titleSize, exportWidth);
  const subtitleSizePx = cqwToPixels(typography.subtitleSize, exportWidth);
  const coordsSizePx = subtitleSizePx * 0.65;

  // Spacing values that match CSS in TextOverlay.tsx
  // Title to subtitle gap: CSS uses marginTop: '0.75rem' which at typical scale equals ~12px
  // We approximate this proportionally to match the visual result
  const titleSubtitleGap = titleSizePx * 0.125; // Match CSS visual spacing
  // Coords margin-top: CSS uses '0.5cqw'
  const coordsMarginTop = cqwToPixels(TEXT_SPACING.COORDS_MARGIN_TOP_CQW, exportWidth);

  // Backdrop calculations - pass exportWidth and exportHeight for proper pixel conversion
  const backdropType = typography.textBackdrop || 'gradient';
  const scrimAlpha = getScrimAlpha(typography);
  const scrimHeight = calculateScrimHeight(config, true, exportWidth, exportHeight) as number;

  if (backdropType !== 'none') {
    const isGradient = backdropType === 'gradient';

    ctx.save();
    if (typography.position === 'center' && !isGradient) {
      const yCenter = exportHeight / 2;
      const yTop = Math.max(0, Math.round(yCenter - scrimHeight / 2));
      ctx.globalAlpha = 1.0;
      ctx.fillStyle = hexToRgba(palette.background, backdropType === 'strong' ? 0.95 : 0.78);

      const radius = Math.round(scrimHeight * 0.2);
      ctx.font = `${typography.titleWeight} ${titleSizePx}px ${typography.titleFont}`;
      const titleWidth = ctx.measureText(titleText).width;

      let maxTextWidth = 0;
      if (showTitle) maxTextWidth = titleWidth;
      if (showSubtitle) {
        ctx.font = `${subtitleSizePx}px ${typography.subtitleFont}`;
        const subWidth = ctx.measureText(subtitleText).width + (subtitleText.length - 1) * 0.2 * subtitleSizePx + (exportWidth * 0.16);
        maxTextWidth = Math.max(maxTextWidth, subWidth);
      }
      if (showCoords) {
        ctx.font = `${coordsSizePx}px ${typography.subtitleFont}`;
        maxTextWidth = Math.max(maxTextWidth, ctx.measureText(coordsText).width);
      }

      const rectWidth = Math.min(exportWidth * 0.9, maxTextWidth * 1.2 + 40);
      const xLeft = (exportWidth - rectWidth) / 2;

      ctx.beginPath();
      ctx.roundRect(xLeft, yTop, rectWidth, scrimHeight, radius);
      ctx.fill();
      if (backdropType === 'strong') {
        ctx.shadowColor = 'rgba(0,0,0,0.1)';
        ctx.shadowBlur = 25 * exportScale;
        ctx.shadowOffsetY = 10 * exportScale;
        ctx.stroke();
      }
    } else {
      const isTop = typography.position === 'top';
      const yTop = isTop ? 0 : exportHeight - scrimHeight;
      const gradientDef = getBackdropGradientStyles(config, scrimAlpha);

      let gradient: CanvasGradient;
      if (gradientDef?.direction === 'to top') {
        // Flow from bottom to top
        gradient = ctx.createLinearGradient(0, yTop + scrimHeight, 0, yTop);
      } else {
        // Default to flow from top to bottom
        gradient = ctx.createLinearGradient(0, yTop, 0, yTop + scrimHeight);
      }

      if (gradientDef) {
        const bg = palette.background;
        gradientDef.stops.forEach(stop => {
          gradient.addColorStop(stop.pos, hexToRgba(bg, stop.alpha));
        });
      }

      ctx.globalAlpha = 1;
      ctx.fillStyle = gradient;
      ctx.fillRect(0, yTop, exportWidth, scrimHeight);
    }
    ctx.restore();
  }

  // Calculate text positions to match CSS layout in TextOverlay.tsx
  const marginPercent = format.margin;

  // Padding values matching TextOverlay.tsx:
  // paddingTop: typography.position === 'top' ? `${margin + 3}cqw` : '2rem',
  // paddingBottom: typography.position === 'bottom' ? `${margin + 5}cqw` : '2rem',
  const topPadding = cqwToPixels(marginPercent + TEXT_SPACING.TOP_PADDING_OFFSET, exportWidth);
  const bottomPadding = cqwToPixels(marginPercent + TEXT_SPACING.BOTTOM_PADDING_OFFSET, exportWidth);

  // Calculate total text block height
  let textBlockHeight = 0;
  if (showTitle) textBlockHeight += titleSizePx;
  if (showSubtitle) textBlockHeight += titleSubtitleGap + subtitleSizePx;
  if (showCoords) textBlockHeight += coordsMarginTop + coordsSizePx;

  // Calculate text positions
  let titleY = -1000, subtitleY = -1000, coordsY = -1000;

  if (typography.position === 'top') {
    // Top-aligned layout
    let currentY = topPadding;
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
  } else if (typography.position === 'bottom') {
    // Bottom-aligned layout - work backwards from bottom
    let currentY = exportHeight - bottomPadding;
    if (showCoords) {
      coordsY = currentY - coordsSizePx / 2;
      currentY -= coordsSizePx + coordsMarginTop;
    }
    if (showSubtitle) {
      subtitleY = currentY - subtitleSizePx / 2;
      currentY -= subtitleSizePx + titleSubtitleGap;
    }
    if (showTitle) {
      titleY = currentY - titleSizePx / 2;
    }
  } else {
    // Center-aligned layout
    const startY = (exportHeight - textBlockHeight) / 2;
    let currentY = startY;
    if (showTitle) {
      titleY = currentY + titleSizePx / 2;
      currentY += titleSizePx + titleSubtitleGap;
    }
    if (showSubtitle) {
      subtitleY = currentY + subtitleSizePx / 2;
      currentY += subtitleSizePx + coordsMarginTop;
    }
    if (showCoords) {
      coordsY = currentY + coordsSizePx / 2;
    }
  }

  // Draw Title
  if (showTitle) {
    drawTextWithHalo(ctx, titleText, exportWidth / 2, titleY, titleSizePx, {
      weight: typography.titleWeight,
      letterSpacing: typography.titleLetterSpacing || 0,
      fontFamily: typography.titleFont,
      haloColor: palette.background,
      textColor: palette.text,
      showHalo: backdropType !== 'gradient' && backdropType !== 'none'
    });
  }

  // Draw Subtitle with decorative lines
  if (showSubtitle) {
    const tracking = 0.2;
    ctx.font = `${subtitleSizePx}px ${typography.subtitleFont}`;
    const textWidth = ctx.measureText(subtitleText).width + (subtitleText.length - 1) * tracking * subtitleSizePx;

    // Get decorative line dimensions matching CSS
    const lineConfig = calculateDecorativeLineDimensions(exportWidth, exportScale);

    ctx.save();
    ctx.strokeStyle = palette.text;
    ctx.lineWidth = lineConfig.thickness;
    ctx.globalAlpha = 0.4;

    // Left line
    ctx.beginPath();
    ctx.moveTo(exportWidth / 2 - textWidth / 2 - lineConfig.gap - lineConfig.width, subtitleY);
    ctx.lineTo(exportWidth / 2 - textWidth / 2 - lineConfig.gap, subtitleY);
    ctx.stroke();

    // Right line
    ctx.beginPath();
    ctx.moveTo(exportWidth / 2 + textWidth / 2 + lineConfig.gap, subtitleY);
    ctx.lineTo(exportWidth / 2 + textWidth / 2 + lineConfig.gap + lineConfig.width, subtitleY);
    ctx.stroke();
    ctx.restore();

    drawTextWithHalo(ctx, subtitleText, exportWidth / 2, subtitleY, subtitleSizePx, {
      opacity: 0.9,
      letterSpacing: tracking,
      fontFamily: typography.subtitleFont,
      haloColor: palette.background,
      textColor: palette.text,
      showHalo: backdropType !== 'gradient' && backdropType !== 'none'
    });
  }

  // Draw Coordinates
  if (showCoords) {
    drawTextWithHalo(ctx, coordsText, exportWidth / 2, coordsY, coordsSizePx, {
      opacity: 0.6,
      letterSpacing: 0.1,
      fontFamily: typography.subtitleFont,
      haloColor: palette.background,
      textColor: palette.text,
      showHalo: backdropType !== 'gradient' && backdropType !== 'none'
    });
  }
}
