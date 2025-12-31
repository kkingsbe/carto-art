import type { PosterStyle, ColorPalette, LayerToggle } from '@/types/poster';
import { 
  getOpenFreeMapPlanetTileJsonUrl, 
  getContourTileJsonUrl, 
  getPopulationTileUrl,
  getAwsTerrariumTileUrl
} from '@/lib/styles/tileUrl';
import { TERRAIN_TILE_SIZE } from '@/lib/styles/config';

const defaultPalette: ColorPalette = {
  id: 'midnight-classic',
  name: 'Midnight',
  style: 'midnight',
  
  background: '#0D1B2A', // deep navy
  text: '#E0E1DD',
  border: '#E0E1DD',
  
  roads: {
    motorway: '#E0E1DD',
    trunk: '#D0D1CD',
    primary: '#C0C1BD',
    secondary: '#A0A090',
    tertiary: '#808070',
    residential: '#606050',
    service: '#404030',
  },
  
  water: '#1B263B',      // slightly lighter navy
  waterLine: '#1B263B',
  greenSpace: '#1B263B', // same as water
  landuse: '#0D1B2A',
  buildings: '#1B263B',
  
  accent: '#E0E1DD',
};

const mapStyle = {
  version: 8,
  name: 'Midnight',
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
        'hillshade-shadow-color': '#000000',
        'hillshade-highlight-color': defaultPalette.secondary,
        'hillshade-accent-color': '#000000',
        'hillshade-exaggeration': 0.6,
      },
    },
    {
      id: 'water',
      type: 'fill',
      source: 'openmaptiles',
      'source-layer': 'water',
      paint: {
        'fill-color': defaultPalette.water,
        'fill-opacity': 0.6,
      },
    },
    {
      id: 'road-service',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'transportation',
      filter: ['all', 
        ['in', ['get', 'class'], ['literal', ['service', 'path', 'track']]],
        ['>=', ['zoom'], 10]
      ],
      paint: {
        'line-color': defaultPalette.roads.service,
        'line-width': [
          'interpolate', ['linear'], ['zoom'],
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
        ['>=', ['zoom'], 8]
      ],
      paint: {
        'line-color': defaultPalette.roads.residential,
        'line-width': [
          'interpolate', ['linear'], ['zoom'],
          8, 0.1,
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
      'road-motorway'
    ],
  },
  {
    id: 'water',
    name: 'Water',
    layerIds: ['water'],
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

export const midnightStyle: PosterStyle = {
  id: 'midnight',
  name: 'Midnight Noir',
  description: 'Deep navy and ivory technical maps with a high-end feel',
  mapStyle: mapStyle,
  defaultPalette: defaultPalette,
  palettes: [defaultPalette],
  recommendedFonts: ['Outfit', 'Inter', 'DM Sans', 'Public Sans'],
  layerToggles: layerToggles,
};

