import maplibregl from 'maplibre-gl';
import type { Map } from 'maplibre-gl';
import type { PosterConfig } from '@/types/poster';
import { DEFAULT_EXPORT_RESOLUTION } from './constants';
import { calculateTargetResolution } from './resolution';
import { drawMarker, applyTexture, drawCompassRose, drawTextWithHalo } from './drawing';
import { drawTextOverlay } from './text-overlay';
import { renderDeckTerrain } from './deck-render';
import { logger } from '@/lib/logger';
import { createError } from '@/lib/errors/ServerActionError';
import { getStyleById } from '@/lib/styles';
import { applyPaletteToStyle } from '@/lib/styles/applyPalette';
import { setupMapLibreContour } from '@/lib/map/setup';

// Ensure protocols are registered for headless exports
if (typeof window !== 'undefined') {
  setupMapLibreContour(maplibregl);
}

interface ExportOptions {
  map?: maplibregl.Map;
  config: PosterConfig;
  resolution?: {
    width: number;
    height: number;
    dpi: number;
    name: string;
  };
  onProgress?: (stage: string, percent: number) => void;
}

export async function exportMapToPNG(options: ExportOptions): Promise<Blob> {
  const { map: previewMap, config, resolution, onProgress } = options;

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

  onProgress?.('Initializing...', 5);

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

  let originalStyle: any;
  let originalPitch = 0;
  let originalBearing = 0;
  let originalCenter: maplibregl.LngLatLike;
  let originalZoom = 12;
  let containerWidth = 1000; // Default reference width for scaling

  if (previewMap) {
    // Capture state from live map, but prefer config values for camera orientation
    originalStyle = previewMap.getStyle();
    // Use config as primary source of truth for camera, fallback to map state
    originalPitch = config.layers.buildings3DPitch ?? previewMap.getPitch();
    originalBearing = config.layers.buildings3DBearing ?? previewMap.getBearing();
    originalCenter = previewMap.getCenter();
    originalZoom = previewMap.getZoom();

    const cw = previewMap.getContainer().clientWidth;
    if (cw) containerWidth = cw;
  } else {
    // Reconstruct state from config for headless export
    logger.info('Running headless export - reconstructing map state from config');

    // Get base style
    const baseStyle = getStyleById(config.style.id as string);
    if (!baseStyle) {
      throw createError.validationError(`Style not found: ${config.style.id}`);
    }

    // Apply palette and layers
    originalStyle = applyPaletteToStyle(
      baseStyle.mapStyle,
      config.palette,
      config.layers,
      baseStyle.layerToggles
    );

    originalPitch = config.layers.buildings3DPitch ?? 0;
    originalBearing = config.layers.buildings3DBearing ?? 0;
    originalCenter = config.location.center;
    originalZoom = config.location.zoom;
  }

  logger.info('Export Camera Capture', {
    originalPitch,
    originalBearing,
    configPitch: config.layers.buildings3DPitch,
    originalCenter,
    originalZoom,
    isHeadless: !previewMap
  });

  // Calculate margins first to determine draw size
  const marginPx = Math.round(exportResolution.width * (config.format.margin / 100));
  const drawWidth = Math.max(1, Math.floor(exportResolution.width - (marginPx * 2)));
  const drawHeight = Math.max(1, Math.floor(exportResolution.height - (marginPx * 2)));

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
  hiddenContainer.style.opacity = '0';
  hiddenContainer.style.pointerEvents = 'none';
  document.body.appendChild(hiddenContainer);

  let exportMap: Map | null = null;

  try {
    // Initialize export map
    // Calculate the scale factor by comparing the export inner width to the preview inner width
    const mapExportScale = drawWidth / containerWidth;

    logger.info('Initializing High-Res Export', {
      drawWidth,
      drawHeight,
      containerWidth,
      mapExportScale,
      targetCanvasWidth: drawWidth
    });

    // Size the container to match the TARGET CSS dimensions (preview-like dimensions)
    // The MapLibre pixelRatio will handle the upscaling to the full canvas size
    hiddenContainer.style.width = `${containerWidth}px`;
    hiddenContainer.style.height = `${drawHeight / mapExportScale}px`;

    // Prepare export style - strip native terrain if using volumetric terrain
    // to ensure the base map is rendered flat for use as a deck.gl texture
    let exportStyle = originalStyle as any;
    if (config.layers.volumetricTerrain && exportStyle) {
      exportStyle = JSON.parse(JSON.stringify(exportStyle));
      delete exportStyle.terrain;
      delete exportStyle.fog;
    }

    onProgress?.('Loading map...', 10);

    // Initialize export map
    exportMap = new maplibregl.Map({
      container: hiddenContainer,
      style: exportStyle,
      interactive: false,
      attributionControl: false,
      preserveDrawingBuffer: true,
      trackResize: false, // Critical: prevent auto-resize which might reset pixelRatio
      fadeDuration: 0,
      pixelRatio: mapExportScale, // Use pixelRatio for resolution scaling instead of zoom
      maxCanvasSize: [16384, 16384], // Increase from default 4096 to support ultra-high res
      center: originalCenter,
      zoom: originalZoom || 0,
      // If using deck.gl terrain, we render the map FLAT (top-down) to use as a texture
      pitch: config.layers.volumetricTerrain ? 0 : (originalPitch || 0),
      bearing: config.layers.volumetricTerrain ? 0 : (originalBearing || 0)
    });

    // For headless exports, use bounds to ensure consistent framing
    // This is critical because the export canvas size differs from preview size
    if (!previewMap && config.location.bounds) {
      logger.info('Applying bounds for headless export', { bounds: config.location.bounds });
      exportMap.fitBounds(config.location.bounds, {
        padding: 0,
        duration: 0,
        pitch: config.layers.volumetricTerrain ? 0 : (originalPitch || 0),
        bearing: config.layers.volumetricTerrain ? 0 : (originalBearing || 0)
      });
    } else {
      // For live map exports or when bounds unavailable, use center+zoom
      exportMap.jumpTo({
        center: originalCenter,
        zoom: originalZoom || 0,
        pitch: config.layers.volumetricTerrain ? 0 : (originalPitch || 0),
        bearing: config.layers.volumetricTerrain ? 0 : (originalBearing || 0)
      });
    }

    // Force a resize to ensure the map respects the pixelRatio and container dimensions
    // This addresses issues where the initial canvas size might default to 1x scale
    exportMap.resize();

    // Closed-loop tile loading detection
    // Uses MapLibre events to deterministically wait for all tiles to be loaded and rendered
    await new Promise<void>((resolve, reject) => {
      if (!exportMap) return reject('Map not initialized');

      // Track source loading states - closed loop, no arbitrary timeouts
      // Using plain object to avoid conflict with MapLibre's Map type
      const sourceLoadingStates: Record<string, boolean> = {};
      let isSettled = false;
      let settleCheckScheduled = false;

      const cleanup = () => {
        if (!exportMap) return;
        exportMap.off('sourcedata', onSourceData);
        exportMap.off('idle', onIdle);
        exportMap.off('error', onError);
      };

      const onError = (e: any) => {
        logger.error('Map error during export', e);
        cleanup();
        reject(new Error(`Map error during export: ${e.error?.message || 'Unknown error'}`));
      };

      const onSourceData = (e: any) => {
        if (e.sourceId && e.isSourceLoaded !== undefined) {
          sourceLoadingStates[e.sourceId] = e.isSourceLoaded;
          logger.debug('Source data event', { sourceId: e.sourceId, isLoaded: e.isSourceLoaded });

          // Estimate progress based on sources
          const sourceIds = Object.keys(sourceLoadingStates);
          const loadedCount = sourceIds.filter(id => sourceLoadingStates[id]).length;
          const mapProgress = 10 + Math.round((loadedCount / Math.max(1, sourceIds.length)) * 30);
          onProgress?.('Loading tiles...', Math.min(40, mapProgress));
        }
      };

      const checkAllLoaded = (): boolean => {
        if (!exportMap) return false;

        // Primary check: MapLibre's built-in methods
        const mapLoaded = exportMap.loaded();
        const tilesLoaded = exportMap.areTilesLoaded();

        // Secondary check: verify no sources are still loading
        const sourceIds = Object.keys(sourceLoadingStates);
        const allSourcesLoaded = sourceIds.every((id) => sourceLoadingStates[id] === true);

        logger.info('Export load check', {
          mapLoaded,
          tilesLoaded,
          allSourcesLoaded,
          sourceCount: sourceIds.length
        });

        return mapLoaded && tilesLoaded && allSourcesLoaded;
      };

      const scheduleSettleCheck = () => {
        if (settleCheckScheduled || isSettled) return;
        settleCheckScheduled = true;

        // After idle, verify loading state is stable across multiple frames
        // This ensures the GPU has finished rendering
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            settleCheckScheduled = false;

            if (isSettled) return;

            if (checkAllLoaded()) {
              // Double-check on next frame to ensure stability
              requestAnimationFrame(() => {
                if (checkAllLoaded()) {
                  isSettled = true;
                  cleanup();
                  logger.info('Export map fully loaded - proceeding with capture');
                  onProgress?.('Map loaded!', 40);
                  resolve();
                } else {
                  // State changed, wait for next idle
                  logger.info('Load state changed during settle check, waiting...');
                }
              });
            }
          });
        });
      };

      const onIdle = () => {
        if (isSettled) return;
        scheduleSettleCheck();
      };

      // Set up event listeners
      exportMap.on('sourcedata', onSourceData);
      exportMap.on('idle', onIdle);
      exportMap.on('error', onError);

      // Handle case where map is already loaded
      if (exportMap.loaded()) {
        scheduleSettleCheck();
      }
    });

    onProgress?.('Compositing...', 45);

    // 4. DRAWING
    const mapCanvas = exportMap.getCanvas();
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = exportResolution.width;
    exportCanvas.height = exportResolution.height;
    const exportCtx = exportCanvas.getContext('2d');
    if (!exportCtx) throw createError.internalError('Could not create export canvas context');

    // Debug map canvas
    if (mapCanvas) {
      logger.info('MapCanvas dimensions', {
        width: mapCanvas.width,
        height: mapCanvas.height,
        expectedWidth: drawWidth,
        expectedHeight: drawHeight,
        pixelRatio: mapExportScale,
        containerSize: {
          width: hiddenContainer.style.width,
          height: hiddenContainer.style.height
        }
      });
    }

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

    // Volumetric 3D Terrain is currently disabled during export
    // The deck.gl terrain rendering causes memory issues on high-resolution exports.
    // This is an experimental preview-only feature.
    if (config.layers.volumetricTerrain) {
      logger.warn('Volumetric 3D Terrain is experimental and disabled during export. The preview effect will not appear in exports.');
    }
    exportCtx.restore();



    onProgress?.('Drawing overlays...', 80);

    // 6. TEXT OVERLAY
    drawTextOverlay(exportCtx, config, exportResolution.width, exportResolution.height, mapExportScale);

    onProgress?.('Finalizing...', 90);

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

    // 9. DRAW MARKER (Rendered above texture)
    if (config.layers.marker !== false) {
      const markerX = marginPx + drawWidth / 2;
      const markerY = marginPx + drawHeight / 2;
      // Match the preview's fixed size (40px) scaled up by the export scale
      const markerSize = 40 * mapExportScale;
      const markerColor = config.layers.markerColor || config.palette.primary || config.palette.accent || config.palette.text;
      drawMarker(exportCtx, markerX, markerY, markerSize, markerColor, config.layers.markerType || 'crosshair');
    }

    // 9.1 DRAW CUSTOM MARKERS
    if (config.markers && config.markers.length > 0 && exportMap) {
      config.markers.forEach(marker => {
        const { x, y } = exportMap!.project([marker.lng, marker.lat]);
        const markerX = marginPx + (x * mapExportScale);
        const markerY = marginPx + (y * mapExportScale);
        const markerSize = (marker.size || 30) * mapExportScale;

        drawMarker(exportCtx, markerX, markerY, markerSize, marker.color, marker.type);

        if (marker.label) {
          const fontSize = (marker.labelSize || 14) * mapExportScale;
          const labelY = markerY + (markerSize / 2) + (fontSize / 2) + (4 * mapExportScale); // Offset below marker

          let haloColor = 'rgba(255,255,255,0.8)';
          let textColor = marker.labelColor || config.palette.text;

          if (marker.labelStyle === 'elevated') {
            // Draw pill background? For now, stick to text with halo/shadow or just use drawTextWithHalo
            // drawTextWithHalo doesn't do background pills.
            // We'll simulate standard text with strong halo for now
          }

          drawTextWithHalo(exportCtx, marker.label, markerX, labelY, fontSize, {
            fontFamily: config.typography.subtitleFont, // Use subtitle font for consistency
            weight: 500,
            textColor: textColor,
            haloColor: haloColor,
            showHalo: true,
            opacity: 1
          });
        }
      });
    }

    // 10. WATERMARK
    drawWatermark(exportCtx, exportResolution.width, exportResolution.height);

    // 11. ATTRIBUTION
    drawAttribution(exportCtx, exportResolution.width, exportResolution.height, mapExportScale);

    onProgress?.('Preparing file...', 95);

    return new Promise<Blob>((resolve, reject) => {
      exportCanvas.toBlob((blob) => {
        if (blob) {
          onProgress?.('Done!', 100);
          resolve(blob);
        }
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

function drawAttribution(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  scale: number
): void {
  const attributionText = '© OpenFreeMap © OpenStreetMap';

  // Calculate font size (very small and subtle)
  const fontSize = Math.max(8, Math.round(width * 0.008));
  const padding = Math.max(10, Math.round(width * 0.01));

  ctx.save();
  ctx.font = `${fontSize}px sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'bottom';
  ctx.globalAlpha = 0.4; // More subtle than watermark

  // Use a neutral gray
  ctx.fillStyle = '#666666';

  const x = padding;
  const y = height - padding;

  ctx.fillText(attributionText, x, y);
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


