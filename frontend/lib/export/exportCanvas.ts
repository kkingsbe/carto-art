import maplibregl from 'maplibre-gl';
import type { Map } from 'maplibre-gl';
import type { PosterConfig } from '@/types/poster';
import { DEFAULT_EXPORT_RESOLUTION } from './constants';
import { calculateTargetResolution } from './resolution';
import { drawMarker, applyTexture, drawCompassRose } from './drawing';
import { drawTextOverlay } from './text-overlay';
import { logger } from '@/lib/logger';
import { createError } from '@/lib/errors/ServerActionError';

interface ExportOptions {
  map: maplibregl.Map;
  config: PosterConfig;
  resolution?: {
    width: number;
    height: number;
    dpi: number;
    name: string;
  };
}

export async function exportMapToPNG(options: ExportOptions): Promise<Blob> {
  const { map: previewMap, config, resolution } = options;

  // 1. CALCULATE ACTUAL RESOLUTION
  let exportResolution: { width: number; height: number; dpi: number; name: string };

  if (resolution && 'width' in resolution) {
    exportResolution = resolution;
  } else {
    exportResolution = calculateTargetResolution(
      (resolution as any) || DEFAULT_EXPORT_RESOLUTION,
      config.format.aspectRatio,
      config.format.orientation
    );
  }

  // Wait for fonts
  try {
    const fontsToLoad = [
      `${config.typography.titleWeight} 10px "${config.typography.titleFont}"`,
      `400 10px "${config.typography.subtitleFont}"`
    ];
    await Promise.all(fontsToLoad.map(font => document.fonts.load(font)));
  } catch (e) {
    logger.warn('Failed to load fonts for export, falling back to system fonts:', e);
  }

  // 2. HEADLESS MAP SETUP
  // Instead of resizing the live map (which React fights against), we spawn a hidden map
  // with the exact export dimensions.

  // Capture state from live map
  const originalStyle = previewMap.getStyle();
  const originalPitch = previewMap.getPitch();
  const originalBearing = previewMap.getBearing();
  const originalCenter = previewMap.getCenter();
  const originalZoom = previewMap.getZoom();

  // Calculate margins first to determine draw size
  const marginPx = Math.round(exportResolution.width * (config.format.margin / 100));
  const drawWidth = exportResolution.width - (marginPx * 2);
  const drawHeight = exportResolution.height - (marginPx * 2);

  // Create hidden container
  // We size the container to the DRAWING AREA (inside margins), not the full resolution.
  // This simplifies the math: the headless map corresponds exactly to the preview map viewport.
  // We will composite it onto the full canvas with margins later.
  const hiddenContainer = document.createElement('div');
  hiddenContainer.style.width = `${drawWidth}px`;
  hiddenContainer.style.height = `${drawHeight}px`;
  hiddenContainer.style.position = 'fixed'; // Fixed to avoid layout impact
  hiddenContainer.style.top = '-9999px';
  hiddenContainer.style.left = '-9999px';
  hiddenContainer.style.visibility = 'hidden';
  hiddenContainer.style.pointerEvents = 'none';
  document.body.appendChild(hiddenContainer);

  let exportMap: Map | null = null;

  try {
    // Initialize export map
    // Calculate the scale factor by comparing the export inner width to the preview inner width
    const containerWidth = previewMap.getContainer().clientWidth;
    const mapExportScale = drawWidth / containerWidth;

    // Size the container to match the TARGET CSS dimensions (preview-like dimensions)
    // The MapLibre pixelRatio will handle the upscaling to the full canvas size
    hiddenContainer.style.width = `${drawWidth / mapExportScale}px`;
    hiddenContainer.style.height = `${drawHeight / mapExportScale}px`;

    // Initialize export map
    exportMap = new maplibregl.Map({
      container: hiddenContainer,
      style: originalStyle as any,
      interactive: false,
      attributionControl: false,
      preserveDrawingBuffer: true,
      fadeDuration: 0,
      pixelRatio: mapExportScale, // Use pixelRatio for resolution scaling instead of zoom
    });

    // Apply explicit state without zoom offset
    exportMap.jumpTo({
      center: originalCenter,
      zoom: originalZoom || 0,
      pitch: originalPitch,
      bearing: originalBearing
    });

    // Wait for load
    await new Promise<void>((resolve, reject) => {
      if (!exportMap) return reject('Map not initialized');

      const timeout = setTimeout(() => reject(new Error('Export timed out')), 15000);

      const checkReady = () => {
        if (exportMap?.loaded()) {
          clearTimeout(timeout);
          // extra frame for safety
          requestAnimationFrame(() => resolve());
        } else {
          exportMap?.once('idle', checkReady);
        }
      };

      if (exportMap.loaded()) {
        checkReady();
      } else {
        exportMap.once('idle', checkReady);
      }
    });

    // 4. DRAWING
    const mapCanvas = exportMap.getCanvas();
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = exportResolution.width;
    exportCanvas.height = exportResolution.height;
    const exportCtx = exportCanvas.getContext('2d');

    if (!exportCtx) throw createError.internalError('Could not create export canvas context');

    // Background
    exportCtx.fillStyle = config.palette.background;
    exportCtx.fillRect(0, 0, exportResolution.width, exportResolution.height);

    // Draw Map (Clipped)
    exportCtx.save();

    const maskShape = config.format.maskShape || 'rectangular';
    if (maskShape === 'circular') {
      const radius = Math.min(drawWidth, drawHeight) / 2;
      const centerX = marginPx + drawWidth / 2;
      const centerY = marginPx + drawHeight / 2;
      exportCtx.beginPath();
      exportCtx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      exportCtx.clip();
    } else {
      exportCtx.beginPath();
      exportCtx.rect(marginPx, marginPx, drawWidth, drawHeight);
      exportCtx.clip();
    }

    // Draw the map. Since the map is sized to DRAW AREA (inner), we offset by marginPx
    exportCtx.drawImage(mapCanvas, marginPx, marginPx);
    exportCtx.restore();

    // 5. DRAW MARKER
    if (config.layers.marker !== false) {
      const markerX = marginPx + drawWidth / 2;
      const markerY = marginPx + drawHeight / 2;
      const markerSize = exportResolution.width * 0.045;
      const markerColor = config.layers.markerColor || config.palette.primary || config.palette.accent || config.palette.text;
      drawMarker(exportCtx, markerX, markerY, markerSize, markerColor, config.layers.markerType || 'crosshair');
    }

    // 6. TEXT OVERLAY
    drawTextOverlay(exportCtx, config, exportResolution.width, exportResolution.height, mapExportScale);

    // 7. BORDER
    if (config.format.borderStyle !== 'none') {
      exportCtx.save();
      exportCtx.strokeStyle = config.palette.accent || config.palette.text;
      const { borderStyle } = config.format;

      if (maskShape === 'circular') {
        const radius = Math.min(drawWidth, drawHeight) / 2;
        const centerX = marginPx + drawWidth / 2;
        const centerY = marginPx + drawHeight / 2;

        if (borderStyle === 'thin') {
          exportCtx.lineWidth = exportResolution.width * 0.005;
          exportCtx.beginPath();
          exportCtx.arc(centerX, centerY, radius, 0, Math.PI * 2);
          exportCtx.stroke();
        } else if (borderStyle === 'thick') {
          exportCtx.lineWidth = exportResolution.width * 0.015;
          exportCtx.beginPath();
          exportCtx.arc(centerX, centerY, radius, 0, Math.PI * 2);
          exportCtx.stroke();
        } else if (borderStyle === 'inset') {
          const inset = exportResolution.width * 0.02;
          exportCtx.lineWidth = exportResolution.width * 0.005;
          exportCtx.beginPath();
          exportCtx.arc(centerX, centerY, radius - inset, 0, Math.PI * 2);
          exportCtx.stroke();
        } else {
          exportCtx.lineWidth = exportResolution.width * 0.005;
          exportCtx.beginPath();
          exportCtx.arc(centerX, centerY, radius, 0, Math.PI * 2);
          exportCtx.stroke();
        }

        // Compass Rose
        if (config.format.compassRose) {
          const compassColor = config.palette.accent || config.palette.text;
          const compassLineWidth = Math.max(1, exportResolution.width * 0.0016);
          const compassFontSize = exportResolution.width * 0.013;
          let borderOuterRadius = radius;

          if (borderStyle === 'thin') {
            borderOuterRadius = radius + (exportResolution.width * 0.005) / 2;
          } else if (borderStyle === 'thick') {
            borderOuterRadius = radius + (exportResolution.width * 0.015) / 2;
          } else if (borderStyle === 'inset') {
            borderOuterRadius = (radius - exportResolution.width * 0.02) + (exportResolution.width * 0.005) / 2;
          } else {
            borderOuterRadius = radius + (exportResolution.width * 0.005) / 2;
          }

          drawCompassRose(exportCtx, centerX, centerY, borderOuterRadius, compassColor, compassLineWidth, compassFontSize);
        }
      } else {
        if (borderStyle === 'thin') {
          exportCtx.lineWidth = exportResolution.width * 0.005;
          exportCtx.strokeRect(marginPx, marginPx, drawWidth, drawHeight);
        } else if (borderStyle === 'thick') {
          exportCtx.lineWidth = exportResolution.width * 0.015;
          exportCtx.strokeRect(marginPx, marginPx, drawWidth, drawHeight);
        } else if (borderStyle === 'inset') {
          const inset = exportResolution.width * 0.02;
          exportCtx.lineWidth = exportResolution.width * 0.005;
          exportCtx.strokeRect(marginPx + inset, marginPx + inset, drawWidth - (inset * 2), drawHeight - (inset * 2));
        } else if (borderStyle === 'double') {
          const doubleGap = exportResolution.width * 0.01;
          exportCtx.lineWidth = exportResolution.width * 0.005;
          exportCtx.strokeRect(marginPx, marginPx, drawWidth, drawHeight);
          exportCtx.strokeRect(marginPx + doubleGap, marginPx + doubleGap, drawWidth - (doubleGap * 2), drawHeight - (doubleGap * 2));
        }
      }
      exportCtx.restore();
    }

    // 8. TEXTURE
    const { texture, textureIntensity = 20 } = config.format;
    if (texture && texture !== 'none') {
      applyTexture(exportCtx, exportResolution.width, exportResolution.height, texture, textureIntensity);
    }

    // 9. WATERMARK
    drawWatermark(exportCtx, exportResolution.width, exportResolution.height);

    return new Promise<Blob>((resolve, reject) => {
      exportCanvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to create blob from canvas'));
      }, 'image/png');
    });

  } finally {
    if (exportMap) exportMap.remove();
    if (document.body.contains(hiddenContainer)) {
      document.body.removeChild(hiddenContainer);
    }
  }
}

function drawWatermark(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): void {
  const watermarkText = 'https://www.cartoart.net';

  // Calculate font size as a percentage of canvas width (small and subtle)
  const fontSize = Math.max(12, Math.round(width * 0.015));
  const padding = Math.max(20, Math.round(width * 0.02));

  ctx.save();
  ctx.font = `${fontSize}px sans-serif`;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'bottom';
  ctx.globalAlpha = 0.5; // Semi-transparent

  // Use a color that contrasts with both light and dark backgrounds
  // Using a gray that should be visible on most backgrounds
  ctx.fillStyle = '#666666';

  const x = width - padding;
  const y = height - padding;

  ctx.fillText(watermarkText, x, y);
  ctx.restore();
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}


