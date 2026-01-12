import {
  getOpenFreeMapPlanetTileJsonUrl,
  getContourTileJsonUrl,
  getPopulationTileUrl,
  getAwsTerrariumTileUrl,
  getSpaceportsGeoJsonUrl
} from './tileUrl';
import { TERRAIN_TILE_SIZE, TERRAIN_DETAIL_PRESETS, type TerrainDetailLevel } from './config';

export interface BaseSourcesOptions {
  includeSpaceports?: boolean;
  /**
   * Terrain detail level. Higher detail = smaller tile size = fetches tiles from higher zoom levels.
   * - 'normal': Default (256px tiles)
   * - 'high': 2x detail (128px tiles, fetches z+1)
   * - 'ultra': 4x detail (64px tiles, fetches z+2)
   */
  terrainDetailLevel?: TerrainDetailLevel;
}

/**
 * Returns the base sources configuration shared across all map styles.
 * Centralizes tile source URLs to avoid duplication across style files.
 */
export function getBaseSources(options: BaseSourcesOptions = {}) {
  const { includeSpaceports = false, terrainDetailLevel = 'normal' } = options;

  // Determine tile size based on detail level
  const terrainTileSize = TERRAIN_DETAIL_PRESETS[terrainDetailLevel] ?? TERRAIN_TILE_SIZE;

  const sources: any = {
    openmaptiles: {
      type: 'vector',
      url: getOpenFreeMapPlanetTileJsonUrl(),
      minzoom: 0,
      maxzoom: 14,
    },
    contours: {
      type: 'vector',
      // Use maplibre-contour protocol which generates vector tiles client-side
      // from the free AWS Terrarium DEM tiles.
      // The URL here must match the pattern expected by the protocol handler (contour://z/x/y),
      // effectively acting as a virtual URL. The actual S3 URL is configured in setup.ts DemSource.
      tiles: ['contour://{z}/{x}/{y}'],
      minzoom: 9,
      maxzoom: 15,
    },
    population: {
      type: 'vector',
      tiles: [getPopulationTileUrl()],
      minzoom: 0,
      maxzoom: 15,
      attribution: '<a href="https://www.kontur.io/portfolio/population-dataset/" target="_blank">Kontur Population</a>',
    },
    terrain: {
      type: 'raster-dem',
      tiles: [getAwsTerrariumTileUrl()],
      tileSize: terrainTileSize,
      encoding: 'terrarium',
      maxzoom: 14,
    },
  };

  // Conditionally add spaceports source only when needed
  if (includeSpaceports) {
    const spaceportsUrl = getSpaceportsGeoJsonUrl();
    console.log('[DEBUG getBaseSources] Spaceports URL:', spaceportsUrl);
    sources.spaceports = {
      type: 'geojson',
      data: spaceportsUrl,
    };
    console.log('[DEBUG getBaseSources] Sources object:', JSON.stringify(sources, null, 2));
  }

  return sources;
}

