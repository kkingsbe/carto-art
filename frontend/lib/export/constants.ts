// Export resolution constants

export const EXPORT_RESOLUTIONS = {
  SOCIAL: {
    name: 'Social Media',
    longEdge: 2048,
    dpi: 72,
    description: 'Perfect for sharing on Instagram or Twitter'
  },
  SMALL: {
    name: 'Small Print',
    longEdge: 3600, // 12" at 300 DPI
    dpi: 300,
    description: 'Good for 8x10" or 11x14" prints'
  },
  MEDIUM: {
    name: 'Medium Print',
    longEdge: 5400, // 18" at 300 DPI
    dpi: 300,
    description: 'Standard poster sizes like 16x20" or 18x24"'
  },
  LARGE: {
    name: 'High Resolution',
    longEdge: 7200, // 24" at 300 DPI
    dpi: 300,
    description: 'Large format prints up to 24x36"'
  },
  ULTRA: {
    name: 'Ultra High Res',
    longEdge: 10800, // 36" at 300 DPI
    dpi: 300,
    description: 'Maximum quality for professional printing'
  },
  THUMBNAIL: {
    name: 'Thumbnail',
    longEdge: 1024,
    dpi: 72,
    description: 'Small preview for web use'
  },
  PHONE_WALLPAPER: {
    name: 'Phone Wallpaper',
    longEdge: 2532,
    dpi: 72,
    description: 'Ideal resolution for modern smartphones'
  },
  LAPTOP_WALLPAPER: {
    name: 'Laptop Wallpaper',
    longEdge: 2880,
    dpi: 72,
    description: 'High-quality wallpaper for Retina displays'
  },
  DESKTOP_4K: {
    name: '4K Desktop',
    longEdge: 3840,
    dpi: 72,
    description: 'Ultra-wide 4K resolution desktop wallpaper'
  }
} as const;


export type ExportResolutionKey = keyof typeof EXPORT_RESOLUTIONS;


// Default export resolution for MVP
export const DEFAULT_EXPORT_RESOLUTION = EXPORT_RESOLUTIONS.SMALL;














