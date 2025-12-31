import type { PosterStyle, ColorPalette, LayerToggle } from '@/types/poster';
import { 
  getOpenFreeMapPlanetTileJsonUrl, 
  getContourTileJsonUrl, 
  getPopulationTileUrl,
  getAwsTerrariumTileUrl
} from '@/lib/styles/tileUrl';
import { TERRAIN_TILE_SIZE } from '@/lib/styles/config';

const parchmentPalette: ColorPalette = {
  id: 'vintage-parchment',
  name: 'Parchment',
  style: 'vintage',
  
  background: '#F4E4C8',
  text: '#3C2F1F',
  border: '#8B7355',
  
  roads: {
    motorway: '#2A2010',
    trunk: '#3C2F1F',
    primary: '#4A3A28',
    secondary: '#5D4E37',
    tertiary: '#6E5E48',
    residential: '#907E68',
    service: '#A89880',
  },
  
  water: '#B8C5C0',
  waterLine: '#8AA0A0',
  greenSpace: '#D4D4B8',
  landuse: '#EBD9B8',
  buildings: '#E0D4BC',
  
  accent: '#8B7355',
};

const defaultPalette = parchmentPalette;

const atlasPalette: ColorPalette = {
  id: 'vintage-atlas',
  name: 'Old Atlas',
  style: 'vintage',
  
  background: '#EDE5D0',
  text: '#2F2A25',
  border: '#6B6055',
  
  roads: {
    motorway: '#1F1A15',
    trunk: '#2F2A25',
    primary: '#3F3530',
    secondary: '#4A4540',
    tertiary: '#5C5550',
    residential: '#787068',
    service: '#908880',
  },
  
  water: '#A8C0C8',
  waterLine: '#7898A0',
  greenSpace: '#B8C4A8',
  landuse: '#E2DAC8',
  buildings: '#D8D0C0',
  
  accent: '#6B6055',
};

const sepiaPalette: ColorPalette = {
  id: 'vintage-sepia',
  name: 'Sepia Deep',
  style: 'vintage',
  
  background: '#E8D8B8',
  text: '#2A1810',
  border: '#6B4423',
  
  roads: {
    motorway: '#1A0C08',
    trunk: '#2A1810',
    primary: '#3A2418',
    secondary: '#5C4030',
    tertiary: '#705040',
    residential: '#887058',
    service: '#A08870',
  },
  
  water: '#A0B0A8',
  waterLine: '#708880',
  greenSpace: '#C0C0A0',
  landuse: '#DCD0B0',
  buildings: '#D0C4A8',
  
  accent: '#6B4423',
};

const maritimePalette: ColorPalette = {
  id: 'vintage-maritime',
  name: 'Maritime',
  style: 'vintage',
  
  background: '#F0E8D8',
  text: '#1E3040',
  border: '#3A5060',
  
  roads: {
    motorway: '#142030',
    trunk: '#1E3040',
    primary: '#283848',
    secondary: '#3A4858',
    tertiary: '#4A5A68',
    residential: '#6A7A88',
    service: '#8898A0',
  },
  
  water: '#8AB0C8',
  waterLine: '#5A88A8',
  greenSpace: '#C8D0B8',
  landuse: '#E5DDD0',
  buildings: '#D8D0C0',
  
  accent: '#3A5060',
};

const fadedPalette: ColorPalette = {
  id: 'vintage-faded',
  name: 'Faded Ink',
  style: 'vintage',
  
  background: '#F5EDE0',
  text: '#4A4540',
  border: '#8A8580',
  
  roads: {
    motorway: '#3A3530',
    trunk: '#4A4540',
    primary: '#5A5550',
    secondary: '#6A6560',
    tertiary: '#7A7570',
    residential: '#9A9590',
    service: '#B0ABA8',
  },
  
  water: '#C0CCC8',
  waterLine: '#98A8A8',
  greenSpace: '#D4D8C8',
  landuse: '#EAE4D8',
  buildings: '#E0DAD0',
  
  accent: '#8A8580',
};

const colonialPalette: ColorPalette = {
  id: 'vintage-colonial',
  name: 'Colonial',
  style: 'vintage',
  
  background: '#F2E8D4',
  text: '#1A2A20',
  border: '#2A4038',
  
  roads: {
    motorway: '#0A1A10',
    trunk: '#1A2A20',
    primary: '#2A3830',
    secondary: '#3A4840',
    tertiary: '#4A5850',
    residential: '#6A7870',
    service: '#889890',
  },
  
  water: '#98B8C0',
  waterLine: '#6890A0',
  greenSpace: '#B8C8A8',
  landuse: '#E8DCCC',
  buildings: '#DCD0C0',
  
  accent: '#2A4038',
};

