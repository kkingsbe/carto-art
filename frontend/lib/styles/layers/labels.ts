import type { ColorPalette } from '@/types/poster';

export interface LabelLayerOptions {
  style?: 'halo' | 'none' | 'strong';
  countrySize?: [number, number, number, number]; // [zoom1, size1, zoom2, size2]
  stateSize?: [number, number, number, number];
  citySize?: [number, number, number, number];
}

/**
 * Creates label layers (country, state, city) for place names.
 * Supports different halo styles: halo (standard), none (no halo), strong (thicker halo).
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
      case 'halo':
      default:
        return { 'text-halo-width': 2.5, 'text-halo-blur': 1.5 };
    }
  };

  const haloSettings = getHaloSettings();
  const haloColor = style !== 'none' ? palette.background : undefined;

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
        'text-color': palette.text,
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
        'text-color': palette.text,
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
        'text-color': palette.text,
        ...(haloColor ? { 'text-halo-color': haloColor } : {}),
        ...(style === 'strong' ? { 'text-halo-width': 2.5, 'text-halo-blur': 1 } : haloSettings),
      },
    },
  ];

  return layers;
}



