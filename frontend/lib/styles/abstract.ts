import type { PosterStyle, ColorPalette, LayerToggle } from '@/types/poster';
import { 
  getOpenFreeMapPlanetTileJsonUrl, 
  getContourTileJsonUrl, 
  getPopulationTileUrl,
  getAwsTerrariumTileUrl
} from '@/lib/styles/tileUrl';
import { TERRAIN_TILE_SIZE } from '@/lib/styles/config';
import { extraAbstractPalettes } from './extra-palettes';

const blocksPalette: ColorPalette = {
  id: 'abstract-blocks',
  name: 'Color Block',
  style: 'abstract',
  
  background: '#F5F5F0',
  text: '#1A1A1A',
  border: '#1A1A1A',
  
  roads: {
    motorway: '#1A1A1A',
    trunk: '#2A2A2A',
    primary: '#3A3A3A',
    secondary: '#4A4A4A',
    tertiary: '#5A5A5A',
    residential: '#7A7A7A',
    service: '#9A9A9A',
  },
  
  water: '#5090C0',
  waterLine: '#3070A0',
  greenSpace: '#70A870',
  landuse: '#E8E8E0',
  buildings: '#D8A870',
  
  accent: '#E85050',
};

const pastelPalette: ColorPalette = {
  id: 'abstract-pastel',
  name: 'Pastel Dream',
  style: 'abstract',
  
  background: '#FAF8F5',
  text: '#5A5A60',
  border: '#5A5A60',
  
  roads: {
    motorway: '#5A5A60',
    trunk: '#6A6A70',
    primary: '#7A7A80',
    secondary: '#8A8A90',
    tertiary: '#9A9AA0',
    residential: '#B0B0B8',
    service: '#C8C8D0',
  },
  
  water: '#A8C8E0',
  waterLine: '#88B0D0',
  greenSpace: '#B8D8B8',
  landuse: '#F2F0EC',
  buildings: '#E8D0D8',
  
  accent: '#D8A8B8',
};

const neonPalette: ColorPalette = {
  id: 'abstract-neon',
  name: 'Neon Pop',
  style: 'abstract',
  
  background: '#0A0A0A',
  text: '#FFFFFF',
  border: '#FF00FF',
  
  roads: {
    motorway: '#FFFFFF',
    trunk: '#FF00FF',
    primary: '#00FFFF',
    secondary: '#FFFF00',
    tertiary: '#FF8800',
    residential: '#8800FF',
    service: '#0088FF',
  },
  
  water: '#0040A0',
  waterLine: '#0060C0',
  greenSpace: '#00A040',
  landuse: '#101010',
  buildings: '#181818',
  
  accent: '#FF00FF',
};

const earthPalette: ColorPalette = {
  id: 'abstract-earth',
  name: 'Muted Earth',
  style: 'abstract',
  
  background: '#F0EBE0',
  text: '#3A3530',
  border: '#3A3530',
  
  roads: {
    motorway: '#3A3530',
    trunk: '#4A4540',
    primary: '#5A5550',
    secondary: '#6A6560',
    tertiary: '#7A7570',
    residential: '#9A9590',
    service: '#B0ABA8',
  },
  
  water: '#7898A0',
  waterLine: '#5878A0',
  greenSpace: '#8A9878',
  landuse: '#E5E0D5',
  buildings: '#C8A888',
  
  accent: '#A87850',
};

const defaultPalette = blocksPalette;

