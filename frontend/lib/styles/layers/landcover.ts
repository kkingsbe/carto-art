import type { ColorPalette } from '@/types/poster';

export interface LandcoverLayerOptions {
  landcoverOpacity?: number;
  landuseOpacity?: number;
}

/**
 * Creates landcover and landuse layers for vegetation and land classification.
 * Landcover classes: wood, grass, farmland, ice (from 'landcover' source-layer)
 * Landuse classes: forest, orchard, vineyard, cemetery, grass (from 'landuse' source-layer)
 */
export function createLandcoverLayers(
  palette: ColorPalette,
  options: LandcoverLayerOptions = {}
): any[] {
  const {
    landcoverOpacity = 0.3,
    landuseOpacity = 0.3,
  } = options;

  const baseGreenSpace = palette.greenSpace || palette.parks || '#90EE90';

  const layers: any[] = [];

  // Landcover layers (from 'landcover' source-layer)
  // Wood
  layers.push({
    id: 'landcover-wood',
    type: 'fill',
    source: 'openmaptiles',
    'source-layer': 'landcover',
    filter: ['==', ['get', 'class'], 'wood'],
    paint: {
      'fill-color': baseGreenSpace,
      'fill-opacity': landcoverOpacity,
    },
  });

  // Grass
  layers.push({
    id: 'landcover-grass',
    type: 'fill',
    source: 'openmaptiles',
    'source-layer': 'landcover',
    filter: ['==', ['get', 'class'], 'grass'],
    paint: {
      'fill-color': baseGreenSpace,
      'fill-opacity': landcoverOpacity,
    },
  });

  // Farmland
  layers.push({
    id: 'landcover-farmland',
    type: 'fill',
    source: 'openmaptiles',
    'source-layer': 'landcover',
    filter: ['==', ['get', 'class'], 'farmland'],
    paint: {
      'fill-color': baseGreenSpace,
      'fill-opacity': landcoverOpacity,
    },
  });

  // Ice
  layers.push({
    id: 'landcover-ice',
    type: 'fill',
    source: 'openmaptiles',
    'source-layer': 'landcover',
    filter: ['==', ['get', 'class'], 'ice'],
    paint: {
      'fill-color': baseGreenSpace,
      'fill-opacity': landcoverOpacity,
    },
  });

  // Landuse layers (from 'landuse' source-layer)
  // Forest
  layers.push({
    id: 'landuse-forest',
    type: 'fill',
    source: 'openmaptiles',
    'source-layer': 'landuse',
    filter: ['==', ['get', 'class'], 'forest'],
    paint: {
      'fill-color': baseGreenSpace,
      'fill-opacity': landuseOpacity,
    },
  });

  // Orchard
  layers.push({
    id: 'landuse-orchard',
    type: 'fill',
    source: 'openmaptiles',
    'source-layer': 'landuse',
    filter: ['==', ['get', 'class'], 'orchard'],
    paint: {
      'fill-color': baseGreenSpace,
      'fill-opacity': landuseOpacity,
    },
  });

  // Vineyard
  layers.push({
    id: 'landuse-vineyard',
    type: 'fill',
    source: 'openmaptiles',
    'source-layer': 'landuse',
    filter: ['==', ['get', 'class'], 'vineyard'],
    paint: {
      'fill-color': baseGreenSpace,
      'fill-opacity': landuseOpacity,
    },
  });

  // Cemetery
  layers.push({
    id: 'landuse-cemetery',
    type: 'fill',
    source: 'openmaptiles',
    'source-layer': 'landuse',
    filter: ['==', ['get', 'class'], 'cemetery'],
    paint: {
      'fill-color': baseGreenSpace,
      'fill-opacity': landuseOpacity,
    },
  });

  // Grass (landuse)
  layers.push({
    id: 'landuse-grass',
    type: 'fill',
    source: 'openmaptiles',
    'source-layer': 'landuse',
    filter: ['==', ['get', 'class'], 'grass'],
    paint: {
      'fill-color': baseGreenSpace,
      'fill-opacity': landuseOpacity,
    },
  });

  return layers;
}

