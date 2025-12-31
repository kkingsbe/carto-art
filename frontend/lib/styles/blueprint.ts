import type { PosterStyle, ColorPalette, LayerToggle } from '@/types/poster';
import { 
  getOpenFreeMapPlanetTileJsonUrl, 
  getContourTileJsonUrl, 
  getPopulationTileUrl,
  getTerrainRgbTileJsonUrl
} from '@/lib/styles/tileUrl';
import { TERRAIN_TILE_SIZE } from '@/lib/styles/config';

const classicPalette: ColorPalette = {
  id: 'blueprint-classic',
  name: 'Classic Blueprint',
  style: 'blueprint',
  
  background: '#0A2647',
  text: '#E8F1F5',
  border: '#E8F1F5',
  
  roads: {
    motorway: '#FFFFFF',
    trunk: '#F5F8FA',
    primary: '#E8F1F5',
    secondary: '#D0E0EC',
    tertiary: '#A8C8E0',
    residential: '#88A8C8',
    service: '#6888A8',
  },
  
  water: '#072035',
  waterLine: '#1A4060',
  greenSpace: '#0A3040',
  landuse: '#0D2D52',
  buildings: '#0F3355',
  
  accent: '#E8F1F5',
  grid: '#1A3A5C',
};

const defaultPalette = classicPalette;

const architectPalette: ColorPalette = {
  id: 'blueprint-architect',
  name: 'Architect',
  style: 'blueprint',
  
  background: '#1C2833',
  text: '#D4E6F1',
  border: '#D4E6F1',
  
  roads: {
    motorway: '#E8F4FA',
    trunk: '#D4E6F1',
    primary: '#C0D8E8',
    secondary: '#AED6F1',
    tertiary: '#90C0DC',
    residential: '#70A0C0',
    service: '#5080A0',
  },
  
  water: '#141E28',
  waterLine: '#2E4053',
  greenSpace: '#1A2830',
  landuse: '#202D38',
  buildings: '#243540',
  
  accent: '#D4E6F1',
  grid: '#2E4053',
};

const cyanPalette: ColorPalette = {
  id: 'blueprint-cyan',
  name: 'Cyan Line',
  style: 'blueprint',
  
  background: '#001F3F',
  text: '#5DD4E8',
  border: '#5DD4E8',
  
  roads: {
    motorway: '#70E8F8',
    trunk: '#5DD4E8',
    primary: '#50C4D8',
    secondary: '#40B0C8',
    tertiary: '#3098B0',
    residential: '#207890',
    service: '#105868',
  },
  
  water: '#00152B',
  waterLine: '#003050',
  greenSpace: '#002030',
  landuse: '#002244',
  buildings: '#002850',
  
  accent: '#70E8F8',
  grid: '#003366',
};

const grayPalette: ColorPalette = {
  id: 'blueprint-gray',
  name: 'Technical Gray',
  style: 'blueprint',
  
  background: '#1A1E24',
  text: '#C8D0D8',
  border: '#C8D0D8',
  
  roads: {
    motorway: '#E0E8F0',
    trunk: '#C8D0D8',
    primary: '#B8C0C8',
    secondary: '#A0A8B0',
    tertiary: '#888F98',
    residential: '#686E78',
    service: '#484E58',
  },
  
  water: '#12161A',
  waterLine: '#282E34',
  greenSpace: '#181E1C',
  landuse: '#1E2228',
  buildings: '#22282E',
  
  accent: '#C8D0D8',
  grid: '#282E38',
};

const whitePalette: ColorPalette = {
  id: 'blueprint-white',
  name: 'Whiteprint',
  style: 'blueprint',
  
  background: '#F5F8FA',
  text: '#0A2647',
  border: '#0A2647',
  
  roads: {
    motorway: '#082040',
    trunk: '#0A2647',
    primary: '#0E3055',
    secondary: '#1A4068',
    tertiary: '#2E5580',
    residential: '#4A7098',
    service: '#6888B0',
  },
  
  water: '#E0EBF5',
  waterLine: '#A0C0DC',
  greenSpace: '#E8F0EC',
  landuse: '#EEF2F5',
  buildings: '#E5EBF0',
  
  accent: '#0A2647',
  grid: '#D0DCE8',
};

