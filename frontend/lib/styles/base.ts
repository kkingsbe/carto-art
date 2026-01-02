import { 
  getOpenFreeMapPlanetTileJsonUrl, 
  getContourTileJsonUrl, 
  getPopulationTileUrl,
  getAwsTerrariumTileUrl,
  getSpaceportsGeoJsonUrl
} from './tileUrl';
import { TERRAIN_TILE_SIZE } from './config';

export interface BaseSourcesOptions {
  includeSpaceports?: boolean;
}

/**
 * Returns the base sources configuration shared across all map styles.
 * Centralizes tile source URLs to avoid duplication across style files.
 */
export function getBaseSources(options: BaseSourcesOptions = {}) {
  const { includeSpaceports = false } = options;
  
  const sources: any = {
    openmaptiles: {
      type: 'vector',
      url: getOpenFreeMapPlanetTileJsonUrl(),
      minzoom: 0,
      maxzoom: 15,
    },
    contours: {
      type: 'vector',
      url: getContourTileJsonUrl() || '',
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
      tileSize: TERRAIN_TILE_SIZE,
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

