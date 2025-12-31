import type { PosterStyle, ColorPalette, LayerToggle } from '@/types/poster';
import { 
  getOpenFreeMapPlanetTileJsonUrl, 
  getContourTileJsonUrl, 
  getPopulationTileUrl,
  getTerrainRgbTileJsonUrl
} from '@/lib/styles/tileUrl';
import { TERRAIN_TILE_SIZE } from '@/lib/styles/config';

const coastalPalette: ColorPalette = {
  id: 'watercolor-coastal',
  name: 'Coastal Wash',
  style: 'watercolor',
  
  background: '#FAF8F5',
  text: '#4A5568',
  border: '#9CA5A8',
  
  roads: {
    motorway: '#5A6068',
    trunk: '#6E7078',
    primary: '#787880',
    secondary: '#8A8C90',
    tertiary: '#9CA0A0',
    residential: '#B8BCBC',
    service: '#C8CCCC',
  },
  
  water: '#7BA3B8',
  waterLine: '#5D8AA0',
  greenSpace: '#A8B89C',
  landuse: '#F0EDE5',
  buildings: '#E8E0D8',
  
  accent: '#9CA5A8',
};

const defaultPalette = coastalPalette;

const springPalette: ColorPalette = {
  id: 'watercolor-spring',
  name: 'Spring Garden',
  style: 'watercolor',
  
  background: '#FFFEF9',
  text: '#4A4540',
  border: '#8A9080',
  
  roads: {
    motorway: '#4A4540',
    trunk: '#5C524C',
    primary: '#6A605A',
    secondary: '#7A7570',
    tertiary: '#8B8680',
    residential: '#A8A4A0',
    service: '#C0BCBA',
  },
  
  water: '#89A8C4',
  waterLine: '#6090B0',
  greenSpace: '#8AB888',
  landuse: '#F8F5EC',
  buildings: '#ECE8E0',
  
  accent: '#8AB888',
};

const sunsetPalette: ColorPalette = {
  id: 'watercolor-sunset',
  name: 'Sunset Wash',
  style: 'watercolor',
  
  background: '#FDF8F4',
  text: '#5A4A48',
  border: '#B89890',
  
  roads: {
    motorway: '#5A4A48',
    trunk: '#6A5A58',
    primary: '#7A6A68',
    secondary: '#8A7A78',
    tertiary: '#9A8A88',
    residential: '#B8A8A8',
    service: '#D0C0C0',
  },
  
  water: '#90A0B8',
  waterLine: '#7088A0',
  greenSpace: '#B8C0A0',
  landuse: '#F8F0E8',
  buildings: '#F0E8E0',
  
  accent: '#C8A090',
};

const duskPalette: ColorPalette = {
  id: 'watercolor-dusk',
  name: 'Dusk',
  style: 'watercolor',
  
  background: '#FAF8FA',
  text: '#4A4048',
  border: '#908088',
  
  roads: {
    motorway: '#4A4048',
    trunk: '#5A5058',
    primary: '#6A6068',
    secondary: '#7A7078',
    tertiary: '#908088',
    residential: '#A898A0',
    service: '#C0B8BC',
  },
  
  water: '#9090B8',
  waterLine: '#7070A0',
  greenSpace: '#A8A898',
  landuse: '#F4F2F4',
  buildings: '#EAE8EC',
  
  accent: '#9090B8',
};

const sumiPalette: ColorPalette = {
  id: 'watercolor-sumi',
  name: 'Sumi-e',
  style: 'watercolor',
  
  background: '#FAF9F6',
  text: '#2A2828',
  border: '#6A6868',
  
  roads: {
    motorway: '#2A2828',
    trunk: '#3A3838',
    primary: '#4A4848',
    secondary: '#5A5858',
    tertiary: '#6A6868',
    residential: '#8A8888',
    service: '#A8A8A8',
  },
  
  water: '#A8B0B0',
  waterLine: '#788888',
  greenSpace: '#C8C8C0',
  landuse: '#F2F1EE',
  buildings: '#E8E8E4',
  
  accent: '#6A6868',
};

const botanicalPalette: ColorPalette = {
  id: 'watercolor-botanical',
  name: 'Botanical',
  style: 'watercolor',
  
  background: '#FAFAF5',
  text: '#2A3A2A',
  border: '#5A7058',
  
  roads: {
    motorway: '#2A3A2A',
    trunk: '#3A4A3A',
    primary: '#4A5A4A',
    secondary: '#5A6A5A',
    tertiary: '#6A7A6A',
    residential: '#8A9A8A',
    service: '#A8B8A8',
  },
  
  water: '#7090A8',
  waterLine: '#507888',
  greenSpace: '#7AA870',
  landuse: '#F4F5F0',
  buildings: '#E8EAE4',
  
  accent: '#5A7058',
};

