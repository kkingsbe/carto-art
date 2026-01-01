import type { ColorPalette } from '@/types/poster';

export interface POILayerOptions {
  includeSpaceports?: boolean; // Default: false
  aerowayOpacity?: number;      // Default: 0.3
  spaceportOpacity?: number;    // Default: 0.3
  aerowayColor?: string;        // Override palette.secondary
  spaceportColor?: string;      // Override palette.accent
  spaceportLabelFilter?: any[]; // Optional custom filter for spaceport labels
}

/**
 * Creates POI layers including airports (aeroway) and optionally spaceports.
 * Airports are always included; spaceports are conditional based on includeSpaceports flag.
 */
export function createPOILayers(
  palette: ColorPalette,
  options: POILayerOptions = {}
): any[] {
  const {
    includeSpaceports = false,
    aerowayOpacity = 0.3,
    spaceportOpacity = 0.3,
    aerowayColor,
    spaceportColor,
    spaceportLabelFilter,
  } = options;

  const aerowayFillColor = aerowayColor || palette.secondary || palette.primary || palette.text;
  const spaceportFillColor = spaceportColor || palette.accent || palette.secondary || palette.text;

  const layers: any[] = [
    // Aeroway area (airports)
    {
      id: 'aeroway-area',
      type: 'fill',
      source: 'openmaptiles',
      'source-layer': 'aeroway',
      filter: ['==', ['geometry-type'], 'Polygon'],
      paint: {
        'fill-color': aerowayFillColor,
        'fill-opacity': aerowayOpacity,
      },
    },
    // Aeroway runway
    {
      id: 'aeroway-runway',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'aeroway',
      filter: ['all', ['==', ['geometry-type'], 'LineString'], ['==', ['get', 'class'], 'runway']],
      paint: {
        'line-color': aerowayFillColor,
        'line-width': [
          'interpolate', ['linear'], ['zoom'],
          10, 0.5,
          12, 2,
          14, 4,
        ],
      },
    },
    // Aerodrome labels (airports) - ✈ emoji
    {
      id: 'aerodrome-label',
      type: 'symbol',
      source: 'openmaptiles',
      'source-layer': 'aerodrome_label',
      minzoom: 10,
      layout: {
        'text-field': ['concat', '✈ ', ['coalesce', ['get', 'name:en'], ['get', 'name:latin'], ['get', 'name']]],
        'text-font': ['Noto Sans Regular'],
        'text-size': ['interpolate', ['linear'], ['zoom'], 10, 9, 14, 12],
        'text-padding': 5,
        'text-anchor': 'top',
        'text-offset': [0, 0.5],
      },
      paint: {
        'text-color': palette.text,
        'text-halo-color': palette.background,
        'text-halo-width': 1.5,
        'text-halo-blur': 0.5,
      },
    },
    // POI symbols (monuments, museums, etc.)
    {
      id: 'poi-symbol',
      type: 'circle',
      source: 'openmaptiles',
      'source-layer': 'poi',
      minzoom: 12,
      filter: [
        'in',
        ['get', 'class'],
        ['literal', ['monument', 'museum', 'stadium', 'attraction', 'artwork', 'viewpoint']],
      ],
      paint: {
        'circle-radius': 3,
        'circle-color': palette.primary || palette.accent || palette.text,
        'circle-stroke-width': 1,
        'circle-stroke-color': palette.background,
      },
    },
    // POI labels
    {
      id: 'poi-label',
      type: 'symbol',
      source: 'openmaptiles',
      'source-layer': 'poi',
      minzoom: 13,
      filter: [
        'in',
        ['get', 'class'],
        ['literal', ['monument', 'museum', 'stadium', 'attraction', 'artwork', 'viewpoint']],
      ],
      layout: {
        'text-field': ['coalesce', ['get', 'name:en'], ['get', 'name:latin'], ['get', 'name']],
        'text-font': ['Noto Sans Regular'],
        'text-size': 9,
        'text-padding': 5,
        'text-anchor': 'top',
        'text-offset': [0, 0.8],
      },
      paint: {
        'text-color': palette.text,
        'text-halo-color': palette.background,
        'text-halo-width': 1.5,
        'text-halo-blur': 0.5,
        'text-opacity': 0.8,
      },
    },
  ];

  // Conditionally add spaceport layers
  if (includeSpaceports) {
    // Note: Custom filters can override, but default is to show all pads
    // (all GeoJSON features are spaceports by definition)
    
    const spaceportAreaLayer = {
      id: 'spaceport-area',
      type: 'fill',
      source: 'openmaptiles',
      'source-layer': 'aeroway',
      filter: ['all', ['==', ['geometry-type'], 'Polygon'], ['==', ['get', 'class'], 'spaceport']],
      paint: {
        'fill-color': spaceportFillColor,
        'fill-opacity': spaceportOpacity,
      },
    };
    
    // Use GeoJSON source from Launch Library 2 API instead of aerodrome_label or aeroway
    // since those sources don't contain reliable spaceport label data
    // GeoJSON sources don't need geometry-type filters (they're always points)
    // Custom filters can still filter by properties if provided (e.g., by active status)
    // If no custom filter is provided, show all pads (no filter means all features shown)
    
    // Type inference works here; explicit 'any' removed for better type safety
    const spaceportLabelLayer = {
      id: 'spaceport-label',
      type: 'symbol',
      source: 'spaceports',  // Changed to use GeoJSON source from Launch Library API
      minzoom: 8, // Lowered from 10 to 8 to show labels at lower zoom levels
      ...(spaceportLabelFilter ? { filter: spaceportLabelFilter } : {}), // Only add filter if custom filter provided
      layout: {
        'text-field': ['concat', '🚀 ', ['coalesce', ['get', 'name']]],
        'text-font': ['Noto Sans Regular'],
        'text-size': ['interpolate', ['linear'], ['zoom'], 8, 8, 10, 9, 14, 12], // Adjusted for new minzoom
        'text-padding': 2, // Reduced padding to allow more labels to show
        'text-anchor': 'top',
        // Offset to top-right: 0.6 units right, 1.2 units up
        // This places the label above and to the right of the pad centroid
        'text-offset': [0.6, 1.2],
        'text-allow-overlap': true, // Changed to true so labels show even when overlapping
        'text-ignore-placement': true, // Ignore placement conflicts with other symbols to ensure labels display
        'text-optional': false,
      },
      paint: {
        'text-color': palette.text,
        'text-halo-color': palette.background,
        'text-halo-width': 1.5,
        'text-halo-blur': 0.5,
      },
    };
    
    layers.push(spaceportAreaLayer, spaceportLabelLayer);
  }

  return layers;
}

