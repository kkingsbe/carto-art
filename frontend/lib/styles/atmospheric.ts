import type { PosterStyle, LayerToggle } from '@/types/poster';
import { 
  getOpenFreeMapPlanetTileJsonUrl, 
  getContourTileJsonUrl, 
  getPopulationTileUrl,
  getAwsTerrariumTileUrl
} from '@/lib/styles/tileUrl';
import { TERRAIN_TILE_SIZE } from '@/lib/styles/config';
import { atmosphericPalettes } from './extra-palettes';

const defaultPalette = atmosphericPalettes[0];

const mapStyle = {
  version: 8,
  name: 'Atmospheric / Ethereal',
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
        'hillshade-exaggeration': 0.8, // More dramatic for atmospheric
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
        'fill-opacity': 0.8, // Softer, more present
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
        'line-width': ['interpolate', ['linear'], ['zoom'], 9, 20, 12, 60, 15, 120],
        'line-blur': ['interpolate', ['linear'], ['zoom'], 9, 15, 12, 40, 15, 80],
        'line-opacity': 0.1,
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
        'fill-opacity': 0.4,
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
    // Roads
    {
      id: 'road-service',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'transportation',
      filter: ['all', ['in', ['get', 'class'], ['literal', ['service', 'path', 'track']]], ['>=', ['zoom'], 11]],
      paint: {
        'line-color': defaultPalette.roads.service,
        'line-width': ['interpolate', ['linear'], ['zoom'], 11, 0.1, 13, 0.3, 14, 0.5],
        'line-opacity': 0.6,
      },
    },
    {
      id: 'road-residential',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'transportation',
      filter: ['all', ['in', ['get', 'class'], ['literal', ['residential', 'living_street', 'unclassified', 'minor']]], ['>=', ['zoom'], 9]],
      paint: {
        'line-color': defaultPalette.roads.residential,
        'line-width': ['interpolate', ['linear'], ['zoom'], 9, 0.1, 12, 0.4, 13, 0.7, 14, 1.0],
        'line-opacity': 0.7,
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
        'line-width': ['interpolate', ['linear'], ['zoom'], 10, 0.3, 11, 0.5, 12, 0.8, 13, 1.1, 14, 1.4],
        'line-opacity': 0.8,
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
        'line-width': ['interpolate', ['linear'], ['zoom'], 10, 0.6, 11, 0.9, 12, 1.2, 13, 1.6, 14, 2.0],
        'line-opacity': 0.9,
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
        'line-width': ['interpolate', ['linear'], ['zoom'], 10, 1.0, 11, 1.4, 12, 1.8, 13, 2.2, 14, 2.6],
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
        'line-width': ['interpolate', ['linear'], ['zoom'], 10, 1.5, 11, 2.0, 12, 2.5, 13, 3.0, 14, 3.5],
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
        'line-width': ['interpolate', ['linear'], ['zoom'], 10, 2.0, 11, 2.5, 12, 3.0, 13, 3.5, 14, 4.0],
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
        'line-color': defaultPalette.contour || defaultPalette.text,
        'line-width': 0.5,
        'line-opacity': 0.3,
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
        'text-size': ['interpolate', ['linear'], ['zoom'], 2, 10, 6, 18],
        'text-transform': 'uppercase',
        'text-letter-spacing': 0.3,
      },
      paint: {
        'text-color': defaultPalette.text,
        'text-halo-color': defaultPalette.background,
        'text-halo-width': 2.5,
        'text-halo-blur': 1.0,
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
        'text-size': ['interpolate', ['linear'], ['zoom'], 3, 9, 8, 16],
        'text-transform': 'uppercase',
        'text-letter-spacing': 0.2,
      },
      paint: {
        'text-color': defaultPalette.text,
        'text-opacity': 0.8,
        'text-halo-color': defaultPalette.background,
        'text-halo-width': 2.5,
        'text-halo-blur': 1.0,
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
        'text-size': ['interpolate', ['linear'], ['zoom'], 4, 8, 12, 14],
        'text-transform': 'uppercase',
        'text-letter-spacing': 0.2,
        'text-padding': 5,
      },
      paint: {
        'text-color': defaultPalette.text,
        'text-halo-color': defaultPalette.background,
        'text-halo-width': 1.5,
        'text-halo-blur': 0.5,
      },
    },
  ],
};

const layerToggles: LayerToggle[] = [
  { id: 'streets', name: 'Streets', layerIds: ['road-service', 'road-residential', 'road-tertiary', 'road-secondary', 'road-primary', 'road-trunk', 'road-motorway'] },
  { id: 'buildings', name: 'Buildings', layerIds: ['buildings'] },
  { id: 'water', name: 'Water', layerIds: ['water', 'waterway'] },
  { id: 'terrainUnderWater', name: 'Underwater Terrain', layerIds: ['bathymetry-detail'] },
  { id: 'parks', name: 'Parks', layerIds: ['park'] },
  { id: 'terrain', name: 'Terrain Shading', layerIds: ['hillshade'] },
  { id: 'contours', name: 'Topography (Contours)', layerIds: ['contours'] },
  { id: 'labels-admin', name: 'State & Country Names', layerIds: ['labels-country', 'labels-state', 'boundaries-admin'] },
  { id: 'labels-cities', name: 'City Names', layerIds: ['labels-city'] },
];

export const atmosphericStyle: PosterStyle = {
  id: 'atmospheric',
  name: 'Atmospheric / Ethereal',
  description: 'Soft, luminous maps with hazy gradients and sunset tones',
  mapStyle: mapStyle,
  defaultPalette: defaultPalette,
  palettes: atmosphericPalettes,
  recommendedFonts: ['Outfit', 'Montserrat', 'Quicksand', 'Lexend'],
  layerToggles: layerToggles,
};