const mapStyle = {
  version: 8,
  name: 'Blueprint / Technical',
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
        'hillshade-shadow-color': '#061322', // Very dark blue for blueprint shadows
        'hillshade-highlight-color': defaultPalette.secondary,
        'hillshade-accent-color': '#061322',
        'hillshade-exaggeration': 0.5,
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
      id: 'park',
      type: 'fill',
      source: 'openmaptiles',
      'source-layer': 'park',
      paint: {
        'fill-color': defaultPalette.greenSpace,
        'fill-opacity': 0.25,
      },
    },
    {
      id: 'buildings',
      type: 'fill',
      source: 'openmaptiles',
      'source-layer': 'building',
      paint: {
        'fill-color': defaultPalette.buildings || defaultPalette.primary,
        'fill-opacity': 0.2,
        'fill-outline-color': '#4A6A8A',
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
        'line-cap': 'square',
        'line-join': 'miter',
      },
      paint: {
        'line-color': defaultPalette.roads?.service || defaultPalette.secondary,
        'line-width': [
          'interpolate', ['linear'], ['zoom'],
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
        ['in', ['get', 'class'], ['literal', ['residential', 'living_street']]],
        ['>=', ['zoom'], 11]
      ],
      layout: {
        'line-cap': 'square',
        'line-join': 'miter',
      },
      paint: {
        'line-color': defaultPalette.roads?.residential || defaultPalette.secondary,
        'line-width': [
          'interpolate', ['linear'], ['zoom'],
          11, 0.2,
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
      layout: {
        'line-cap': 'square',
        'line-join': 'miter',
      },
      paint: {
        'line-color': defaultPalette.roads?.tertiary || defaultPalette.secondary,
        'line-width': [
          'interpolate', ['linear'], ['zoom'],
          10, 0.3,
          11, 0.5,
          12, 0.7,
          13, 1.0,
          14, 1.3
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
        'line-cap': 'square',
        'line-join': 'miter',
      },
      paint: {
        'line-color': defaultPalette.roads?.secondary || defaultPalette.secondary,
        'line-width': [
          'interpolate', ['linear'], ['zoom'],
          10, 0.6,
          11, 0.8,
          12, 1.1,
          13, 1.4,
          14, 1.8
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
        'line-cap': 'square',
        'line-join': 'miter',
      },
      paint: {
        'line-color': defaultPalette.roads?.primary || defaultPalette.primary,
        'line-width': [
          'interpolate', ['linear'], ['zoom'],
          10, 1.0,
          11, 1.3,
          12, 1.6,
          13, 2.0,
          14, 2.4
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
        'line-cap': 'square',
        'line-join': 'miter',
      },
      paint: {
        'line-color': defaultPalette.roads?.trunk || defaultPalette.primary,
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
      id: 'road-motorway',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'transportation',
      filter: ['==', ['get', 'class'], 'motorway'],
      layout: {
        'line-cap': 'square',
        'line-join': 'miter',
      },
      paint: {
        'line-color': defaultPalette.roads?.motorway || defaultPalette.primary,
        'line-width': [
          'interpolate', ['linear'], ['zoom'],
          10, 1.8,
          11, 2.2,
          12, 2.6,
          13, 3.0,
          14, 3.4
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
          1, 0.1,
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
        'line-join': 'miter',
        'line-cap': 'square',
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
    layerIds: ['water'],
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

export const blueprintStyle: PosterStyle = {
  id: 'blueprint',
  name: 'Blueprint / Technical',
  description: 'Architectural blueprint style with high-contrast lines on deep blue',
  thumbnail: '/thumbnails/blueprint.jpg',
  mapStyle: mapStyle,
  defaultPalette: defaultPalette,
  palettes: [
    classicPalette, 
    architectPalette, 
    cyanPalette, 
    grayPalette, 
    whitePalette
  ],
  recommendedFonts: ['JetBrains Mono', 'IBM Plex Mono', 'Space Mono', 'Roboto Mono'],
  layerToggles: layerToggles,
};

