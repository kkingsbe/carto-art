import type { PosterStyle, LayerToggle } from '@/types/poster';
import { 
  getOpenFreeMapPlanetTileJsonUrl, 
  getContourTileJsonUrl, 
  getPopulationTileUrl,
  getAwsTerrariumTileUrl
} from '@/lib/styles/tileUrl';
import { TERRAIN_TILE_SIZE } from '@/lib/styles/config';
import { organicPalettes } from './extra-palettes';

const defaultPalette = organicPalettes[0];

const mapStyle = {
  version: 8,
  name: 'Organic / Nature',
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
        'hillshade-exaggeration': 0.5,
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
        'fill-opacity': 1.0, // Solid water for organic feel
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
        'line-width': ['interpolate', ['linear'], ['zoom'], 9, 15, 12, 45, 15, 90],
        'line-blur': ['interpolate', ['linear'], ['zoom'], 9, 12, 12, 30, 15, 60],
        'line-opacity': 0.12,
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
          10, 1.0,
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
        'fill-opacity': 0.9, // Very present green spaces
      },
    },
    {
      id: 'buildings',
      type: 'fill',
      source: 'openmaptiles',
      'source-layer': 'building',
      paint: {
        'fill-color': defaultPalette.buildings || defaultPalette.secondary,
        'fill-opacity': 0.3,
      },
    },
    // Roads - thinner, less dominant
    {
      id: 'road-service',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'transportation',
      filter: ['all', ['in', ['get', 'class'], ['literal', ['service', 'path', 'track']]], ['>=', ['zoom'], 11]],
      paint: {
        'line-color': defaultPalette.roads.service,
        'line-width': ['interpolate', ['linear'], ['zoom'], 11, 0.05, 13, 0.2, 14, 0.4],
        'line-opacity': 0.4,
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
        'line-width': ['interpolate', ['linear'], ['zoom'], 9, 0.05, 12, 0.3, 13, 0.5, 14, 0.8],
        'line-opacity': 0.5,
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
        'line-width': ['interpolate', ['linear'], ['zoom'], 10, 0.2, 11, 0.4, 12, 0.6, 13, 0.9, 14, 1.2],
        'line-opacity': 0.6,
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
        'line-width': ['interpolate', ['linear'], ['zoom'], 10, 0.4, 11, 0.7, 12, 1.0, 13, 1.4, 14, 1.8],
        'line-opacity': 0.7,
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
        'line-width': ['interpolate', ['linear'], ['zoom'], 10, 0.8, 11, 1.2, 12, 1.5, 13, 2.0, 14, 2.4],
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
        'line-width': ['interpolate', ['linear'], ['zoom'], 10, 1.2, 11, 1.6, 12, 2.0, 13, 2.6, 14, 3.2],
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
        'line-width': ['interpolate', ['linear'], ['zoom'], 10, 1.5, 11, 2.0, 12, 2.5, 13, 3.0, 14, 3.6],
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
        'line-width': 0.7,
        'line-opacity': 0.5,
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
        'text-size': ['interpolate', ['linear'], ['zoom'], 2, 11, 6, 19],
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
        'text-size': ['interpolate', ['linear'], ['zoom'], 3, 10, 8, 18],
        'text-letter-spacing': 0.15,
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
        'text-size': ['interpolate', ['linear'], ['zoom'], 4, 9, 12, 15],
        'text-letter-spacing': 0.05,
        'text-padding': 5,
      },
      paint: {
        'text-color': defaultPalette.text,
        'text-halo-color': defaultPalette.background,
        'text-halo-width': 2,
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

export const organicStyle: PosterStyle = {
  id: 'organic',
  name: 'Organic / Nature',
  description: 'Grounded maps with rich forest greens, desert earths, and ocean depths',
  mapStyle: mapStyle,
  defaultPalette: defaultPalette,
  palettes: organicPalettes,
  recommendedFonts: ['Outfit', 'Crimson Pro', 'Fraunces', 'Bricolage Grotesque'],
  layerToggles: layerToggles,
};

