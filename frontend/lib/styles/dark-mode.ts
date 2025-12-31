import type { PosterStyle, ColorPalette, LayerToggle } from '@/types/poster';
import { 
  getOpenFreeMapPlanetTileJsonUrl, 
  getContourTileJsonUrl, 
  getPopulationTileUrl,
  getAwsTerrariumTileUrl
} from '@/lib/styles/tileUrl';
import { TERRAIN_TILE_SIZE } from '@/lib/styles/config';

const goldPalette: ColorPalette = {
  id: 'dark-gold',
  name: 'Gold Standard',
  style: 'dark-mode',
  
  background: '#0A0A0F',
  text: '#D4AF37',
  border: '#D4AF37',
  
  roads: {
    motorway: '#E8C547',
    trunk: '#D4AF37',
    primary: '#C9A432',
    secondary: '#B89428',
    tertiary: '#9A8228',
    residential: '#7A6820',
    service: '#5A4E1A',
  },
  
  water: '#06080D',
  waterLine: '#1A1A25',
  greenSpace: '#0A0F0A',
  landuse: '#0C0C12',
  buildings: '#12121A',
  
  accent: '#E8C547',
};

const defaultPalette = goldPalette;

const silverPalette: ColorPalette = {
  id: 'dark-silver',
  name: 'Silver City',
  style: 'dark-mode',
  
  background: '#0C0C10',
  text: '#C0C0C8',
  border: '#C0C0C8',
  
  roads: {
    motorway: '#E8E8F0',
    trunk: '#D0D0D8',
    primary: '#C0C0C8',
    secondary: '#A8A8B0',
    tertiary: '#888890',
    residential: '#686870',
    service: '#484850',
  },
  
  water: '#08080C',
  waterLine: '#18181C',
  greenSpace: '#0C100C',
  landuse: '#0E0E12',
  buildings: '#141418',
  
  accent: '#E8E8F0',
};

const rosePalette: ColorPalette = {
  id: 'dark-rose',
  name: 'Rose Night',
  style: 'dark-mode',
  
  background: '#1A0F14',
  text: '#E8B4B8',
  border: '#E8B4B8',
  
  roads: {
    motorway: '#F5D0D4',
    trunk: '#E8B4B8',
    primary: '#D8A0A4',
    secondary: '#C08888',
    tertiary: '#A07070',
    residential: '#805858',
    service: '#604040',
  },
  
  water: '#0F0A10',
  waterLine: '#2A1A20',
  greenSpace: '#0F1410',
  landuse: '#1C1218',
  buildings: '#201820',
  
  accent: '#E8B4B8',
};

const neonPalette: ColorPalette = {
  id: 'dark-neon',
  name: 'Neon Noir',
  style: 'dark-mode',
  
  background: '#0B0B1A',
  text: '#FFFFFF',
  border: '#00E5FF',
  
  roads: {
    motorway: '#00F5FF',
    trunk: '#00E5EE',
    primary: '#00D4DD',
    secondary: '#00B8C0',
    tertiary: '#009099',
    residential: '#006870',
    service: '#004048',
  },
  
  water: '#050510',
  waterLine: '#0A1020',
  greenSpace: '#0A140A',
  landuse: '#0D0D1E',
  buildings: '#10102A',
  
  accent: '#00F5FF',
};

const navyPalette: ColorPalette = {
  id: 'dark-navy',
  name: 'Deep Navy',
  style: 'dark-mode',
  
  background: '#0B1929',
  text: '#F5F5F5',
  border: '#F5F5F5',
  
  roads: {
    motorway: '#FFFFFF',
    trunk: '#F0F0F0',
    primary: '#E0E0E0',
    secondary: '#C8C8C8',
    tertiary: '#A8A8A8',
    residential: '#808080',
    service: '#585858',
  },
  
  water: '#061220',
  waterLine: '#102030',
  greenSpace: '#0A1A10',
  landuse: '#0D1C2C',
  buildings: '#101F30',
  
  accent: '#F5F5F5',
};

const emberPalette: ColorPalette = {
  id: 'dark-ember',
  name: 'Ember',
  style: 'dark-mode',
  
  background: '#0F0A08',
  text: '#E85A30',
  border: '#E85A30',
  
  roads: {
    motorway: '#FF6A40',
    trunk: '#E85A30',
    primary: '#D04A28',
    secondary: '#B83A20',
    tertiary: '#982A18',
    residential: '#702010',
    service: '#481008',
  },
  
  water: '#080608',
  waterLine: '#1A1010',
  greenSpace: '#0A0A08',
  landuse: '#120C0A',
  buildings: '#181210',
  
  accent: '#FF6A40',
};