const mapStyle = {
  version: 8,
  name: 'Vintage / Antique',
  metadata: {
    'mapbox:autocomposite': false,
  },
  sources: {
    openmaptiles: {
      type: 'vector',
      url: getOpenFreeMapPlanetTileJsonUrl(),
      minzoom: 0,
      maxzoom: 15,
    },
    contours: {
      type: 'vector',
      url: getContourTileJsonUrl() || '',
      minzoom: 0,
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
    },
  },
  glyphs: 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf',
  layers: [
    {
      id: 'background',
      type: 'background',
      paint: {
        'background-color': defaultPalette.background,
      },
    },
    {
      id: 'hillshade',
      type: 'hillshade',
      source: 'terrain',
      paint: {
        'hillshade-shadow-color': defaultPalette.primary,
        'hillshade-highlight-color': defaultPalette.background,
        'hillshade-accent-color': defaultPalette.primary,
        'hillshade-exaggeration': 0.4,
      },
    },
    {
      id: 'water',
      type: 'fill',
      source: 'openmaptiles',
      'source-layer': 'water',
      paint: {
        'fill-color': defaultPalette.water,
        'fill-opacity': 0.7,
        'fill-outline-color': defaultPalette.waterLine || defaultPalette.water,
      },
    },
    {
      id: 'waterway',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'waterway',
      paint: {
        'line-color': defaultPalette.waterLine || defaultPalette.water,
        'line-opacity': 0.8,
        'line-width': [
          'interpolate', ['linear'], ['zoom'],
          10, 0.8,
          12, 1.5,
          14, 2.2,
        ],
      },
    },
    {
      id: 'park',
      type: 'fill',
      source: 'openmaptiles',
      'source-layer': 'park',
      paint: {
        'fill-color': defaultPalette.greenSpace,
        'fill-opacity': 0.5,
      },
    },
    {
      id: 'buildings',
      type: 'fill',
      source: 'openmaptiles',
      'source-layer': 'building',
      paint: {
        'fill-color': defaultPalette.buildings || defaultPalette.secondary,
        'fill-opacity': 0.25,
      },
    },
    {
      id: 'road-service',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'transportation',
      filter: ['all', 
        ['in', ['get', 'class'], ['literal', ['service', 'path', 'track']]],
        ['>=', ['zoom'], 11]
      ],
      layout: {
        'line-cap': 'round',
        'line-join': 'round',
      },
      paint: {
        'line-color': defaultPalette.roads?.service || defaultPalette.secondary,
        'line-width': [
          'interpolate', ['linear'], ['zoom'],
          11, 0.1,
          12, 0.2,
          13, 0.3,
          14, 0.5
        ],
      },
    },
    {
      id: 'road-residential',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'transportation',
      filter: ['all',
        ['in', ['get', 'class'], ['literal', ['residential', 'living_street', 'unclassified', 'minor']]],
        ['>=', ['zoom'], 9]
      ],
      layout: {
        'line-cap': 'round',
        'line-join': 'round',
      },
      paint: {
        'line-color': defaultPalette.roads?.residential || defaultPalette.secondary,
        'line-width': [
          'interpolate', ['linear'], ['zoom'],
          9, 0.1,
          11, 0.3,
          12, 0.5,
          13, 0.8,
          14, 1.1
        ],
      },
    },
    {
      id: 'road-tertiary',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'transportation',
      filter: ['==', ['get', 'class'], 'tertiary'],
      layout: {
        'line-cap': 'round',
        'line-join': 'round',
      },
      paint: {
        'line-color': defaultPalette.roads?.tertiary || defaultPalette.secondary,
        'line-width': [
          'interpolate', ['linear'], ['zoom'],
          10, 0.4,
          11, 0.6,
          12, 0.9,
          13, 1.2,
          14, 1.5
        ],
      },
    },
    {
      id: 'road-secondary',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'transportation',
      filter: ['==', ['get', 'class'], 'secondary'],
      layout: {
        'line-cap': 'round',
        'line-join': 'round',
      },
      paint: {
        'line-color': defaultPalette.roads?.secondary || defaultPalette.secondary,
        'line-width': [
          'interpolate', ['linear'], ['zoom'],
          10, 0.7,
          11, 1.0,
          12, 1.3,
          13, 1.7,
          14, 2.1
        ],
      },
    },
    {
      id: 'road-primary',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'transportation',
      filter: ['==', ['get', 'class'], 'primary'],
      layout: {
        'line-cap': 'round',
        'line-join': 'round',
      },
      paint: {
        'line-color': defaultPalette.roads?.primary || defaultPalette.primary,
        'line-width': [
          'interpolate', ['linear'], ['zoom'],
          10, 1.2,
          11, 1.6,
          12, 2.0,
          13, 2.5,
          14, 3.0
        ],
      },
    },
    {
      id: 'road-trunk',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'transportation',
      filter: ['==', ['get', 'class'], 'trunk'],
      layout: {
        'line-cap': 'round',
        'line-join': 'round',
      },
      paint: {
        'line-color': defaultPalette.roads?.trunk || defaultPalette.primary,
        'line-width': [
          'interpolate', ['linear'], ['zoom'],
          10, 1.8,
          11, 2.3,
          12, 2.8,
          13, 3.4,
          14, 4.0
        ],
      },
    },
    {
      id: 'road-motorway',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'transportation',
      filter: ['==', ['get', 'class'], 'motorway'],
      layout: {
        'line-cap': 'round',
        'line-join': 'round',
      },
      paint: {
        'line-color': defaultPalette.roads?.motorway || defaultPalette.primary,
        'line-width': [
          'interpolate', ['linear'], ['zoom'],
          10, 2.2,
          11, 2.8,
          12, 3.4,
          13, 4.0,
          14, 4.6
        ],
      },
    },
    {
      id: 'population-density',
      type: 'fill',
      source: 'population',
      'source-layer': 'stats',
      paint: {
        'fill-color': defaultPalette.population,
        'fill-opacity': [
          'interpolate',
          ['linear'],
          ['get', 'population'],
          0, 0,
          1, 0.05,
          100, 0.15,
          1000, 0.3,
          10000, 0.5
        ],
      },
    },
    {
      id: 'contours',
      type: 'line',
      source: 'contours',
      'source-layer': 'contour',
      layout: {
        'line-join': 'round',
        'line-cap': 'round',
      },
      paint: {
        'line-color': defaultPalette.contour,
        'line-width': 0.5,
        'line-opacity': 0.4,
      },
    },
    {
      id: 'labels-place',
      type: 'symbol',
      source: 'openmaptiles',
      'source-layer': 'place',
      layout: {
        'text-field': '{name:en}',
        'text-font': ['Noto Sans Regular'],
        'text-size': {
          stops: [
            [4, 10],
            [12, 16],
          ],
        },
      },
      paint: {
        'text-color': defaultPalette.text,
        'text-halo-color': defaultPalette.background,
        'text-halo-width': 1,
      },
    },
  ],
};

