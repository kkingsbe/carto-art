import type MapLibreGL from 'maplibre-gl';
import type { PosterConfig } from '@/types/poster';
import { DEFAULT_EXPORT_RESOLUTION } from './constants';
import { calculateTargetResolution } from './resolution';
import { drawMarker, applyTexture, drawCompassRose } from './drawing';
import { drawTextOverlay } from './text-overlay';
import { logger } from '@/lib/logger';
import { createError } from '@/lib/errors/ServerActionError';

interface ExportOptions {
  map: MapLibreGL.Map;
  config: PosterConfig;
  resolution?: {
    width: number;
    height: number;
    dpi: number;
    name: string;
  };
}

export async function exportMapToPNG(options: ExportOptions): Promise<Blob> {
  const { map, config, resolution = DEFAULT_EXPORT_RESOLUTION } = options;

  // 1. CALCULATE ACTUAL RESOLUTION
  const exportResolution = calculateTargetResolution(
    resolution,
    config.format.aspectRatio,
    config.format.orientation
  );

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

  // 2. GATHER DIMENSIONS & SCALING
  const container = map.getContainer();
  const posterElement = container.closest('[style*="aspect-ratio"]');
  const rect = (posterElement || container).getBoundingClientRect();
  const logicalWidth = rect.width;
  
  const exportScale = exportResolution.width / logicalWidth;
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio : 1;
  const featureScale = exportResolution.width / (logicalWidth * dpr);
  const zoomOffset = Math.log2(featureScale);

  const originalWidth = map.getCanvas().width;
  const originalHeight = map.getCanvas().height;
  const originalZoom = map.getZoom();
  const originalMaxZoom = (map as any).getMaxZoom?.();

  try {
    const marginPx = Math.round(exportResolution.width * (config.format.margin / 100));
    const drawWidth = exportResolution.width - (marginPx * 2);
    const drawHeight = exportResolution.height - (marginPx * 2);

    // 3. APPLY HIGH-RES SCALING TO MAP
    if (typeof (map as any).setMaxZoom === 'function') {
      (map as any).setMaxZoom(24); // Temporarily allow higher zoom for export
    }
    map.setZoom(originalZoom + zoomOffset);
    map.getCanvas().width = drawWidth;
    map.getCanvas().height = drawHeight;
    
    map.jumpTo({
      center: config.location.center,
      zoom: originalZoom + zoomOffset
    });

    map.resize();

    await new Promise<void>(resolve => {
      map.once('idle', resolve);
    });

    const mapCanvas = map.getCanvas();
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = exportResolution.width;
    exportCanvas.height = exportResolution.height;
    const exportCtx = exportCanvas.getContext('2d');
    
    if (!exportCtx) throw createError.internalError('Could not create export canvas context');

    // Background
    exportCtx.fillStyle = config.palette.background;
    exportCtx.fillRect(0, 0, exportResolution.width, exportResolution.height);

    // 4. DRAW MAP
    exportCtx.save();
    exportCtx.beginPath();
    const maskShape = config.format.maskShape || 'rectangular';
    if (maskShape === 'circular') {
      const radius = Math.min(drawWidth, drawHeight) / 2;
      const centerX = marginPx + drawWidth / 2;
      const centerY = marginPx + drawHeight / 2;
      exportCtx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    } else {
      exportCtx.rect(marginPx, marginPx, drawWidth, drawHeight);
    }
    exportCtx.clip();
    exportCtx.drawImage(mapCanvas, marginPx, marginPx, drawWidth, drawHeight);
    exportCtx.restore();

    // 5. DRAW MARKER
    if (config.layers.marker) {
      const markerX = marginPx + drawWidth / 2;
      const markerY = marginPx + drawHeight / 2;
      const markerSize = exportResolution.width * 0.045;
      const markerColor = config.layers.markerColor || config.palette.primary || config.palette.accent || config.palette.text;
      drawMarker(exportCtx, markerX, markerY, markerSize, markerColor, config.layers.markerType || 'crosshair');
    }

    // 6. TEXT OVERLAY
    drawTextOverlay(exportCtx, config, exportResolution.width, exportResolution.height, exportScale);

    // 7. BORDER
    if (config.format.borderStyle !== 'none') {
      exportCtx.save();
      exportCtx.strokeStyle = config.palette.accent || config.palette.text;
      exportCtx.lineWidth = exportResolution.width * 0.005;
      
      const { borderStyle } = config.format;
      const maskShape = config.format.maskShape || 'rectangular';
      
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
          // Default fallback for 'double' or any other border style
          exportCtx.lineWidth = exportResolution.width * 0.005;
          exportCtx.beginPath();
          exportCtx.arc(centerX, centerY, radius, 0, Math.PI * 2);
          exportCtx.stroke();
        }
        
        // Draw compass rose if enabled and mask is circular
        if (config.format.compassRose) {
          const compassColor = config.palette.accent || config.palette.text;
          const compassLineWidth = Math.max(1, exportResolution.width * 0.002);
          const compassFontSize = exportResolution.width * 0.018;
          
          // Calculate the outer edge of the border
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
          
          drawCompassRose(
            exportCtx,
            centerX,
            centerY,
            borderOuterRadius,
            compassColor,
            compassLineWidth,
            compassFontSize
          );
        }
      } else {
        if (borderStyle === 'thin') {
          exportCtx.strokeRect(marginPx, marginPx, drawWidth, drawHeight);
        } else if (borderStyle === 'thick') {
          exportCtx.lineWidth = exportResolution.width * 0.015;
          exportCtx.strokeRect(marginPx, marginPx, drawWidth, drawHeight);
        } else if (borderStyle === 'inset') {
          const inset = exportResolution.width * 0.02;
          exportCtx.strokeRect(marginPx + inset, marginPx + inset, drawWidth - (inset * 2), drawHeight - (inset * 2));
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
    map.setZoom(originalZoom);
    if (typeof (map as any).setMaxZoom === 'function' && originalMaxZoom !== undefined) {
      (map as any).setMaxZoom(originalMaxZoom);
    }
    map.getCanvas().width = originalWidth;
    map.getCanvas().height = originalHeight;
    map.resize();
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
