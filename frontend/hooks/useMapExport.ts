'use client';

import { useState, useRef } from 'react';
import type MapLibreGL from 'maplibre-gl';
import type { PosterConfig } from '@/types/poster';
import { exportMapToPNG, downloadBlob } from '@/lib/export/exportCanvas';
import type { ExportResolution } from '@/lib/export/resolution';
import { logger } from '@/lib/logger';
import { trackEventAction } from '@/lib/actions/events';
import { uploadExportThumbnail } from '@/lib/actions/export-storage';
import { getSessionId } from '@/lib/utils';


/**
 * Hook for exporting the map as a high-resolution PNG image.
 * Handles map reference management and export state.
 * 
 * @param config - Current poster configuration for export settings
 * @returns Object containing:
 * - isExporting: Whether an export is currently in progress
 * - exportToPNG: Function to trigger PNG export
 * - setMapRef: Set the MapLibre map instance reference
 * - fitToLocation: Fit map to original location bounds
 * - zoomIn: Zoom in on the map
 * - zoomOut: Zoom out on the map
 * 
 * @example
 * ```tsx
 * const { isExporting, exportToPNG, setMapRef } = useMapExport(config);
 * <MapPreview onMapLoad={setMapRef} />
 * <button onClick={exportToPNG} disabled={isExporting}>Export</button>
 * ```
 */
export function useMapExport(config: PosterConfig) {
  const [isExporting, setIsExportingState] = useState(false);
  const isExportingRef = useRef(false);
  const [exportProgress, setExportProgress] = useState<{ stage: string; percent: number } | null>(null);
  const mapRef = useRef<MapLibreGL.Map | null>(null);

  const setIsExporting = (val: boolean) => {
    isExportingRef.current = val;
    setIsExportingState(val);
  };

  const setMapRef = (map: MapLibreGL.Map | null) => {
    mapRef.current = map;
  };

  const exportToPNG = async (resolution?: ExportResolution, filenameOrEvent?: string | React.MouseEvent) => {
    if (!mapRef.current) {
      throw new Error('Map instance not available');
    }

    const filename = typeof filenameOrEvent === 'string' ? filenameOrEvent : undefined;
    const sessionId = getSessionId();

    // Track export start
    await trackEventAction({
      eventType: 'export_start',
      eventName: 'png_export_started',
      sessionId,
      metadata: {
        resolution: resolution?.name || 'DEFAULT',
        location_name: config.location.name
      }
    });

    setIsExporting(true);
    setExportProgress({ stage: 'Starting...', percent: 0 });

    const startTime = Date.now();
    try {
      const blob = await exportMapToPNG({
        map: mapRef.current,
        config,
        resolution,
        onProgress: (stage, percent) => {
          setExportProgress({ stage, percent });
        }
      });

      setExportProgress({ stage: 'Downloading...', percent: 100 });

      const duration = Date.now() - startTime;
      const exportFilename = filename || `${(config.location.name || 'poster').toString().replace(/[^a-z0-9]/gi, '-').toLowerCase()}-poster.png`;
      downloadBlob(blob, exportFilename);

      setExportProgress({ stage: 'Download started!', percent: 100 });

      // Generate and upload thumbnail for admin feed
      let thumbnailUrl: string | undefined;
      try {
        const thumbnailBlob = await createThumbnailFromBlob(blob, 400);
        const formData = new FormData();
        formData.append('file', thumbnailBlob, 'thumbnail.png');
        thumbnailUrl = await uploadExportThumbnail(formData);
      } catch (thumbError) {
        logger.error('Failed to create/upload thumbnail for admin feed:', thumbError);
        // Don't fail the whole export just because thumbnail failed
      }

      // Track export event
      await trackEventAction({
        eventType: 'poster_export',
        eventName: 'Poster Exported (In-App)',
        sessionId: getSessionId(),
        metadata: {
          location_name: config.location.name,
          location_coords: config.location.center,
          style_id: config.style.id,
          style_name: config.style.name,
          resolution: resolution || { name: 'DEFAULT', width: 2400, height: 3600, dpi: 300 }, // Default if not provided
          source: 'in-app',
          render_time_ms: duration,
          thumbnail_url: thumbnailUrl // Added thumbnail URL to metadata
        }
      });


      // Keep modal open for a few seconds to ensure download starts
      await new Promise(resolve => setTimeout(resolve, 2000));

      return blob;
    } catch (error) {
      // Track export failure
      await trackEventAction({
        eventType: 'export_fail',
        eventName: 'png_export_failed',
        sessionId,
        metadata: {
          resolution: resolution?.name || 'DEFAULT',
          error: error instanceof Error ? error.message : 'Unknown error',
          duration_ms: Date.now() - startTime
        }
      });
      logger.error('Export failed:', error);
      throw error;
    } finally {
      setIsExporting(false);
      setExportProgress(null);
    }
  };

  const fitToLocation = () => {
    if (!mapRef.current) return;
    const { bounds } = config.location;
    mapRef.current.fitBounds(bounds as [[number, number], [number, number]], {
      padding: 40,
      duration: 1000,
    });
  };

  const zoomIn = () => {
    if (!mapRef.current) return;
    mapRef.current.zoomIn({ duration: 300 });
  };

  const zoomOut = () => {
    if (!mapRef.current) return;
    mapRef.current.zoomOut({ duration: 300 });
  };

  return {
    isExporting,
    isExportingRef,
    exportProgress,
    exportToPNG,
    setMapRef,
    fitToLocation,
    zoomIn,
    zoomOut,
  };
}

/**
 * Helper to create a small thumbnail from a high-res blob
 */
async function createThumbnailFromBlob(blob: Blob, maxDimension: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxDimension) {
          height *= maxDimension / width;
          width = maxDimension;
        }
      } else {
        if (height > maxDimension) {
          width *= maxDimension / height;
          height = maxDimension;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob((result) => {
        if (result) resolve(result);
        else reject(new Error('Thumbnail generation failed'));
      }, 'image/png');
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(blob);
  });
}
