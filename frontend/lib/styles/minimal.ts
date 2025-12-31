import type { PosterStyle, ColorPalette, LayerToggle } from '@/types/poster';
import { 
  getOpenFreeMapPlanetTileJsonUrl, 
  getContourTileJsonUrl, 
  getPopulationTileUrl,
  getAwsTerrariumTileUrl
} from '@/lib/styles/tileUrl';
import { TERRAIN_TILE_SIZE } from '@/lib/styles/config';

const inkPalette: ColorPalette = {
  id: 'minimal-ink',
  name: 'Ink & Paper',
  style: 'minimal',
  
  background: '#F7F5F0',
  text: '#2C2C2C',
  border: '#2C2C2C',
  
  roads: {
    motorway: '#1A1A1A',
    trunk: '#252525',
    primary: '#2C2C2C',
    secondary: '#3D3D3D',
    tertiary: '#5C5C5C',
    residential: '#6E6E6E',
    service: '#8A8A8A',
  },
  
  water: '#E0E7ED',
  waterLine: '#C8D4DC',
  greenSpace: '#EDEEE8',
  landuse: '#F0EDE6',
  buildings: '#EBE8E2',
  
  accent: '#2C2C2C',
};

const defaultPalette = inkPalette;

const charcoalPalette: ColorPalette = {
  id: 'minimal-charcoal',
  name: 'Charcoal',
  style: 'minimal',
  
  background: '#F5F5F0',
  text: '#2D2D2D',
  border: '#2D2D2D',
  
  roads: {
    motorway: '#1F1F1F',
    trunk: '#2D2D2D',
    primary: '#3A3A3A',
    secondary: '#4D4D4D',
    tertiary: '#666666',
    residential: '#7A7A7A',
    service: '#909090',
  },
  
  water: '#B8C5D0',
  waterLine: '#A0B0BC',
  greenSpace: '#C5CBBA',
  landuse: '#ECEBE5',
  buildings: '#E5E4DE',
  
  accent: '#2D2D2D',
};

const navyPalette: ColorPalette = {
  id: 'minimal-navy',
  name: 'Navy & Cream',
  style: 'minimal',
  
  background: '#FDF6E3',
  text: '#1E3A5F',
  border: '#1E3A5F',
  
  roads: {
    motorway: '#0F2840',
    trunk: '#1A3350',
    primary: '#1E3A5F',
    secondary: '#2E4A6F',
    tertiary: '#3E5C81',
    residential: '#5070A0',
    service: '#6888B0',
  },
  
  water: '#D4E4F0',
  waterLine: '#B8D0E4',
  greenSpace: '#E4EAD8',
  landuse: '#F5EED8',
  buildings: '#EFE8D8',
  
  accent: '#1E3A5F',
};

const warmGrayPalette: ColorPalette = {
  id: 'minimal-warm',
  name: 'Warm Gray',
  style: 'minimal',
  
  background: '#FAF8F5',
  text: '#4A4A4A',
  border: '#4A4A4A',
  
  roads: {
    motorway: '#3A3A3A',
    trunk: '#454545',
    primary: '#4A4A4A',
    secondary: '#5A5A5A',
    tertiary: '#707070',
    residential: '#888888',
    service: '#A0A0A0',
  },
  
  water: '#D8E4EC',
  waterLine: '#C0D0DC',
  greenSpace: '#E4E8DC',
  landuse: '#F2F0EB',
  buildings: '#EBE9E4',
  
  accent: '#4A4A4A',
};

const blushPalette: ColorPalette = {
  id: 'minimal-blush',
  name: 'Blush',
  style: 'minimal',
  
  background: '#F8F4F1',
  text: '#4A3F3F',
  border: '#4A3F3F',
  
  roads: {
    motorway: '#4A3F3F',
    trunk: '#5A4D4D',
    primary: '#6B5B5B',
    secondary: '#7A6A6A',
    tertiary: '#8B7E7E',
    residential: '#A09090',
    service: '#B8A8A8',
  },
  
  water: '#D4E4ED',
  waterLine: '#B8D0E0',
  greenSpace: '#E2E8DC',
  landuse: '#F2EEEA',
  buildings: '#ECE8E4',
  
  accent: '#6B5B5B',
};

const sagePalette: ColorPalette = {
  id: 'minimal-sage',
  name: 'Sage',
  style: 'minimal',
  
  background: '#F5F5F0',
  text: '#3D4A3D',
  border: '#3D4A3D',
  
  roads: {
    motorway: '#2D3A2D',
    trunk: '#374437',
    primary: '#3D4A3D',
    secondary: '#4D5A4D',
    tertiary: '#5D6A5D',
    residential: '#6D7A6D',
    service: '#8A9A8A',
  },
  
  water: '#C8D8E0',
  waterLine: '#A8C0CC',
  greenSpace: '#D8E0D0',
  landuse: '#ECEEE8',
  buildings: '#E5E8E2',
  
  accent: '#3D4A3D',
};

const copperPalette: ColorPalette = {
  id: 'minimal-copper',
  name: 'Copper',
  style: 'minimal',
  
  background: '#FAF6F2',
  text: '#6B4423',
  border: '#6B4423',
  
  roads: {
    motorway: '#5A3818',
    trunk: '#634020',
    primary: '#6B4423',
    secondary: '#7A5533',
    tertiary: '#8B6644',
    residential: '#A07850',
    service: '#B89070',
  },
  
  water: '#D0E0E8',
  waterLine: '#B0CCD8',
  greenSpace: '#E0E4D8',
  landuse: '#F2EEE8',
  buildings: '#ECE8E2',
  
  accent: '#8B5A30',
};

