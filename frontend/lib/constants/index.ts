/**
 * Application-wide constants
 * Organized by category for easy maintenance and reference
 */

/**
 * Timeout constants (in milliseconds)
 */
export const TIMEOUTS = {
  /** Map loading timeout - prevents being stuck on "Loading Tiles" */
  MAP_LOADING: 5000,
  /** Geolocation request timeout */
  GEOLOCATION: 10000,
  /** Geolocation safety timeout (longer than request timeout) */
  GEOLOCATION_SAFETY: 15000,
  /** History update debounce delay */
  HISTORY_UPDATE_DEBOUNCE: 500,
  /** URL sync debounce delay */
  URL_SYNC_DEBOUNCE: 300,
  /** URL update flag reset delay */
  URL_UPDATE_RESET: 100,
} as const;

/**
 * Cache configuration
 */
export const CACHE = {
  /** Cache TTL in milliseconds (5 minutes) */
  TTL_MS: 5 * 60 * 1000,
  /** Maximum cache size */
  SIZE_LIMIT: 1000,
} as const;

/**
 * Spaceports cache configuration
 */
export const SPACEPORTS_CACHE = {
  /** Cache TTL in milliseconds (7 days) - spaceports change infrequently */
  TTL_MS: 7 * 24 * 60 * 60 * 1000,
} as const;

/**
 * History management limits
 */
export const HISTORY = {
  /** Maximum number of history states to keep */
  MAX_SIZE: 50,
} as const;

/**
 * Map configuration
 */
export const MAP = {
  /** Maximum zoom level */
  MAX_ZOOM: 18,
  /** Minimum zoom level */
  MIN_ZOOM: 1,
  /** Maximum allowed zoom (clamped) */
  MAX_ZOOM_CLAMPED: 18.9,
  /** Minimum allowed zoom (clamped) */
  MIN_ZOOM_CLAMPED: 1,
  /** Default pixel ratio for map rendering */
  PIXEL_RATIO: 2,
  /** Temporarily allow higher zoom for export */
  EXPORT_MAX_ZOOM: 24,
  /** Default zoom level */
  DEFAULT_ZOOM: 12,
} as const;

/**
 * Throttle intervals (in milliseconds)
 */
export const THROTTLE = {
  /** Map move throttle interval */
  MAP_MOVE: 60,
} as const;

/**
 * API rate limiting
 */
export const API = {
  /** Minimum interval between Nominatim requests (1 request per second) */
  MIN_REQUEST_INTERVAL_MS: 1000,
} as const;

/**
 * Geocoding API limits
 */
export const GEOCODING = {
  /** Minimum query length */
  MIN_QUERY_LEN: 3,
  /** Maximum query length */
  MAX_QUERY_LEN: 200,
  /** Default result limit */
  DEFAULT_LIMIT: 5,
  /** Maximum result limit */
  MAX_LIMIT: 10,
} as const;

/**
 * Geolocation options
 */
export const GEOLOCATION = {
  /** Maximum age of cached position (in milliseconds) */
  MAX_AGE: 60000,
  /** Enable high accuracy (false for faster, less battery-intensive) */
  ENABLE_HIGH_ACCURACY: false,
} as const;

/**
 * Layer visibility multipliers
 */
export const LAYERS = {
  /** Road weight multiplier when labels are enabled */
  ROAD_WEIGHT_WITH_LABELS: 0.8,
  /** Label adjustment when labels are enabled */
  LABEL_ADJUSTMENT: 0.7,
} as const;

/**
 * Export configuration
 */
export const EXPORT = {
  /** Default export resolution width */
  DEFAULT_WIDTH: 2400,
  /** Default export resolution height */
  DEFAULT_HEIGHT: 3600,
  /** Default export DPI */
  DEFAULT_DPI: 300,
} as const;

/**
 * Typography defaults
 */
export const TYPOGRAPHY = {
  /** Default font size for testing */
  TEST_FONT_SIZE: 10,
} as const;

/**
 * Texture intensity defaults
 */
export const TEXTURE = {
  /** Default texture intensity percentage */
  DEFAULT_INTENSITY: 20,
} as const;

/**
 * Water opacity configuration
 */
export const WATER = {
  /** Minimum water opacity when terrain under water is enabled */
  MIN_OPACITY_WITH_TERRAIN: 0.95,
  /** Full opacity when terrain under water is disabled */
  FULL_OPACITY: 1.0,
} as const;

/**
 * Hillshade exaggeration limits
 */
export const HILLSHADE = {
  /** Minimum exaggeration value */
  MIN_EXAGGERATION: 0,
  /** Maximum exaggeration value */
  MAX_EXAGGERATION: 1,
  /** Default exaggeration value */
  DEFAULT_EXAGGERATION: 0.5,
} as const;

