export const TERRAIN_TILE_SIZE = 256;

/**
 * Terrain detail level presets.
 * Smaller tile sizes force MapLibre to fetch tiles from higher zoom levels,
 * improving terrain quality when zoomed out (at the cost of more network requests).
 * 
 * - 256: Normal (1x) - Default tile size, fastest loading
 * - 128: High (2x) - Fetches tiles from one zoom level higher  
 * - 64: Ultra (4x) - Fetches tiles from two zoom levels higher
 */
export const TERRAIN_DETAIL_PRESETS = {
    normal: 256,   // Default - 1x detail
    high: 128,     // 2x detail (fetch z+1 tiles)
    ultra: 64,     // 4x detail (fetch z+2 tiles)
} as const;

export type TerrainDetailLevel = keyof typeof TERRAIN_DETAIL_PRESETS;
