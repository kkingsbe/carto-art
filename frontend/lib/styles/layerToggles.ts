import type { LayerToggle } from '@/types/poster';

export interface LayerToggleOptions {
  includeRoadGlow?: boolean;
  includeSpaceports?: boolean;
  includeBridges?: boolean;
  customLayerIds?: Record<string, string[]>; // Override specific toggles
  contourLayerIds?: string[]; // Custom contour layer IDs (e.g., ['contours-regular', 'contours-index'])
  terrainUnderWaterLayerIds?: string[]; // Custom bathymetry layer IDs (e.g., volumetric layers)
}

/**
 * Creates base layer toggle definitions for controlling layer visibility.
 * Conditionally includes spaceport layers, road glow, bridges, etc. based on options.
 * Validates that all layer IDs exist in the provided layers array (if provided).
 */
export function getBaseLayerToggles(
  options: LayerToggleOptions = {},
  allLayerIds?: string[] // Optional: if provided, validates that toggle layerIds exist
): LayerToggle[] {
  const {
    includeRoadGlow = false,
    includeSpaceports = false,
    includeBridges = false,
    customLayerIds = {},
    contourLayerIds,
    terrainUnderWaterLayerIds,
  } = options;

  const streetLayers = [
    ...(includeRoadGlow ? ['road-glow'] : []),
    'road-service',
    'road-residential',
    'road-tertiary',
    'road-secondary',
    'road-primary',
    'road-trunk',
    'road-motorway',
    ...(includeBridges && includeRoadGlow ? ['bridge-motorway-casing', 'bridge-motorway'] : []),
  ];

  const poiLayers = [
    'aeroway-area',
    'aeroway-runway',
    'aerodrome-label',
    ...(includeSpaceports ? ['spaceport-area', 'spaceport-label'] : []),
    'poi-symbol',
    'poi-label',
  ];

  const toggles: LayerToggle[] = [
    {
      id: 'streets',
      name: 'Streets',
      layerIds: customLayerIds.streets || streetLayers,
    },
    {
      id: 'buildings',
      name: 'Buildings',
      layerIds: customLayerIds.buildings || ['buildings'],
    },
    {
      id: 'buildings3D',
      name: '3D Buildings',
      layerIds: customLayerIds.buildings3D || ['buildings-3d'],
    },
    {
      id: 'water',
      name: 'Water',
      layerIds: customLayerIds.water || ['water', 'waterway'],
    },
    {
      id: 'terrainUnderWater',
      name: 'Underwater Terrain',
      layerIds: customLayerIds.terrainUnderWater || terrainUnderWaterLayerIds || ['bathymetry-detail'],
    },
    {
      id: 'parks',
      name: 'Parks',
      layerIds: customLayerIds.parks || ['park'],
    },
    {
      id: 'landcoverWood',
      name: 'Woods',
      layerIds: customLayerIds.landcoverWood || ['landcover-wood'],
    },
    {
      id: 'landcoverGrass',
      name: 'Grass',
      layerIds: customLayerIds.landcoverGrass || ['landcover-grass'],
    },
    {
      id: 'landcoverFarmland',
      name: 'Farmland',
      layerIds: customLayerIds.landcoverFarmland || ['landcover-farmland'],
    },
    {
      id: 'landcoverIce',
      name: 'Ice',
      layerIds: customLayerIds.landcoverIce || ['landcover-ice'],
    },
    {
      id: 'landuseForest',
      name: 'Forests',
      layerIds: customLayerIds.landuseForest || ['landuse-forest'],
    },
    {
      id: 'landuseOrchard',
      name: 'Orchards',
      layerIds: customLayerIds.landuseOrchard || ['landuse-orchard'],
    },
    {
      id: 'landuseVineyard',
      name: 'Vineyards',
      layerIds: customLayerIds.landuseVineyard || ['landuse-vineyard'],
    },
    {
      id: 'landuseCemetery',
      name: 'Cemeteries',
      layerIds: customLayerIds.landuseCemetery || ['landuse-cemetery'],
    },
    {
      id: 'landuseGrass',
      name: 'Grass (Landuse)',
      layerIds: customLayerIds.landuseGrass || ['landuse-grass'],
    },
    {
      id: 'terrain',
      name: 'Terrain Shading',
      layerIds: customLayerIds.terrain || ['hillshade'],
    },
    {
      id: 'contours',
      name: 'Topography (Contours)',
      layerIds: customLayerIds.contours || contourLayerIds || ['contours'],
    },
    {
      id: 'population',
      name: 'Population Density',
      layerIds: customLayerIds.population || ['population-density'],
    },
    {
      id: 'railroads',
      name: 'Railroads',
      layerIds: customLayerIds.railroads || ['railroad-casing', 'railroad-main'],
    },
    {
      id: 'pois',
      name: 'Points of Interest',
      layerIds: customLayerIds.pois || poiLayers,
    },
    {
      id: 'labels-admin',
      name: 'State & Country Names',
      layerIds: customLayerIds['labels-admin'] || ['labels-country', 'labels-state'],
    },
    {
      id: 'boundaries',
      name: 'Administrative Boundaries',
      layerIds: customLayerIds.boundaries || ['boundaries-country', 'boundaries-state', 'boundaries-county'],
    },
    {
      id: 'labels-cities',
      name: 'City Names',
      layerIds: customLayerIds['labels-cities'] || ['labels-city'],
    },
    {
      id: 'labels-streets',
      name: 'Street Names',
      layerIds: customLayerIds['labels-streets'] || ['labels-streets'],
    },
  ];

  // Validate layer IDs if allLayerIds is provided
  if (allLayerIds) {
    const layerIdSet = new Set(allLayerIds);
    for (const toggle of toggles) {
      const missingIds = toggle.layerIds.filter(id => !layerIdSet.has(id));
      if (missingIds.length > 0) {
        console.warn(
          `Layer toggle "${toggle.id}" references non-existent layer IDs: ${missingIds.join(', ')}`
        );
      }
    }
  }

  return toggles;
}

