import type { ColorPalette } from '@/types/poster';

export interface BoundaryLayerOptions {
  countryWidth?: number;
  stateWidth?: number;
  countyWidth?: number;
  countryOpacity?: number;
  stateOpacity?: number;
  countyOpacity?: number;
}

/**
 * Creates administrative boundary layers (country, state, county).
 * Standard styling with optional customizations for width and opacity.
 */
export function createBoundaryLayers(
  palette: ColorPalette,
  options: BoundaryLayerOptions = {}
): any[] {
  const {
    countryWidth = 1.5,
    stateWidth = 0.75,
    countyWidth = 0.5,
    countryOpacity = 0.3,
    stateOpacity = 0.2,
    countyOpacity = 0.15,
  } = options;

  const boundaryColor = palette.border || palette.text;

  const layers: any[] = [
    {
      id: 'boundaries-country',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'boundary',
      filter: ['all', ['==', ['get', 'admin_level'], 2], ['==', ['get', 'maritime'], 0]],
      paint: {
        'line-color': boundaryColor,
        'line-width': countryWidth,
        'line-opacity': countryOpacity,
      },
    },
    {
      id: 'boundaries-state',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'boundary',
      filter: ['all', ['==', ['get', 'admin_level'], 4], ['==', ['get', 'maritime'], 0]],
      paint: {
        'line-color': boundaryColor,
        'line-width': stateWidth,
        'line-dasharray': [4, 4],
        'line-opacity': stateOpacity,
      },
    },
    {
      id: 'boundaries-county',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'boundary',
      filter: ['all', ['==', ['get', 'admin_level'], 6], ['==', ['get', 'maritime'], 0]],
      paint: {
        'line-color': boundaryColor,
        'line-width': countyWidth,
        'line-dasharray': [2, 2],
        'line-opacity': countyOpacity,
      },
    },
  ];

  return layers;
}


