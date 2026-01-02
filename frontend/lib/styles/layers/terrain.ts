import type { ColorPalette } from '@/types/poster';
import { isColorDark } from '@/lib/utils';

export interface TerrainLayerOptions {
  hillshadeExaggeration?: number;
  hillshadeShadowColor?: string;
  hillshadeHighlightColor?: string;
  hillshadeAccentColor?: string;
  includeVolumetricBathymetry?: boolean;
  contourStyle?: 'simple' | 'detailed'; // simple = single contours layer, detailed = regular + index + labels
  contourColor?: string;
  contourIndexColor?: string;
}

/**
 * Creates terrain layers (hillshade, contours, bathymetry).
 * Supports both simple and detailed contour rendering styles.
 */
export function createTerrainLayers(
  palette: ColorPalette,
  options: TerrainLayerOptions = {}
): any[] {
  const {
    hillshadeExaggeration = 0.6,
    hillshadeShadowColor,
    hillshadeHighlightColor,
    hillshadeAccentColor,
    includeVolumetricBathymetry = false,
    contourStyle = 'simple',
    contourColor,
    contourIndexColor,
  } = options;

  const isDark = isColorDark(palette.background);
  const layers: any[] = [];

  // Hillshade layer
  const shadowColor = hillshadeShadowColor || 
    (palette.hillshade ? palette.hillshade : (isDark ? '#000000' : (palette.secondary || palette.text)));
  const highlightColor = hillshadeHighlightColor || 
    (palette.hillshade ? palette.background : (isDark ? (palette.secondary || palette.text) : palette.background));
  const accentColor = hillshadeAccentColor || shadowColor;

  layers.push({
    id: 'hillshade',
    type: 'hillshade',
    source: 'terrain',
    paint: {
      'hillshade-shadow-color': shadowColor,
      'hillshade-highlight-color': highlightColor,
      'hillshade-accent-color': accentColor,
      'hillshade-exaggeration': hillshadeExaggeration,
    },
  });

  // Bathymetry layers (underwater terrain)
  if (includeVolumetricBathymetry) {
    // Volumetric bathymetry for topographic style - multiple depth layers
    const depths = [10, 50, 200, 1000, 3000, 5000];
    for (const depth of depths) {
      layers.push({
        id: `bathymetry-volumetric-${depth}`,
        type: 'line',
        source: 'contours',
        'source-layer': 'contour',
        filter: [
          'all',
          ['has', 'height'],
          ['<=', ['get', 'height'], -depth],
        ],
        paint: {
          'line-color': '#001a33',
          'line-width': ['interpolate', ['linear'], ['zoom'], 9, 40, 12, 100, 15, 200],
          'line-blur': ['interpolate', ['linear'], ['zoom'], 9, 30, 12, 80, 15, 150],
          'line-opacity': 0.05,
        },
      });
    }
  } else {
    // Simple bathymetry detail layer
    layers.push({
      id: 'bathymetry-detail',
      type: 'line',
      source: 'contours',
      'source-layer': 'contour',
      filter: [
        'all',
        ['has', 'height'],
        ['<', ['get', 'height'], 0],
      ],
      paint: {
        'line-color': isDark ? '#FFFFFF' : '#001a33',
        'line-width': ['interpolate', ['linear'], ['zoom'], 9, 10, 12, 30, 15, 60],
        'line-blur': ['interpolate', ['linear'], ['zoom'], 9, 8, 12, 20, 15, 40],
        'line-opacity': isDark ? 0.05 : 0.1,
      },
    });
  }

  // Contour layers
  if (contourStyle === 'detailed') {
    // Detailed contours: separate regular, index, and label layers
    const regularColor = contourColor || '#B8A080';
    const indexColor = contourIndexColor || '#6E5A40';

    // Regular contours
    layers.push({
      id: 'contours-regular',
      type: 'line',
      source: 'contours',
      'source-layer': 'contour',
      filter: [
        'all',
        ['has', 'height'],
        ['>', ['get', 'height'], 0],
        [
          'any',
          ['!=', ['%', ['get', 'height'], 500], 0],
          ['<', ['get', 'height'], 500],
        ],
      ],
      layout: {
        'line-join': 'round',
        'line-cap': 'round',
      },
      paint: {
        'line-color': regularColor,
        'line-width': [
          'interpolate', ['linear'], ['zoom'],
          9, 0.8,
          10, 0.9,
          11, 1.0,
          12, 1.2,
          13, 1.5,
          14, 1.8,
          15, 2.0,
        ],
        'line-opacity': [
          'interpolate', ['linear'], ['zoom'],
          9, 0.65,
          11, 0.75,
          13, 0.85,
        ],
      },
    });

    // Index contours (major intervals)
    layers.push({
      id: 'contours-index',
      type: 'line',
      source: 'contours',
      'source-layer': 'contour',
      filter: [
        'all',
        ['has', 'height'],
        ['>', ['get', 'height'], 0],
        ['==', ['%', ['get', 'height'], 500], 0],
      ],
      layout: {
        'line-join': 'round',
        'line-cap': 'round',
      },
      paint: {
        'line-color': indexColor,
        'line-width': [
          'interpolate', ['linear'], ['zoom'],
          9, 0.5,
          10, 0.8,
          11, 1.0,
          12, 1.4,
          13, 1.8,
          14, 2.2,
          15, 2.6,
        ],
        'line-opacity': [
          'interpolate', ['linear'], ['zoom'],
          9, 0.5,
          11, 0.65,
          13, 0.8,
        ],
      },
    });

    // Contour labels
    layers.push({
      id: 'contours-labels',
      type: 'symbol',
      source: 'contours',
      'source-layer': 'contour',
      filter: [
        'all',
        ['has', 'height'],
        ['>', ['get', 'height'], 0],
        ['==', ['%', ['get', 'height'], 500], 0],
      ],
      layout: {
        'symbol-placement': 'line',
        'text-field': ['concat', ['to-string', ['get', 'height']], 'm'],
        'text-font': ['Noto Sans Regular'],
        'text-size': [
          'interpolate', ['linear'], ['zoom'],
          9, 7,
          10, 8,
          11, 8.5,
          12, 9,
          13, 9.5,
          14, 10,
          15, 11,
        ],
        'text-padding': 50,
        'text-max-angle': 30,
        'symbol-spacing': [
          'interpolate', ['linear'], ['zoom'],
          9, 250,
          10, 300,
          12, 350,
          14, 400,
        ],
      },
      paint: {
        'text-color': indexColor || palette.contourIndex || palette.contour || palette.text,
        'text-halo-color': palette.background,
        'text-halo-width': 1.5,
        'text-halo-blur': 0.5,
        'text-opacity': [
          'interpolate', ['linear'], ['zoom'],
          9, 0.7,
          10, 0.8,
          11, 0.9,
          12, 1,
        ],
      },
    });
  } else {
    // Simple contours: single layer
    const color = contourColor || 
      palette.contour || 
      palette.contourIndex || 
      palette.secondary || 
      palette.roads?.secondary || 
      palette.text;

    layers.push({
      id: 'contours',
      type: 'line',
      source: 'contours',
      'source-layer': 'contour',
      layout: {
        'line-join': 'round',
        'line-cap': 'round',
      },
      paint: {
        'line-color': color,
        'line-width': [
          'interpolate', ['linear'], ['zoom'],
          9, 0.8,
          11, 1.0,
          13, 1.3,
          15, 1.6,
        ],
        'line-opacity': [
          'interpolate', ['linear'], ['zoom'],
          9, 0.6,
          11, 0.7,
          13, 0.8,
        ],
      },
    });
  }

  return layers;
}


