import type { PosterStyle, ColorPalette, LayerToggle } from '@/types/poster';
import { 
  getOpenFreeMapPlanetTileJsonUrl, 
  getContourTileJsonUrl, 
  getPopulationTileUrl,
  getTerrainRgbTileJsonUrl
} from '@/lib/styles/tileUrl';
import { TERRAIN_TILE_SIZE } from '@/lib/styles/config';

const surveyPalette: ColorPalette = {
  id: 'topo-survey',
  name: 'Survey',
  style: 'topographic',
  
  background: '#F5F2E8',
  text: '#3C3020',
  border: '#5C4830',
  
  roads: {
    motorway: '#4A3020',
    trunk: '#5C4830',
    primary: '#6E5840',
    secondary: '#806848',
    tertiary: '#9A8060',
    residential: '#B89870',
    service: '#C8A880',
  },
  
  water: '#B8D4E8',
  waterLine: '#7BA3C4',
  greenSpace: '#D8E4D0',
  landuse: '#EBE8DE',
  buildings: '#E0DCD0',
  
  accent: '#5C4830',
  contour: '#B8A080',
  contourIndex: '#8B7355',
  hillshade: '#00000020',
};

const defaultPalette = surveyPalette;

const usgsPalette: ColorPalette = {
  id: 'topo-usgs',
  name: 'USGS Classic',
  style: 'topographic',
  
  background: '#F8F4E8',
  text: '#2A1810',
  border: '#4A3020',
  
  roads: {
    motorway: '#3A2010',
    trunk: '#4A3020',
    primary: '#5C4030',
    secondary: '#705040',
    tertiary: '#886858',
    residential: '#A08070',
    service: '#B89888',
  },
  
  water: '#8BC4E8',
  waterLine: '#4A98C8',
  greenSpace: '#B8D890',
  landuse: '#F0ECDC',
  buildings: '#E8E0D0',
  
  accent: '#4A3020',
  contour: '#B89070',
  contourIndex: '#8B6040',
  hillshade: '#00000018',
};

const nightPalette: ColorPalette = {
  id: 'topo-night',
  name: 'Terrain Night',
  style: 'topographic',
  
  background: '#1A1A2E',
  text: '#B8C5D0',
  border: '#6BB8C8',
  
  roads: {
    motorway: '#8AD0E0',
    trunk: '#6BB8C8',
    primary: '#58A0B0',
    secondary: '#4A8898',
    tertiary: '#3A7080',
    residential: '#2A5868',
    service: '#1A4050',
  },
  
  water: '#0F2040',
  waterLine: '#2A4060',
  greenSpace: '#1A2A1A',
  landuse: '#1C1C30',
  buildings: '#202040',
  
  accent: '#6BB8C8',
  contour: '#4A90A4',
  contourIndex: '#6BB8C8',
  hillshade: '#FFFFFF10',
};

const earthPalette: ColorPalette = {
  id: 'topo-earth',
  name: 'Earth Tone',
  style: 'topographic',
  
  background: '#F0E8D8',
  text: '#3A3028',
  border: '#5A4838',
  
  roads: {
    motorway: '#2A2018',
    trunk: '#3A3028',
    primary: '#4A4038',
    secondary: '#5A5048',
    tertiary: '#706860',
    residential: '#908878',
    service: '#A8A090',
  },
  
  water: '#88B8C8',
  waterLine: '#5898B0',
  greenSpace: '#B8C8A0',
  landuse: '#E8E0D0',
  buildings: '#DCD4C4',
  
  accent: '#5A4838',
  contour: '#A09078',
  contourIndex: '#786850',
  hillshade: '#00000015',
};

const monoPalette: ColorPalette = {
  id: 'topo-mono',
  name: 'Monochrome Relief',
  style: 'topographic',
  
  background: '#F0F0EC',
  text: '#2A2A28',
  border: '#4A4A48',
  
  roads: {
    motorway: '#1A1A18',
    trunk: '#2A2A28',
    primary: '#3A3A38',
    secondary: '#4A4A48',
    tertiary: '#5A5A58',
    residential: '#7A7A78',
    service: '#9A9A98',
  },
  
  water: '#C8D0D8',
  waterLine: '#98A8B0',
  greenSpace: '#D8DCD0',
  landuse: '#E8E8E4',
  buildings: '#DCDCD8',
  
  accent: '#4A4A48',
  contour: '#8A8A88',
  contourIndex: '#5A5A58',
  hillshade: '#00000012',
};

const mapStyle = {
  version: 8,
  name: 'Topographic / Contour',
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
      minzoom: 9,
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
        'hillshade-shadow-color': '#5C4830',
        'hillshade-highlight-color': '#FFFFFF',
        'hillshade-accent-color': '#5C4830',
        'hillshade-exaggeration': 0.15,
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
        'line-opacity': 0.9,
        'line-width': [
          'interpolate', ['linear'], ['zoom'],
          10, 1.0,
          12, 1.5,
          14, 2.0,
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
      id: 'contours-regular',
      type: 'line',
      source: 'contours',
      'source-layer': 'contour',
      filter: ['!=', ['%', ['get', 'ele'], 50], 0],
      layout: {
        'line-join': 'round',
        'line-cap': 'round',
      },
      paint: {
        'line-color': '#B8A080',
        'line-width': [
          'interpolate', ['linear'], ['zoom'],
          10, 0.3,
          12, 0.5,
          14, 0.7,
        ],
        'line-opacity': 0.4,
      },
    },
    {
      id: 'contours-index',
      type: 'line',
      source: 'contours',
      'source-layer': 'contour',
      // Every 5th line (assuming 10m intervals, so every 50m)
      filter: ['==', ['%', ['get', 'ele'], 50], 0],
      layout: {
        'line-join': 'round',
        'line-cap': 'round',
      },
      paint: {
        'line-color': '#8B7355',
        'line-width': [
          'interpolate', ['linear'], ['zoom'],
          10, 0.6,
          12, 0.9,
          14, 1.2,
        ],
        'line-opacity': 0.6,
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
        'line-color': defaultPalette.roads?.service || defaultPalette.secondary,
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
          12, 0.4,
          13, 0.6,
          14, 0.9
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
          10, 0.3,
          11, 0.4,
          12, 0.6,
          13, 0.9,
          14, 1.2
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
          10, 0.5,
          11, 0.7,
          12, 1.0,
          13, 1.3,
          14, 1.6
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
          10, 0.8,
          11, 1.1,
          12, 1.4,
          13, 1.7,
          14, 2.0
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
          10, 1.2,
          11, 1.5,
          12, 1.8,
          13, 2.2,
          14, 2.6
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
          10, 1.5,
          11, 1.8,
          12, 2.2,
          13, 2.6,
          14, 3.0
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
    layerIds: ['contours-regular', 'contours-index'],
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

export const topographicStyle: PosterStyle = {
  id: 'topographic',
  name: 'Topographic / Contour',
  description: 'Terrain-focused maps with detailed elevation contours and hillshading',
  thumbnail: '/thumbnails/topographic.jpg',
  mapStyle: mapStyle,
  defaultPalette: defaultPalette,
  palettes: [
    surveyPalette, 
    usgsPalette, 
    nightPalette, 
    earthPalette, 
    monoPalette
  ],
  recommendedFonts: ['Montserrat', 'Work Sans', 'Public Sans', 'IBM Plex Sans'],
  layerToggles: layerToggles,
};