const layerToggles: LayerToggle[] = [
  {
    id: 'streets',
    name: 'Streets',
    layerIds: [
      'road-service', 
      'road-residential', 
      'road-tertiary', 
      'road-secondary', 
      'road-primary', 
      'road-trunk', 
      'road-motorway'
    ],
  },
  {
    id: 'buildings',
    name: 'Buildings',
    layerIds: ['buildings'],
  },
  {
    id: 'water',
    name: 'Water',
    layerIds: ['water', 'waterway'],
  },
  {
    id: 'parks',
    name: 'Parks',
    layerIds: ['park'],
  },
  {
    id: 'terrain',
    name: 'Terrain Shading',
    layerIds: ['hillshade'],
  },
  {
    id: 'contours',
    name: 'Topography (Contours)',
    layerIds: ['contours'],
  },
  {
    id: 'population',
    name: 'Population Density',
    layerIds: ['population-density'],
  },
  {
    id: 'labels',
    name: 'Labels',
    layerIds: ['labels-place'],
  },
];

export const vintageStyle: PosterStyle = {
  id: 'vintage',
  name: 'Vintage / Antique',
  description: 'Warm, nostalgic maps with aged parchment and sepia tones',
  mapStyle: mapStyle,
  defaultPalette: defaultPalette,
  palettes: [
    parchmentPalette, 
    atlasPalette, 
    sepiaPalette, 
    maritimePalette, 
    fadedPalette, 
    colonialPalette
  ],
  recommendedFonts: ['IM Fell English', 'Playfair Display', 'EB Garamond', 'Cormorant Garamond'],
  layerToggles: layerToggles,
};