const mapStyle = {
  version: 8,
  name: 'Minimal Line Art',
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
        'hillshade-shadow-color': defaultPalette.roads.secondary,
        'hillshade-highlight-color': defaultPalette.background,
        'hillshade-accent-color': defaultPalette.roads.secondary,
        'hillshade-exaggeration': 0.6,
      },
    },
    {
      id: 'water',
      type: 'fill',
      source: 'openmaptiles',
      'source-layer': 'water',
      filter: ['all', ['!=', ['get', 'class'], 'pier'], ['!=', ['get', 'brunnel'], 'bridge']],
      paint: {
        'fill-color': defaultPalette.water,
        'fill-opacity': 0.6,
      },
    },
    {
      id: 'waterway',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'waterway',
      paint: {
        'line-color': defaultPalette.waterLine || defaultPalette.water,
        'line-opacity': 0.7,
        'line-width': [
          'interpolate', ['linear'], ['zoom'],
          10, 0.5,
          12, 1.0,
          14, 1.5,
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
        'fill-opacity': 0.3,
      },
    },
    {
      id: 'buildings',
      type: 'fill',
      source: 'openmaptiles',
      'source-layer': 'building',
      paint: {
        'fill-color': defaultPalette.buildings || defaultPalette.secondary,
        'fill-opacity': 0.15,
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
      paint: {
        'line-color': defaultPalette.roads.service,
        'line-width': [
          'interpolate', ['linear'], ['zoom'],
          11, 0.1,
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
      paint: {
        'line-color': defaultPalette.roads.residential,
        'line-width': [
          'interpolate', ['linear'], ['zoom'],
          9, 0.1,
          12, 0.4,
          13, 0.7,
          14, 1.0
        ],
      },
    },
    {
      id: 'road-tertiary',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'transportation',
      filter: ['==', ['get', 'class'], 'tertiary'],
      paint: {
        'line-color': defaultPalette.roads.tertiary,
        'line-width': [
          'interpolate', ['linear'], ['zoom'],
          10, 0.3,
          11, 0.5,
          12, 0.8,
          13, 1.1,
          14, 1.4
        ],
      },
    },
    {
      id: 'road-secondary',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'transportation',
      filter: ['==', ['get', 'class'], 'secondary'],
      paint: {
        'line-color': defaultPalette.roads.secondary,
        'line-width': [
          'interpolate', ['linear'], ['zoom'],
          10, 0.6,
          11, 0.9,
          12, 1.2,
          13, 1.6,
          14, 2.0
        ],
      },
    },
    {
      id: 'road-primary',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'transportation',
      filter: ['==', ['get', 'class'], 'primary'],
      paint: {
        'line-color': defaultPalette.roads.primary,
        'line-width': [
          'interpolate', ['linear'], ['zoom'],
          10, 1.0,
          11, 1.4,
          12, 1.8,
          13, 2.2,
          14, 2.6
        ],
      },
    },
    {
      id: 'road-trunk',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'transportation',
      filter: ['==', ['get', 'class'], 'trunk'],
      paint: {
        'line-color': defaultPalette.roads.trunk,
        'line-width': [
          'interpolate', ['linear'], ['zoom'],
          10, 1.5,
          11, 2.0,
          12, 2.5,
          13, 3.0,
          14, 3.5
        ],
      },
    },
    {
      id: 'road-motorway',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'transportation',
      filter: ['==', ['get', 'class'], 'motorway'],
      paint: {
        'line-color': defaultPalette.roads.motorway,
        'line-width': [
          'interpolate', ['linear'], ['zoom'],
          10, 2.0,
          11, 2.5,
          12, 3.0,
          13, 3.5,
          14, 4.0
        ],
      },
    },
    {
      id: 'bridge-motorway-casing',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'transportation',
      filter: ['all', ['==', ['get', 'class'], 'motorway'], ['==', ['get', 'brunnel'], 'bridge']],
      paint: {
        'line-color': defaultPalette.background,
        'line-width': [
          'interpolate', ['linear'], ['zoom'],
          10, 2.0 * 1.5,
          11, 2.5 * 1.5,
          12, 3.0 * 1.5,
          13, 3.5 * 1.5,
          14, 4.0 * 1.5
        ],
      },
    },
    {
      id: 'bridge-motorway',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'transportation',
      filter: ['all', ['==', ['get', 'class'], 'motorway'], ['==', ['get', 'brunnel'], 'bridge']],
      paint: {
        'line-color': defaultPalette.roads.motorway,
        'line-width': [
          'interpolate', ['linear'], ['zoom'],
          10, 2.0 * 1.1,
          11, 2.5 * 1.1,
          12, 3.0 * 1.1,
          13, 3.5 * 1.1,
          14, 4.0 * 1.1
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
          0, 0,      // 0 population = 0 opacity (fixes ocean hexes)
          1, 0.05,   // Very faint at 1 person
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
        'text-transform': 'uppercase',
        'text-letter-spacing': 0.1,
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
      'road-motorway',
      'bridge-motorway-casing',
      'bridge-motorway'
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

export const minimalStyle: PosterStyle = {
  id: 'minimal',
  name: 'Minimal Line Art',
  description: 'Clean, monochromatic street maps with minimal detail',
  mapStyle: mapStyle,
  defaultPalette: defaultPalette,
  palettes: [
    inkPalette, 
    charcoalPalette, 
    navyPalette, 
    warmGrayPalette, 
    blushPalette, 
    sagePalette, 
    copperPalette
  ],
  recommendedFonts: ['Inter', 'Helvetica Neue', 'Outfit', 'DM Sans'],
  layerToggles: layerToggles,
};