const auroraPalette: ColorPalette = {
  id: 'dark-aurora',
  name: 'Aurora',
  style: 'dark-mode',
  
  background: '#080C10',
  text: '#40E8B0',
  border: '#40E8B0',
  
  roads: {
    motorway: '#50F8C0',
    trunk: '#40E8B0',
    primary: '#30D8A0',
    secondary: '#28C090',
    tertiary: '#20A078',
    residential: '#188060',
    service: '#106048',
  },
  
  water: '#04080C',
  waterLine: '#0C1418',
  greenSpace: '#081008',
  landuse: '#0A0E12',
  buildings: '#0E1418',
  
  accent: '#50F8C0',
};

const mapStyle = {
  version: 8,
  name: 'Dark Mode / Noir',
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
        'hillshade-highlight-color': defaultPalette.roads.secondary,
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
        'fill-opacity': 0.8,
      },
    },
    {
      id: 'waterway',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'waterway',
      paint: {
        'line-color': defaultPalette.waterLine || defaultPalette.water,
        'line-opacity': 0.5,
        'line-width': [
          'interpolate', ['linear'], ['zoom'],
          10, 0.8,
          12, 1.2,
          14, 1.8,
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
        'fill-opacity': 0.4,
      },
    },
    {
      id: 'buildings',
      type: 'fill',
      source: 'openmaptiles',
      'source-layer': 'building',
      paint: {
        'fill-color': defaultPalette.buildings || defaultPalette.roads.primary,
        'fill-opacity': 0.3,
      },
    },
    {
      id: 'road-glow',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'transportation',
      filter: ['in', ['get', 'class'], ['literal', ['motorway', 'trunk', 'primary']]],
      paint: {
        'line-color': defaultPalette.roads.motorway,
        'line-blur': 4,
        'line-opacity': 0.4,
        'line-width': [
          'interpolate', ['linear'], ['zoom'],
          10, 2.5 * 2.5,
          11, 3.0 * 2.5,
          12, 3.5 * 2.5,
          13, 4.0 * 2.5,
          14, 4.5 * 2.5
        ],
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
          12, 0.2,
          13, 0.4,
          14, 0.6
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
        'line-color': defaultPalette.roads?.residential || defaultPalette.secondary,
        'line-width': [
          'interpolate', ['linear'], ['zoom'],
          9, 0.1,
          11, 0.2,
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
      paint: {
        'line-color': defaultPalette.roads?.secondary || defaultPalette.secondary,
        'line-width': [
          'interpolate', ['linear'], ['zoom'],
          10, 0.8,
          11, 1.1,
          12, 1.4,
          13, 1.8,
          14, 2.2
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
        'line-color': defaultPalette.roads?.primary || defaultPalette.primary,
        'line-width': [
          'interpolate', ['linear'], ['zoom'],
          10, 1.4,
          11, 1.8,
          12, 2.2,
          13, 2.6,
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
      paint: {
        'line-color': defaultPalette.roads?.trunk || defaultPalette.primary,
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
      id: 'road-motorway',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'transportation',
      filter: ['==', ['get', 'class'], 'motorway'],
      paint: {
        'line-color': defaultPalette.roads?.motorway || defaultPalette.primary,
        'line-width': [
          'interpolate', ['linear'], ['zoom'],
          10, 2.5,
          11, 3.0,
          12, 3.5,
          13, 4.0,
          14, 4.5
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
          1, 0.1,    // 10% opacity at 1 person
          100, 0.25,
          1000, 0.45,
          10000, 0.7
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
            [12, 14],
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
      'road-glow',
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

export const darkModeStyle: PosterStyle = {
  id: 'dark-mode',
  name: 'Dark Mode / Noir',
  description: 'Dramatic dark maps with luminous street networks',
  mapStyle: mapStyle,
  defaultPalette: defaultPalette,
  palettes: [
    goldPalette, 
    silverPalette, 
    rosePalette, 
    neonPalette, 
    navyPalette, 
    emberPalette, 
    auroraPalette
  ],
  recommendedFonts: ['Montserrat', 'Poppins', 'Bebas Neue', 'Oswald'],
  layerToggles: layerToggles,
};

