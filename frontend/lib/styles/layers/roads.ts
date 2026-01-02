import type { ColorPalette } from '@/types/poster';

export interface RoadLayerOptions {
  lineCap?: 'round' | 'square';
  lineJoin?: 'round' | 'miter';
  includeGlow?: boolean;
  includeBridges?: boolean;
}

/**
 * Standard road width interpolations used across styles.
 * These can be overridden per style if needed.
 */
const DEFAULT_ROAD_WIDTHS = {
  service: [11, 0.1, 13, 0.3, 14, 0.5] as [number, number, number, number, number, number],
  residential: [9, 0.1, 12, 0.4, 13, 0.7, 14, 1.0] as [number, number, number, number, number, number, number, number],
  tertiary: [10, 0.3, 11, 0.5, 12, 0.8, 13, 1.1, 14, 1.4] as [number, number, number, number, number, number, number, number, number, number],
  secondary: [10, 0.6, 11, 0.9, 12, 1.2, 13, 1.6, 14, 2.0] as [number, number, number, number, number, number, number, number, number, number],
  primary: [10, 1.0, 11, 1.4, 12, 1.8, 13, 2.2, 14, 2.6] as [number, number, number, number, number, number, number, number, number, number],
  trunk: [10, 1.5, 11, 2.0, 12, 2.5, 13, 3.0, 14, 3.5] as [number, number, number, number, number, number, number, number, number, number],
  motorway: [10, 2.0, 11, 2.5, 12, 3.0, 13, 3.5, 14, 4.0] as [number, number, number, number, number, number, number, number, number, number],
};

/**
 * Creates road layer definitions for all 7 road classes.
 * Supports custom line caps/joins, glow effects, and bridge layers.
 */