const mapStyle = {
  version: 8,
  name: 'Watercolor / Painted',
  metadata: {
    'mapbox:autocomposite': false,
  },
  sources: {
    openmaptiles: {
      type: 'vector',
      url: getOpenFreeMapPlanetTileJsonUrl(),
      minzoom: 0,
      maxzoom: 14,
    },
    contours: {
      type: 'vector',
      url: getContourTileJsonUrl() || '',
      minzoom: 0,
      maxzoom: 14,
    },
    population: {
      type: 'vector',
      tiles: [getPopulationTileUrl()],
      minzoom: 0,
      maxzoom: 14,
      attribution: '<a href="https://www.kontur.io/portfolio/population-dataset/" target="_blank">Kontur Population</a>',
    },
    terrain: {
      type: 'raster-dem',
      url: getTerrainRgbTileJsonUrl() || '',
      tileSize: TERRAIN_TILE_SIZE,
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
        'hillshade-shadow-color': defaultPalette.secondary,
        'hillshade-highlight-color': defaultPalette.background,
        'hillshade-accent-color': defaultPalette.secondary,
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
        'fill-translate': [2, 2], // Slight offset for organic feel
        'fill-antialias': true,
      },
    },
    {
      id: 'waterway',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'waterway',
      layout: {
        'line-cap': 'round',
        'line-join': 'round',
      },
      paint: {
        'line-color': defaultPalette.waterLine || defaultPalette.water,
        'line-opacity': 0.7,
        'line-blur': 1,
        'line-width': [
          'interpolate', ['linear'], ['zoom'],
          10, 1.2,
          12, 2.0,
          14, 3.0,
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
        'fill-opacity': 0.6,
      },
    },
    {
      id: 'buildings',
      type: 'fill',
      source: 'openmaptiles',
      'source-layer': 'building',
      paint: {
        'fill-color': defaultPalette.buildings || defaultPalette.secondary,
        'fill-opacity': 0.2,
      },
    },
    {
      id: 'road-service',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'transportation',
      filter: ['all', 
        ['in', ['get', 'class'], ['literal', ['service', 'path', 'track']]],
        ['>=', ['zoom'], 13]
      ],
      layout: {
        'line-cap': 'round',
        'line-join': 'round',
      },
      paint: {
        'line-color': defaultPalette.roads?.service || defaultPalette.secondary,
        'line-blur': 0.5,
        'line-width': [
          'interpolate', ['linear'], ['zoom'],
          13, 0.3,
          14, 0.7
        ],
      },
    },
    {
      id: 'road-residential',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'transportation',
      filter: ['all',
        ['in', ['get', 'class'], ['literal', ['residential', 'living_street']]],
        ['>=', ['zoom'], 11]
      ],
      layout: {
        'line-cap': 'round',
        'line-join': 'round',
      },
      paint: {
        'line-color': defaultPalette.roads?.residential || defaultPalette.secondary,
        'line-blur': 0.5,
        'line-width': [
          'interpolate', ['linear'], ['zoom'],
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
        'line-blur': 0.5,
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
        'line-blur': 0.5,
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
        'line-blur': 0.5,
        'line-width': [
          'interpolate', ['linear'], ['zoom'],
          10, 1.1,
          11, 1.5,
          12, 1.9,
          13, 2.4,
          14, 2.9
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
        'line-blur': 0.5,
        'line-width': [
          'interpolate', ['linear'], ['zoom'],
          10, 1.6,
          11, 2.1,
          12, 2.6,
          13, 3.2,
          14, 3.8
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
        'line-blur': 0.5,
        'line-width': [
          'interpolate', ['linear'], ['zoom'],
          10, 2.0,
          11, 2.6,
          12, 3.2,
          13, 3.8,
          14, 4.4
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

export const watercolorStyle: PosterStyle = {
  id: 'watercolor',
  name: 'Watercolor / Painted',
  description: 'Soft, organic maps with diffuse edges and a hand-painted feel',
  thumbnail: '/thumbnails/watercolor.jpg',
  mapStyle: mapStyle,
  defaultPalette: defaultPalette,
  palettes: [
    coastalPalette, 
    springPalette, 
    sunsetPalette, 
    duskPalette, 
    sumiPalette, 
    botanicalPalette
  ],
  recommendedFonts: ['Quicksand', 'Nunito', 'Pacifico', 'Caveat'],
  layerToggles: layerToggles,
};

