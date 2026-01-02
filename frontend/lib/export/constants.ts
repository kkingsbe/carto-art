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
  }
} as const;

export type ExportResolutionKey = keyof typeof EXPORT_RESOLUTIONS;


// Default export resolution for MVP
export const DEFAULT_EXPORT_RESOLUTION = EXPORT_RESOLUTIONS.SMALL;