export function createRoadLayers(
  palette: ColorPalette,
  options: RoadLayerOptions = {}
): any[] {
  const {
    lineCap,
    lineJoin,
    includeGlow = false,
    includeBridges = false,
  } = options;

  const layout = lineCap || lineJoin ? {
    ...(lineCap ? { 'line-cap': lineCap } : {}),
    ...(lineJoin ? { 'line-join': lineJoin } : {}),
  } : undefined;

  const layers: any[] = [];

  // Road glow layer (for dark mode style)
  if (includeGlow) {
    layers.push({
      id: 'road-glow',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'transportation',
      filter: ['in', ['get', 'class'], ['literal', ['motorway', 'trunk', 'primary']]],
      paint: {
        'line-color': palette.roads?.motorway || palette.primary || palette.text,
        'line-blur': 4,
        'line-opacity': 0.4,
        'line-width': [
          'interpolate', ['linear'], ['zoom'],
          10, 2.5 * 2.5,
          11, 3.0 * 2.5,
          12, 3.5 * 2.5,
          13, 4.0 * 2.5,
          14, 4.5 * 2.5,
        ],
      },
    });
  }

  // Service roads
  layers.push({
    id: 'road-service',
    type: 'line',
    source: 'openmaptiles',
    'source-layer': 'transportation',
    filter: ['all',
      ['in', ['get', 'class'], ['literal', ['service', 'path', 'track']]],
      ['>=', ['zoom'], 11],
    ],
    ...(layout ? { layout } : {}),
    paint: {
      'line-color': palette.roads?.service || palette.secondary || palette.text,
      'line-width': ['interpolate', ['linear'], ['zoom'], ...DEFAULT_ROAD_WIDTHS.service],
    },
  });

  // Residential roads
  layers.push({
    id: 'road-residential',
    type: 'line',
    source: 'openmaptiles',
    'source-layer': 'transportation',
    filter: ['all',
      ['in', ['get', 'class'], ['literal', ['residential', 'living_street', 'unclassified', 'minor']]],
      ['>=', ['zoom'], 9],
    ],
    ...(layout ? { layout } : {}),
    paint: {
      'line-color': palette.roads?.residential || palette.secondary || palette.text,
      'line-width': ['interpolate', ['linear'], ['zoom'], ...DEFAULT_ROAD_WIDTHS.residential],
    },
  });

  // Tertiary roads
  layers.push({
    id: 'road-tertiary',
    type: 'line',
    source: 'openmaptiles',
    'source-layer': 'transportation',
    filter: ['==', ['get', 'class'], 'tertiary'],
    ...(layout ? { layout } : {}),
    paint: {
      'line-color': palette.roads?.tertiary || palette.secondary || palette.text,
      'line-width': ['interpolate', ['linear'], ['zoom'], ...DEFAULT_ROAD_WIDTHS.tertiary],
    },
  });

  // Secondary roads
  layers.push({
    id: 'road-secondary',
    type: 'line',
    source: 'openmaptiles',
    'source-layer': 'transportation',
    filter: ['==', ['get', 'class'], 'secondary'],
    ...(layout ? { layout } : {}),
    paint: {
      'line-color': palette.roads?.secondary || palette.secondary || palette.text,
      'line-width': ['interpolate', ['linear'], ['zoom'], ...DEFAULT_ROAD_WIDTHS.secondary],
    },
  });

  // Primary roads
  layers.push({
    id: 'road-primary',
    type: 'line',
    source: 'openmaptiles',
    'source-layer': 'transportation',
    filter: ['==', ['get', 'class'], 'primary'],
    ...(layout ? { layout } : {}),
    paint: {
      'line-color': palette.roads?.primary || palette.primary || palette.text,
      'line-width': ['interpolate', ['linear'], ['zoom'], ...DEFAULT_ROAD_WIDTHS.primary],
    },
  });

  // Trunk roads
  layers.push({
    id: 'road-trunk',
    type: 'line',
    source: 'openmaptiles',
    'source-layer': 'transportation',
    filter: ['==', ['get', 'class'], 'trunk'],
    ...(layout ? { layout } : {}),
    paint: {
      'line-color': palette.roads?.trunk || palette.primary || palette.text,
      'line-width': ['interpolate', ['linear'], ['zoom'], ...DEFAULT_ROAD_WIDTHS.trunk],
    },
  });

  // Motorway roads
  layers.push({
    id: 'road-motorway',
    type: 'line',
    source: 'openmaptiles',
    'source-layer': 'transportation',
    filter: ['==', ['get', 'class'], 'motorway'],
    ...(layout ? { layout } : {}),
    paint: {
      'line-color': palette.roads?.motorway || palette.primary || palette.text,
      'line-width': ['interpolate', ['linear'], ['zoom'], ...DEFAULT_ROAD_WIDTHS.motorway],
    },
  });

  // Bridge layers (if enabled)
  if (includeBridges) {
    // Bridge motorway casing
    layers.push({
      id: 'bridge-motorway-casing',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'transportation',
      filter: ['all', ['==', ['get', 'class'], 'motorway'], ['==', ['get', 'brunnel'], 'bridge']],
      ...(layout ? { layout } : {}),
      paint: {
        'line-color': palette.background,
        'line-width': [
          'interpolate', ['linear'], ['zoom'],
          10, 2.0 * 1.5,
          11, 2.5 * 1.5,
          12, 3.0 * 1.5,
          13, 3.5 * 1.5,
          14, 4.0 * 1.5,
        ],
      },
    });

    // Bridge motorway
    layers.push({
      id: 'bridge-motorway',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'transportation',
      filter: ['all', ['==', ['get', 'class'], 'motorway'], ['==', ['get', 'brunnel'], 'bridge']],
      ...(layout ? { layout } : {}),
      paint: {
        'line-color': palette.roads?.motorway || palette.primary || palette.text,
        'line-width': [
          'interpolate', ['linear'], ['zoom'],
          10, 2.0 * 1.1,
          11, 2.5 * 1.1,
          12, 3.0 * 1.1,
          13, 3.5 * 1.1,
          14, 4.0 * 1.1,
        ],
      },
    });
  }

  return layers;
}