const mapStyle = {
  version: 8,
  name: 'Abstract / Artistic',
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
        'hillshade-highlight-color': '#FFFFFF',
        'hillshade-accent-color': '#000000',
        'hillshade-exaggeration': 0.3,
      },
    },
    {
      id: 'water',
      type: 'fill',
      source: 'openmaptiles',
      'source-layer': 'water',
      paint: {
        'fill-color': defaultPalette.water,
        'fill-opacity': 1,
      },
    },
    {
      id: 'bathymetry-detail',
      type: 'line',
      source: 'contours',
      'source-layer': 'contour',
      filter: ['<', ['get', 'ele'], 0],
      paint: {
        'line-color': '#001a33',
        'line-width': ['interpolate', ['linear'], ['zoom'], 9, 30, 12, 80, 15, 150],
        'line-blur': ['interpolate', ['linear'], ['zoom'], 9, 20, 12, 60, 15, 100],
        'line-opacity': 0.15,
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
        'fill-opacity': 0.8,
      },
    },
    {
      id: 'buildings',
      type: 'fill',
      source: 'openmaptiles',
      'source-layer': 'building',
      paint: {
        'fill-color': defaultPalette.buildings,
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
      id: 'population-density',
      type: 'fill',
      source: 'population',
      'source-layer': 'stats',
      paint: {
        'fill-color': defaultPalette.accent || defaultPalette.text,
        'fill-opacity': [
          'interpolate',
          ['linear'],
          ['get', 'population'],
          0, 0,
          1, 0.1,
          100, 0.3,
          1000, 0.5,
          10000, 0.7
        ],
      },
    },
    {
      id: 'boundaries-admin',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'boundary',
      filter: ['all', ['==', ['get', 'admin_level'], 4], ['==', ['get', 'maritime'], 0]],
      paint: {
        'line-color': defaultPalette.text,
        'line-width': 0.5,
        'line-dasharray': [4, 4],
        'line-opacity': 0.15,
      },
    },
    {
      id: 'labels-country',
      type: 'symbol',
      source: 'openmaptiles',
      'source-layer': 'place',
      filter: ['==', ['get', 'class'], 'country'],
      layout: {
        'text-field': ['coalesce', ['get', 'name:en'], ['get', 'name:latin'], ['get', 'name']],
        'text-font': ['Noto Sans Regular'],
        'text-size': ['interpolate', ['linear'], ['zoom'], 2, 14, 6, 22],
        'text-transform': 'uppercase',
        'text-letter-spacing': 0.3,
      },
      paint: {
        'text-color': defaultPalette.text,
        'text-halo-color': defaultPalette.background,
        'text-halo-width': 3,
        'text-halo-blur': 1,
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
        'text-size': ['interpolate', ['linear'], ['zoom'], 3, 13, 8, 20],
        'text-transform': 'uppercase',
        'text-letter-spacing': 0.2,
      },
      paint: {
        'text-color': defaultPalette.text,
        'text-opacity': 0.85,
        'text-halo-color': defaultPalette.background,
        'text-halo-width': 3,
        'text-halo-blur': 1,
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
        'text-size': ['interpolate', ['linear'], ['zoom'], 4, 12, 12, 19],
        'text-transform': 'uppercase',
        'text-letter-spacing': 0.15,
        'text-padding': 5,
      },
      paint: {
        'text-color': defaultPalette.text,
        'text-halo-color': defaultPalette.background,
        'text-halo-width': 2.5,
        'text-halo-blur': 1,
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
    id: 'terrainUnderWater',
    name: 'Underwater Terrain',
    layerIds: ['bathymetry-detail'],
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
    id: 'population',
    name: 'Population Density',
    layerIds: ['population-density'],
  },
  {
    id: 'labels-admin',
    name: 'State & Country Names',
    layerIds: ['labels-country', 'labels-state', 'boundaries-admin'],
  },
  {
    id: 'labels-cities',
    name: 'City Names',
    layerIds: ['labels-city'],
  },
];

export const abstractStyle: PosterStyle = {
  id: 'abstract',
  name: 'Abstract / Artistic',
  description: 'Bold, geometric interpretations of urban layouts with vibrant color blocking',
  mapStyle: mapStyle,
  defaultPalette: defaultPalette,
  palettes: [
    blocksPalette, 
    pastelPalette, 
    neonPalette, 
    earthPalette,
    ...extraAbstractPalettes
  ],
  recommendedFonts: ['Outfit', 'Space Grotesk', 'Syne', 'Unbounded'],
  layerToggles: layerToggles,
};

