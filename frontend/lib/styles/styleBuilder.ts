import type { PosterStyle, ColorPalette } from '@/types/poster';
import { getBaseSources } from './base';
import { createBaseLayers, BaseLayerOptions } from './layers/base';
import { createRoadLayers, RoadLayerOptions } from './layers/roads';
import { createLabelLayers, LabelLayerOptions } from './layers/labels';
import { createBoundaryLayers, BoundaryLayerOptions } from './layers/boundaries';
import { createPOILayers, POILayerOptions } from './layers/poi';
import { createTerrainLayers, TerrainLayerOptions } from './layers/terrain';
import { getBaseLayerToggles, LayerToggleOptions } from './layerToggles';
import { StyleVariantConfig, styleVariants } from './variants';

export interface StyleBuildOptions {
  id: string;
  name: string;
  description: string;
  defaultPalette: ColorPalette;
  palettes: ColorPalette[];
  recommendedFonts: string[];
  variant?: StyleVariantConfig | string; // Can pass config directly or style ID
  overrides?: {
    base?: Partial<BaseLayerOptions>;
    roads?: Partial<RoadLayerOptions>;
    labels?: Partial<LabelLayerOptions>;
    boundaries?: Partial<BoundaryLayerOptions>;
    poi?: Partial<POILayerOptions>;
    terrain?: Partial<TerrainLayerOptions>;
    layerToggles?: Partial<LayerToggleOptions>;
  };
}

/**
 * Builds a complete PosterStyle by orchestrating all layer factories.
 * Assembles layers in the correct rendering order and applies style-specific options.
 */
export function buildStyle(options: StyleBuildOptions): PosterStyle {
  const {
    id,
    name,
    description,
    defaultPalette,
    palettes,
    recommendedFonts,
    variant: variantInput,
    overrides = {},
  } = options;

  // Resolve variant config
  let variant: StyleVariantConfig;
  if (typeof variantInput === 'string') {
    variant = styleVariants[variantInput] || styleVariants.minimal;
  } else if (variantInput) {
    variant = variantInput;
  } else {
    // Try to infer from style ID
    variant = styleVariants[id] || styleVariants.minimal;
  }

  // Merge variant options with overrides
  const baseOptions = {
    ...overrides.base,
  };

  const roadOptions: RoadLayerOptions = {
    lineCap: variant.roadOptions.lineCap,
    lineJoin: variant.roadOptions.lineJoin,
    includeGlow: variant.roadOptions.includeGlow,
    includeBridges: variant.roadOptions.includeBridges ?? variant.roadOptions.includeGlow, // Bridges typically included with glow, but can be separate
    ...overrides.roads,
  };

  const labelOptions: LabelLayerOptions = {
    style: variant.labelStyle,
    ...overrides.labels,
  };

  const poiOptions: POILayerOptions = {
    includeSpaceports: variant.includeSpaceports,
    ...overrides.poi,
  };

  const terrainOptions: TerrainLayerOptions = {
    ...variant.terrainOptions,
    contourStyle: variant.terrainOptions?.includeVolumetricBathymetry ? 'detailed' : 'simple',
    ...overrides.terrain,
  };

  const layerToggleOptions: LayerToggleOptions = {
    includeRoadGlow: variant.roadOptions.includeGlow,
    includeSpaceports: variant.includeSpaceports,
    includeBridges: roadOptions.includeBridges,
    contourLayerIds: terrainOptions.contourStyle === 'detailed' 
      ? ['contours-regular', 'contours-index', 'contours-labels']
      : undefined,
    terrainUnderWaterLayerIds: terrainOptions.includeVolumetricBathymetry
      ? [10, 50, 200, 1000, 3000, 5000].map(d => `bathymetry-volumetric-${d}`)
      : undefined,
    ...overrides.layerToggles,
  };

  // Create all layers in correct rendering order
  const layers: any[] = [];

  // 1. Base layers (background first)
  const baseLayers = createBaseLayers(defaultPalette, baseOptions);
  layers.push(...baseLayers.filter(l => l.id === 'background'));

  // 2. Terrain layers (hillshade before water)
  const terrainLayers = createTerrainLayers(defaultPalette, terrainOptions);
  // Insert hillshade before water, bathymetry after water
  const hillshadeLayer = terrainLayers.find(l => l.id === 'hillshade');
  const bathymetryLayers = terrainLayers.filter(l => l.id.startsWith('bathymetry'));
  const contourLayers = terrainLayers.filter(l => l.id.includes('contour'));

  if (hillshadeLayer) {
    layers.push(hillshadeLayer);
  }

  // 3. Water layers (after hillshade, before bathymetry)
  layers.push(...baseLayers.filter(l => l.id === 'water' || l.id === 'waterway'));

  // 4. Bathymetry layers (after water)
  layers.push(...bathymetryLayers);

  // 5. Parks and buildings
  layers.push(...baseLayers.filter(l => l.id === 'park' || l.id === 'buildings'));

  // 6. Roads
  const roadLayers = createRoadLayers(defaultPalette, roadOptions);
  layers.push(...roadLayers);

  // 7. Population density
  layers.push(...baseLayers.filter(l => l.id === 'population-density'));

  // 8. Contours
  layers.push(...contourLayers);

  // 9. Boundaries
  const boundaryLayers = createBoundaryLayers(defaultPalette, overrides.boundaries);
  layers.push(...boundaryLayers);

  // 10. Labels (country, state, city)
  const labelLayers = createLabelLayers(defaultPalette, labelOptions);
  layers.push(...labelLayers.filter(l => 
    l.id === 'labels-country' || l.id === 'labels-state' || l.id === 'labels-city'
  ));

  // 11. POI layers (aeroway, spaceports, POIs)
  const poiLayers = createPOILayers(defaultPalette, poiOptions);
  
  // Debug: Log spaceport layer inclusion (development only)
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    const spaceportLayers = poiLayers.filter(l => l.id === 'spaceport-area' || l.id === 'spaceport-label');
    if (spaceportLayers.length > 0) {
      console.log('🚀 [SPACEPORT STYLE] Including spaceport layers in style:', {
        includeSpaceports: poiOptions.includeSpaceports,
        spaceportLayerCount: spaceportLayers.length,
        spaceportLayerIds: spaceportLayers.map(l => l.id),
        totalPOILayerCount: poiLayers.length
      });
    }
  }
  
  layers.push(...poiLayers);

  // Get layer IDs for toggle validation
  const allLayerIds = layers.map(l => l.id);

  // Create layer toggles
  const layerToggles = getBaseLayerToggles(layerToggleOptions, allLayerIds);

  // Build final style
  const mapStyle = {
    version: 8,
    name,
    metadata: {
      'mapbox:autocomposite': false,
    },
    sources: getBaseSources({ includeSpaceports: poiOptions.includeSpaceports }),
    glyphs: 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf',
    layers,
  };

  return {
    id,
    name,
    description,
    mapStyle,
    defaultPalette,
    palettes,
    recommendedFonts,
    layerToggles,
  };
}

