import type { ColorPalette } from '@/types/poster';

export interface LabelLayerOptions {
  style?: 'halo' | 'none' | 'strong' | 'standard' | 'elevated' | 'glass' | 'vintage';
  countrySize?: [number, number, number, number]; // [zoom1, size1, zoom2, size2]
  stateSize?: [number, number, number, number];
  citySize?: [number, number, number, number];
}

/**
 * Creates label layers (country, state, city) for place names.
 * Supports different styles:
 * - halo/standard: Default white halo
 * - none: No halo
 * - strong: Thicker halo
 * - elevated: High contrast like a card
 * - glass: Dark text, blurred white halo
 * - vintage: Sepia tones
 */
export function createLabelLayers(
  palette: ColorPalette,
  options: LabelLayerOptions = {}
): any[] {
  const {
    style = 'halo',
    countrySize = [2, 12, 6, 20],
    stateSize = [3, 11, 8, 19],
    citySize = [4, 11, 12, 18],
  } = options;

  // Determine halo settings based on style
  const getHaloSettings = () => {
    switch (style) {
      case 'none':
        return { 'text-halo-width': 0, 'text-halo-blur': 0 };
      case 'strong':
        return { 'text-halo-width': 3, 'text-halo-blur': 1 };
      case 'elevated':
        // Sharp, distinct halo to simulate elevation/card
        return { 'text-halo-width': 2, 'text-halo-blur': 0.2 };
      case 'glass':
        // Soft, wide blur to simulate glass diffusion
        return { 'text-halo-width': 4, 'text-halo-blur': 4 };
      case 'vintage':
        // Simple/rough look
        return { 'text-halo-width': 1.5, 'text-halo-blur': 1 };
      case 'standard':
      case 'halo':
      default:
        return { 'text-halo-width': 2.5, 'text-halo-blur': 1.5 };
    }
  };

  const haloSettings = getHaloSettings();

  // Determine colors based on style
  let textColor = palette.text;
  let haloColor = style !== 'none' ? palette.background : undefined;

  if (style === 'vintage') {
    textColor = '#4a3b2a'; // Dark brown
    haloColor = '#f4e4bc'; // Parchment
  } else if (style === 'glass') {
    textColor = '#000000'; // Black text
    haloColor = 'rgba(255, 255, 255, 0.7)'; // Translucent white
  } else if (style === 'elevated') {
    // Keep standard text but ensure high contrast halo
    haloColor = '#ffffff';
  }

  const layers: any[] = [
    {
      id: 'labels-country',
      type: 'symbol',
      source: 'openmaptiles',
      'source-layer': 'place',
      filter: ['==', ['get', 'class'], 'country'],
      layout: {
        'text-field': ['coalesce', ['get', 'name:en'], ['get', 'name:latin'], ['get', 'name']],
        'text-font': ['Noto Sans Regular'],
        'text-size': ['interpolate', ['linear'], ['zoom'], ...countrySize],
        'text-transform': 'uppercase',
        'text-letter-spacing': 0.3,
      },
      paint: {
        'text-color': textColor,
        ...(haloColor ? { 'text-halo-color': haloColor } : {}),
        ...haloSettings,
      },
    },
    {
      id: 'labels-state',
      type: 'symbol',
      source: 'openmaptiles',
      'source-layer': 'place',
      filter: ['==', ['get', 'class'], 'state'],
      layout: {
        'text-field': ['coalesce', ['get', 'name:en'], ['get', 'name:latin'], ['get', 'name']],
        'text-font': ['Noto Sans Regular'],
        'text-size': ['interpolate', ['linear'], ['zoom'], ...stateSize],
        'text-transform': 'uppercase',
        'text-letter-spacing': 0.15,
      },
      paint: {
        'text-color': textColor,
        'text-opacity': 0.85,
        ...(haloColor ? { 'text-halo-color': haloColor } : {}),
        ...haloSettings,
      },
    },
    {
      id: 'labels-city',
      type: 'symbol',
      source: 'openmaptiles',
      'source-layer': 'place',
      filter: [
        'all',
        ['!=', ['get', 'class'], 'state'],
        ['!=', ['get', 'class'], 'country'],
        ['step', ['zoom'], ['<=', ['get', 'rank'], 3], 6, ['<=', ['get', 'rank'], 7], 9, true],
      ],
      layout: {
        'text-field': ['coalesce', ['get', 'name:en'], ['get', 'name:latin'], ['get', 'name']],
        'text-font': ['Noto Sans Regular'],
        'text-size': ['interpolate', ['linear'], ['zoom'], ...citySize],
        'text-transform': 'uppercase',
        'text-letter-spacing': 0.12,
        'text-padding': 5,
      },
      paint: {
        'text-color': textColor,
        ...(haloColor ? { 'text-halo-color': haloColor } : {}),
        ...haloSettings,
      },
    },
  ];

  return layers;
}

/**
 * Creates a street name label layer for road and street labels.
 * Supports different styles matching the label layer system.
 * Street names are smaller than city/state labels and appear at higher zoom levels.
 */
export function createStreetNameLayer(
  palette: ColorPalette,
  options: LabelLayerOptions = {}
): any {
  const {
    style = 'halo',
  } = options;

  // Determine halo settings based on style
  const getHaloSettings = () => {
    switch (style) {
      case 'none':
        return { 'text-halo-width': 0, 'text-halo-blur': 0 };
      case 'strong':
        return { 'text-halo-width': 2, 'text-halo-blur': 0.5 };
      case 'elevated':
        return { 'text-halo-width': 1.5, 'text-halo-blur': 0.2 };
      case 'glass':
        return { 'text-halo-width': 3, 'text-halo-blur': 3 };
      case 'vintage':
        return { 'text-halo-width': 1, 'text-halo-blur': 0.8 };
      case 'standard':
      case 'halo':
      default:
        return { 'text-halo-width': 1.5, 'text-halo-blur': 1 };
    }
  };

  const haloSettings = getHaloSettings();

  // Determine colors based on style
  let textColor = palette.text;
  let haloColor = style !== 'none' ? palette.background : undefined;

  if (style === 'vintage') {
    textColor = '#4a3b2a';
    haloColor = '#f4e4bc';
  } else if (style === 'glass') {
    textColor = '#000000';
    haloColor = 'rgba(255, 255, 255, 0.7)';
  } else if (style === 'elevated') {
    haloColor = '#ffffff';
  }

  return {
    id: 'labels-streets',
    type: 'symbol',
    source: 'openmaptiles',
    'source-layer': 'transportation_name',
    filter: ['has', 'name'], // Only show features with names
    layout: {
      'text-field': ['get', 'name'],
      'text-font': ['Noto Sans Regular'],
      'text-size': ['interpolate', ['linear'], ['zoom'], 14, 10, 18, 14],
      'text-anchor': 'bottom',
      'text-offset': [0, 0.5],
      'text-rotation-alignment': 'map',
      'text-allow-overlap': false,
      'text-padding': 2,
    },
    paint: {
      'text-color': textColor,
      'text-opacity': 0.9,
      ...(haloColor ? { 'text-halo-color': haloColor } : {}),
      ...haloSettings,
    },
  };
}




