'use client';

import { useState, useRef } from 'react';
import type MapLibreGL from 'maplibre-gl';
import type { PosterConfig } from '@/types/poster';
import { exportMapToPNG, downloadBlob } from '@/lib/export/exportCanvas';
import type { ExportResolution } from '@/lib/export/resolution';
import { logger } from '@/lib/logger';

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
  const [isExporting, setIsExporting] = useState(false);
  const mapRef = useRef<MapLibreGL.Map | null>(null);

  const setMapRef = (map: MapLibreGL.Map | null) => {
    mapRef.current = map;
  };

  const exportToPNG = async (resolution?: ExportResolution, filenameOrEvent?: string | React.MouseEvent) => {
    if (!mapRef.current) {
      throw new Error('Map instance not available');
    }

    const filename = typeof filenameOrEvent === 'string' ? filenameOrEvent : undefined;

    setIsExporting(true);
    try {
      const blob = await exportMapToPNG({
        map: mapRef.current,
        config,
        resolution,
      });

      const exportFilename = filename || `${(config.location.name || 'poster').toString().replace(/[^a-z0-9]/gi, '-').toLowerCase()}-poster.png`;
      downloadBlob(blob, exportFilename);
    } catch (error) {
      logger.error('Export failed:', error);
      throw error;
    } finally {
      setIsExporting(false);
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
    exportToPNG,
    setMapRef,
    fitToLocation,
    zoomIn,
    zoomOut,
  };
}

