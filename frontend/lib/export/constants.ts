// Export resolution constants

export const EXPORT_RESOLUTIONS = {
  SMALL: {
    name: 'Small (12x18")',
    width: 3600,
    height: 5400,
    dpi: 300,
  },
  MEDIUM: {
    name: 'Medium (18x24")',
    width: 5400,
    height: 7200,
    dpi: 300,
  },
  LARGE: {
    name: 'Large (24x36")',
    width: 7200,
    height: 10800,
    dpi: 300,
  },
} as const;

// Default export resolution for MVP
export const DEFAULT_EXPORT_RESOLUTION = EXPORT_RESOLUTIONS.SMALL;













