import type MapLibreGL from 'maplibre-gl';
import type { PosterConfig } from '@/types/poster';
import { exportMapToPNG } from './exportCanvas';
import { THUMBNAIL_MAX_DIMENSION, THUMBNAIL_QUALITY, THUMBNAIL_DPI } from '@/lib/constants/limits';

/**
 * Generate a thumbnail blob from a map instance
 * Uses lower resolution than full export (800px max dimension)
 */
export async function generateThumbnail(
  map: MapLibreGL.Map,
  config: PosterConfig
): Promise<Blob> {
  // Calculate thumbnail resolution based on aspect ratio
  const aspectRatio = config.format.aspectRatio === '2:3' 
    ? 2/3 
    : config.format.aspectRatio === '3:4'
    ? 3/4
    : config.format.aspectRatio === '4:5'
    ? 4/5
    : config.format.aspectRatio === '1:1'
    ? 1
    : 210/297; // ISO A4

  const maxDimension = THUMBNAIL_MAX_DIMENSION;
  let width: number;
  let height: number;

  if (config.format.orientation === 'portrait') {
    height = maxDimension;
    width = Math.round(height * aspectRatio);
  } else {
    width = maxDimension;
    height = Math.round(width / aspectRatio);
  }

  // Generate PNG blob using existing export function with custom resolution
  const blob = await exportMapToPNG({
    map,
    config,
    resolution: {
      width,
      height,
      dpi: THUMBNAIL_DPI,
      name: 'thumbnail',
    },
  });

  // Convert PNG to WebP for smaller file size
  // Note: This requires a canvas conversion
  return convertToWebP(blob);
}

/**
 * Convert PNG blob to WebP blob
 */
async function convertToWebP(pngBlob: Blob): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not create canvas context'));
        return;
      }
      ctx.drawImage(img, 0, 0);
      canvas.toBlob(
        (webpBlob) => {
          if (webpBlob) {
            resolve(webpBlob);
          } else {
            // Fallback to PNG if WebP is not supported
            resolve(pngBlob);
          }
        },
        'image/webp',
        THUMBNAIL_QUALITY
      );
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(pngBlob);
  });
}

