import type { PosterConfig } from '@/types/poster';
import { formatCoordinates } from '../utils';
import { hexToRgba } from '../utils/color';
import { getScrimAlpha, calculateScrimHeight, getBackdropGradientStyles } from '../styles/backdrop';
import { drawTextWithHalo } from './drawing';

export function drawTextOverlay(
  ctx: CanvasRenderingContext2D,
  config: PosterConfig,
  exportWidth: number,
  exportHeight: number,
  exportScale: number
) {
  const { typography, location, palette } = config;

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

  const titleSizePx = Math.round(exportWidth * (typography.titleSize / 100));
  const subtitleSizePx = Math.round(exportWidth * (typography.subtitleSize / 100));
  const coordsSizePx = Math.round(subtitleSizePx * 0.65);

  // Backdrop calculations
  const backdropType = typography.textBackdrop || 'gradient';
  const scrimAlpha = getScrimAlpha(typography);
  const scrimHeight = calculateScrimHeight(config, true, exportScale, exportHeight) as number;

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

  // Positioning
  let titleY = -1000, subtitleY = -1000, coordsY = -1000;
  const marginPercent = config.format.margin;
  const spacingTitleSub = titleSizePx * 1.1;
  const spacingSubCoords = subtitleSizePx * 1.4;

  let totalTextHeight = 0;
  if (showTitle) totalTextHeight += titleSizePx;
  if (showSubtitle) totalTextHeight += (showTitle ? spacingTitleSub : subtitleSizePx);
  if (showCoords) totalTextHeight += (showSubtitle ? spacingSubCoords : coordsSizePx);

  if (typography.position === 'top') {
    let currentY = exportWidth * ((marginPercent + 3) / 100);
    if (showTitle) { titleY = currentY + titleSizePx / 2; currentY = titleY + titleSizePx * 0.6; }
    if (showSubtitle) { if (showTitle) currentY += titleSizePx * 0.5; subtitleY = currentY + subtitleSizePx / 2; currentY = subtitleY + subtitleSizePx * 0.7; }
    if (showCoords) { if (showSubtitle) currentY += subtitleSizePx * 0.7; else if (showTitle) currentY += titleSizePx * 0.5; coordsY = currentY + coordsSizePx / 2; }
  } else if (typography.position === 'bottom') {
    let currentY = exportHeight - (exportWidth * ((marginPercent + 5) / 100));
    if (showCoords) { coordsY = currentY - coordsSizePx / 2; currentY = coordsY - coordsSizePx * 0.7; }
    if (showSubtitle) { if (showCoords) currentY -= subtitleSizePx * 0.7; subtitleY = currentY - subtitleSizePx / 2; currentY = subtitleY - subtitleSizePx * 0.6; }
    if (showTitle) { if (showSubtitle) currentY -= subtitleSizePx * 0.6; else if (showCoords) currentY -= coordsSizePx * 0.7; titleY = currentY - titleSizePx / 2; }
  } else {
    const startY = (exportHeight - totalTextHeight) / 2;
    let currentY = startY;
    if (showTitle) { titleY = currentY + titleSizePx / 2; currentY += spacingTitleSub; }
    if (showSubtitle) { subtitleY = currentY + subtitleSizePx / 2; currentY += spacingSubCoords; }
    if (showCoords) { coordsY = currentY + coordsSizePx / 2; }
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

  // Draw Subtitle
  if (showSubtitle) {
    const tracking = 0.2;
    ctx.font = `${subtitleSizePx}px ${typography.subtitleFont}`;
    const textWidth = ctx.measureText(subtitleText).width + (subtitleText.length - 1) * tracking * subtitleSizePx;
    const lineWidth = exportWidth * 0.06;
    const lineGap = exportWidth * 0.02;

    ctx.save();
    ctx.strokeStyle = palette.text;
    ctx.lineWidth = Math.max(1, Math.round(exportScale * 1.5));
    ctx.globalAlpha = 0.4;

    ctx.beginPath();
    ctx.moveTo(exportWidth / 2 - textWidth / 2 - lineGap - lineWidth, subtitleY);
    ctx.lineTo(exportWidth / 2 - textWidth / 2 - lineGap, subtitleY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(exportWidth / 2 + textWidth / 2 + lineGap, subtitleY);
    ctx.lineTo(exportWidth / 2 + textWidth / 2 + lineGap + lineWidth, subtitleY);
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

