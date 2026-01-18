/**
 * Utility for fetching image dimensions from URLs
 * Used for featured product auto-selection based on aspect ratio
 */

export interface ImageDimensions {
  width: number;
  height: number;
  aspectRatio: number;
}

/**
 * Fetches image dimensions from a URL using the browser's Image API
 * Works client-side only
 */
export function getImageDimensionsClient(imageUrl: string): Promise<ImageDimensions> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
        aspectRatio: img.naturalWidth / img.naturalHeight,
      });
    };
    
    img.onerror = () => {
      reject(new Error(`Failed to load image: ${imageUrl}`));
    };
    
    img.src = imageUrl;
  });
}

/**
 * Fetches image dimensions from a URL using fetch + blob
 * Works in both client and server environments
 */
export async function getImageDimensionsFromBlob(imageUrl: string): Promise<ImageDimensions> {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }
    
    const blob = await response.blob();
    const bitmap = await createImageBitmap(blob);
    
    return {
      width: bitmap.width,
      height: bitmap.height,
      aspectRatio: bitmap.width / bitmap.height,
    };
  } catch (error) {
    throw new Error(`Failed to get image dimensions: ${error}`);
  }
}

/**
 * Attempts to get image dimensions, with fallback to default
 * Returns null if unable to determine dimensions
 */
export async function getImageDimensionsSafe(imageUrl: string): Promise<ImageDimensions | null> {
  try {
    // Try client-side approach first (faster, no network request if cached)
    if (typeof window !== 'undefined') {
      return await getImageDimensionsClient(imageUrl);
    }
    // Fall back to blob approach for server-side
    return await getImageDimensionsFromBlob(imageUrl);
  } catch (error) {
    console.warn('Failed to get image dimensions:', error);
    return null;
  }
}

/**
 * Determines orientation based on aspect ratio
 */
export function getImageOrientation(aspectRatio: number): 'landscape' | 'portrait' | 'square' {
  if (aspectRatio > 1.1) return 'landscape';
  if (aspectRatio < 0.9) return 'portrait';
  return 'square';
}

/**
 * Categorizes aspect ratio for product selection
 */
export function categorizeAspectRatio(aspectRatio: number): 'wide' | 'tall' | 'standard' {
  if (aspectRatio > 1.5) return 'wide';      // Panoramic/wide
  if (aspectRatio < 0.75) return 'tall';     // Very portrait
  return 'standard';                          // Square-ish to moderate portrait/landscape
}
