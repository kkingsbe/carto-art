const PROXY_BASE = '/api/tiles';

function getBaseUrl(): string {
  // Prioritize runtime location over build-time env vars.
  // This prevents CORS issues when the build env differs from the runtime env
  // (e.g., building locally then deploying to production).
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }

  // In web workers, self.location is available
  if (typeof self !== 'undefined' && self.location?.origin) {
    return self.location.origin;
  }

  // Fallback to env var for SSR/Node.js contexts
  if (process.env.NEXT_PUBLIC_SERVER_URL) {
    return process.env.NEXT_PUBLIC_SERVER_URL;
  }

  return '';
}

function appendQueryParam(url: string, key: string, value: string): string {
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
}

function joinBaseAndPath(base: string, path: string): string {
  if (!base) return path;
  // Important: don't use new URL(...).toString() for templates that include "{z}/{x}/{y}",
  // because URL stringification percent-encodes "{" and "}" (breaking MapLibre replacement).
  return `${base.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
}

/**
 * Returns an absolute TileJSON URL for the OpenFreeMap "planet" tileset.
 */
export function getOpenFreeMapPlanetTileJsonUrl(): string {
  const path = 'openfreemap/planet';
  const baseUrl = getBaseUrl();

  const url = baseUrl
    ? joinBaseAndPath(baseUrl, `${PROXY_BASE}/${path}`)
    : `${PROXY_BASE}/${path}`;

  // Cache-bust TileJSON in production so clients don't keep a stale response
  // that contains relative tile URLs (which can break MapLibre workers).
  const version =
    process.env.NEXT_PUBLIC_APP_VERSION ||
    process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ||
    '1';

  return appendQueryParam(url, 'v', version);
}

/**
 * Returns the URL for contour/elevation tiles.
 * Supports MapTiler as the primary provider, proxied to avoid CORS issues.
 */
export function getContourTileJsonUrl(): string | null {
  const maptilerKey = process.env.NEXT_PUBLIC_MAPTILER_KEY;
  if (!maptilerKey) return null;

  const path = `maptiler/tiles/contours/tiles.json?key=${maptilerKey}`;
  const baseUrl = getBaseUrl();

  if (baseUrl) {
    return joinBaseAndPath(baseUrl, `${PROXY_BASE}/${path}`);
  }

  return `${PROXY_BASE}/${path}`;
}

/**
 * Returns the URL for AWS Terrarium terrain tiles (elevation data).
 * These are high-resolution (3-10m in US) and free.
 */
export function getAwsTerrariumTileUrl(): string {
  const path = 'aws-terrain/terrarium/{z}/{x}/{y}.png';
  const baseUrl = getBaseUrl();

  if (baseUrl) {
    return joinBaseAndPath(baseUrl, `${PROXY_BASE}/${path}`);
  }

  return `${PROXY_BASE}/${path}`;
}

/**
 * Returns the URL for Terrain-RGB tiles (elevation data).
 */
export function getTerrainRgbTileJsonUrl(): string | null {
  const maptilerKey = process.env.NEXT_PUBLIC_MAPTILER_KEY;
  if (!maptilerKey) return null;

  const path = `maptiler/tiles/terrain-rgb-v2/tiles.json?key=${maptilerKey}`;
  const baseUrl = getBaseUrl();

  if (baseUrl) {
    return joinBaseAndPath(baseUrl, `${PROXY_BASE}/${path}`);
  }

  return `${PROXY_BASE}/${path}`;
}

/**
 * Returns the URL for Kontur population tiles, proxied to avoid CORS issues.
 */
export function getPopulationTileUrl(): string {
  const path = 'kontur/{z}/{x}/{y}.mvt?indicatorsClass=general';
  const baseUrl = getBaseUrl();

  if (baseUrl) {
    return joinBaseAndPath(baseUrl, `${PROXY_BASE}/${path}`);
  }

  // Fallback to relative path if no base URL is available
  return `${PROXY_BASE}/${path}`;
}

/**
 * Returns the URL for spaceports GeoJSON data from Launch Library 2 API.
 * Always uses a relative path to avoid CORS issues in Web Workers.
 */
export function getSpaceportsGeoJsonUrl(): string {
  // Use relative path - MapLibre will resolve this relative to the current origin
  // This avoids issues with process.env being inlined at build time with production URLs
  const url = '/api/spaceports';
  console.log('[DEBUG getSpaceportsGeoJsonUrl] Returning URL:', url);
  console.log('[DEBUG getSpaceportsGeoJsonUrl] NEXT_PUBLIC_SITE_URL:', process.env.NEXT_PUBLIC_SITE_URL);
  console.log('[DEBUG getSpaceportsGeoJsonUrl] window.location.origin:', typeof window !== 'undefined' ? window.location?.origin : 'N/A');
  console.log('[DEBUG getSpaceportsGeoJsonUrl] self.location.origin:', typeof self !== 'undefined' ? self.location?.origin : 'N/A');
  return url;
}


