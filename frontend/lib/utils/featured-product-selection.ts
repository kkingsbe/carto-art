/**
 * Featured Product Auto-Selection Logic
 * 
 * Automatically selects the best product type for a featured map based on
 * image characteristics (aspect ratio, orientation).
 * 
 * Selection Rules:
 * - Wide/panoramic maps (aspect ratio > 1.5) → Canvas (ID: 3)
 * - Tall/portrait maps (aspect ratio < 0.75) → Framed Poster (ID: 1)
 * - Standard/square-ish maps → Poster (ID: 2)
 */

import { ProductGroup } from './store';
import { getImageDimensionsSafe, categorizeAspectRatio, ImageDimensions } from './image-dimensions';

// Product IDs based on database schema
export const PRODUCT_IDS = {
  FRAMED_POSTER: 1,
  POSTER: 2,
  CANVAS: 3,
} as const;

// Default product if auto-selection fails
export const DEFAULT_PRODUCT_ID = PRODUCT_IDS.POSTER;

export interface ProductRecommendation {
  productId: number;
  productTitle: string;
  reason: string;
  startingPrice: number;
  confidence: 'high' | 'medium' | 'low';
}

export interface FeaturedProductSelection {
  recommended: ProductRecommendation;
  alternatives: ProductRecommendation[];
  imageDimensions: ImageDimensions | null;
}

/**
 * Get the recommended product for a featured map based on image dimensions
 */
export function getRecommendedProductFromDimensions(
  dimensions: ImageDimensions | null,
  products: ProductGroup[]
): ProductRecommendation {
  // If we can't determine dimensions, default to Poster
  if (!dimensions) {
    const posterProduct = products.find(p => p.id === PRODUCT_IDS.POSTER);
    return {
      productId: PRODUCT_IDS.POSTER,
      productTitle: posterProduct?.title || 'Poster',
      reason: 'Classic format for any map design',
      startingPrice: posterProduct?.startingPrice || 3900,
      confidence: 'low',
    };
  }

  const category = categorizeAspectRatio(dimensions.aspectRatio);

  switch (category) {
    case 'wide': {
      // Panoramic/landscape → Canvas
      const canvasProduct = products.find(p => p.id === PRODUCT_IDS.CANVAS);
      return {
        productId: PRODUCT_IDS.CANVAS,
        productTitle: canvasProduct?.title || 'Canvas',
        reason: 'Panoramic format ideal for canvas prints',
        startingPrice: canvasProduct?.startingPrice || 8900,
        confidence: 'high',
      };
    }
    case 'tall': {
      // Very portrait → Framed Poster
      const framedProduct = products.find(p => p.id === PRODUCT_IDS.FRAMED_POSTER);
      return {
        productId: PRODUCT_IDS.FRAMED_POSTER,
        productTitle: framedProduct?.title || 'Framed Poster',
        reason: 'Portrait format perfect for elegant framing',
        startingPrice: framedProduct?.startingPrice || 7900,
        confidence: 'high',
      };
    }
    default: {
      // Standard/square → Poster (budget-friendly default)
      const posterProduct = products.find(p => p.id === PRODUCT_IDS.POSTER);
      return {
        productId: PRODUCT_IDS.POSTER,
        productTitle: posterProduct?.title || 'Poster',
        reason: 'Versatile format for any space',
        startingPrice: posterProduct?.startingPrice || 3900,
        confidence: 'medium',
      };
    }
  }
}

/**
 * Get all product options sorted by recommendation
 */
export function getAllProductOptions(
  dimensions: ImageDimensions | null,
  products: ProductGroup[]
): ProductRecommendation[] {
  const recommended = getRecommendedProductFromDimensions(dimensions, products);
  
  // Build list of all products with recommendations
  const allOptions: ProductRecommendation[] = products.map(product => {
    if (product.id === recommended.productId) {
      return recommended;
    }
    
    // Generate reason for non-recommended products
    let reason = '';
    let confidence: 'high' | 'medium' | 'low' = 'medium';
    
    switch (product.id) {
      case PRODUCT_IDS.CANVAS:
        reason = 'Gallery-wrapped canvas for a modern look';
        confidence = dimensions && dimensions.aspectRatio > 1.2 ? 'medium' : 'low';
        break;
      case PRODUCT_IDS.FRAMED_POSTER:
        reason = 'Premium framed presentation';
        confidence = dimensions && dimensions.aspectRatio < 1.0 ? 'medium' : 'low';
        break;
      case PRODUCT_IDS.POSTER:
        reason = 'Affordable print for any budget';
        confidence = 'medium';
        break;
      default:
        reason = product.description || 'Quality print option';
    }
    
    return {
      productId: product.id,
      productTitle: product.title,
      reason,
      startingPrice: product.startingPrice,
      confidence,
    };
  });
  
  // Sort: recommended first, then by confidence, then by price
  return allOptions.sort((a, b) => {
    if (a.productId === recommended.productId) return -1;
    if (b.productId === recommended.productId) return 1;
    
    const confidenceOrder = { high: 0, medium: 1, low: 2 };
    const confDiff = confidenceOrder[a.confidence] - confidenceOrder[b.confidence];
    if (confDiff !== 0) return confDiff;
    
    return a.startingPrice - b.startingPrice;
  });
}

/**
 * Main function: Get featured product selection for a map image
 */
export async function getFeaturedProductSelection(
  imageUrl: string,
  products: ProductGroup[]
): Promise<FeaturedProductSelection> {
  // Get image dimensions
  const dimensions = await getImageDimensionsSafe(imageUrl);
  
  // Get recommended product
  const recommended = getRecommendedProductFromDimensions(dimensions, products);
  
  // Get alternatives (all other products)
  const allOptions = getAllProductOptions(dimensions, products);
  const alternatives = allOptions.filter(p => p.productId !== recommended.productId);
  
  return {
    recommended,
    alternatives,
    imageDimensions: dimensions,
  };
}

/**
 * Synchronous version using pre-fetched dimensions
 * Use this when dimensions are already available
 */
export function getFeaturedProductSelectionSync(
  dimensions: ImageDimensions | null,
  products: ProductGroup[]
): FeaturedProductSelection {
  const recommended = getRecommendedProductFromDimensions(dimensions, products);
  const allOptions = getAllProductOptions(dimensions, products);
  const alternatives = allOptions.filter(p => p.productId !== recommended.productId);
  
  return {
    recommended,
    alternatives,
    imageDimensions: dimensions,
  };
}

/**
 * Format price for display
 */
export function formatPrice(cents: number): string {
  return `$${Math.ceil(cents / 100)}`;
}

/**
 * Get product URL with image parameter
 */
export function getProductUrl(productId: number, imageUrl: string): string {
  return `/store/${productId}?image=${encodeURIComponent(imageUrl)}`;
}
