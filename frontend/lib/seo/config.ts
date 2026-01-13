/**
 * Shared SEO configuration for consistent metadata across all pages.
 */

export const seoConfig = {
  siteName: 'Carto-Art',
  locale: 'en_US',
  defaultImage: {
    url: '/hero.jpg',
    width: 1200,
    height: 630,
    alt: 'Carto-Art - Free Map Poster Maker',
  },
} as const;

/**
 * Helper to create consistent OpenGraph image metadata
 */
export function createOgImage(
  url: string,
  alt: string,
  width = 1200,
  height = 630
) {
  return {
    url,
    width,
    height,
    alt,
  };
}

/**
 * Helper to create complete Twitter metadata
 */
export function createTwitterMeta(
  title: string,
  description: string,
  image?: string
) {
  return {
    card: 'summary_large_image' as const,
    title,
    description,
    images: image ? [image] : [seoConfig.defaultImage.url],
  };
}
