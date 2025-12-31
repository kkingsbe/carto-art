import type { ColorPalette, PosterConfig, PosterStyle } from '@/types/poster';
import { isColorDark } from '@/lib/utils';

/**
 * Applies a color palette and layer visibility to a MapLibre style
 */
export function applyPaletteToStyle(
  style: any, 
  palette: ColorPalette, 
  layers?: PosterConfig['layers'],
  layerToggles?: PosterStyle['layerToggles']
): any {
  // Use a faster/cleaner deep clone if possible, but JSON is safe for Mapbox styles
  const updatedStyle = JSON.parse(JSON.stringify(style));

  if (!updatedStyle.layers) return updatedStyle;

  handleContourSource(updatedStyle);
  
  if (layers && layerToggles) {
    applyVisibilityToggles(updatedStyle.layers, layers, layerToggles);
  }

  const labelAdjustment = layers?.labels ? 0.85 : 1.0;

  updatedStyle.layers.forEach((layer: any) => {
    updateLayerPaint(layer, palette, layers, labelAdjustment);
    updateLayerLayout(layer, layers);
  });

  return updatedStyle;
}

function handleContourSource(style: any) {
  const contourSource = style.sources?.contours;
  if (!contourSource || !contourSource.url || contourSource.url === '') {
    style.layers = style.layers.filter((layer: any) => 
      layer.id !== 'contours' && !layer.id.includes('contour')
    );
  }
}

function applyVisibilityToggles(
  styleLayers: any[], 
  configLayers: PosterConfig['layers'], 
  layerToggles: PosterStyle['layerToggles']
) {
  styleLayers.forEach((layer) => {
    const toggle = layerToggles.find(t => t.layerIds.includes(layer.id));
    if (toggle) {
      const isVisible = configLayers[toggle.id as keyof PosterConfig['layers']];
      layer.layout = {
        ...layer.layout,
        visibility: isVisible ? 'visible' : 'none'
      };
    }
  });
}

function updateLayerPaint(layer: any, palette: ColorPalette, layers: PosterConfig['layers'] | undefined, labelAdjustment: number) {
  const { id, type } = layer;

  // Background
  if (id === 'background' && type === 'background') {
    layer.paint = { 'background-color': palette.background };
    return;
  }

  // Hillshade
  if (id === 'hillshade' && type === 'hillshade') {
    const isDark = isColorDark(palette.background);
    
    // Add exaggeration from config if available
    const exaggeration = layers?.hillshadeExaggeration ?? 0.5;
    
    if (palette.hillshade) {
      layer.paint = {
        ...layer.paint,
        'hillshade-shadow-color': palette.hillshade,
        'hillshade-highlight-color': palette.background,
        'hillshade-accent-color': palette.hillshade,
        'hillshade-exaggeration': exaggeration,
      };
    } else {
      layer.paint = {
        ...layer.paint,
        'hillshade-shadow-color': isDark ? '#000000' : (palette.secondary || palette.text),
        'hillshade-highlight-color': isDark ? (palette.secondary || palette.text) : palette.background,
        'hillshade-accent-color': isDark ? '#000000' : (palette.secondary || palette.text),
        'hillshade-exaggeration': exaggeration,
      };
    }
    return;
  }

  // Water
  if (id === 'water' && type === 'fill') {
    layer.paint = { ...layer.paint, 'fill-color': palette.water };
    return;
  }

  // Parks
  if (id === 'park' && type === 'fill') {
    layer.paint = { ...layer.paint, 'fill-color': palette.parks || palette.greenSpace };
    return;
  }

  // Contours
  if (id.includes('contour') || id.includes('topo')) {
    if (type === 'line') {
      const color = id.includes('index') 
        ? (palette.contourIndex || palette.contour || palette.secondary || palette.roads.secondary) 
        : (palette.contour || palette.secondary || palette.roads.secondary);
      
      layer.paint = {
        ...layer.paint,
        'line-color': color,
        'line-opacity': layer.paint?.['line-opacity'] ?? 0.4,
      };
    }
    applyContourDensity(layer, layers?.contourDensity);
    return;
  }

  // Population
  if (id.includes('population') && type === 'fill') {
    const existingOpacity = layer.paint?.['fill-opacity'];
    layer.paint = {
      ...layer.paint,
      'fill-color': palette.population || palette.accent || palette.primary || palette.roads.motorway,
      'fill-opacity': Array.isArray(existingOpacity) ? existingOpacity : (existingOpacity ?? 0.6),
    };
    return;
  }

  // Roads & Bridges
  if (id.startsWith('road-') || id.startsWith('bridge-') || id.startsWith('tunnel-')) {
    updateRoadLayer(layer, palette, labelAdjustment);
    return;
  }

  // Buildings
  if (id.includes('building')) {
    if (type === 'fill') {
      layer.paint = {
        ...layer.paint,
        'fill-color': palette.buildings || palette.primary || palette.text,
        'fill-opacity': layer.paint?.['fill-opacity'] ?? 0.5,
      };
    } else if (type === 'line') {
      layer.paint = {
        ...layer.paint,
        'line-color': palette.buildings || palette.primary || palette.text,
      };
    }
    return;
  }

  // Labels
  if (id.includes('label') && type === 'symbol') {
    layer.paint = {
      ...layer.paint,
      'text-color': palette.text,
      'text-halo-color': palette.background,
      'text-halo-width': 1.5,
      'text-halo-blur': 0.5,
    };
    return;
  }

  // Grid
  if (id === 'grid' && palette.grid) {
    layer.paint = {
      ...layer.paint,
      'line-color': palette.grid,
      'line-opacity': layer.paint?.['line-opacity'] ?? 0.2,
    };
  }
}

function applyContourDensity(layer: any, density: number | undefined) {
  if (!density || layer['source-layer'] !== 'contour') return;

  if (layer.id.includes('index')) {
    layer.filter = ['==', ['%', ['get', 'ele'], density * 5], 0];
  } else if (layer.id.includes('regular')) {
    layer.filter = [
      'all',
      ['==', ['%', ['get', 'ele'], density], 0],
      ['!=', ['%', ['get', 'ele'], density * 5], 0]
    ];
  } else {
    layer.filter = ['==', ['%', ['get', 'ele'], density], 0];
  }
}

function updateRoadLayer(layer: any, palette: ColorPalette, labelAdjustment: number) {
  if (layer.type !== 'line') return;

  // Handle bridge casings - they usually take the background color
  if (layer.id.includes('bridge') && layer.id.includes('casing')) {
    layer.paint['line-color'] = palette.background;
    return;
  }

  // Handle specific road classes
  const classes = ['motorway', 'trunk', 'primary', 'secondary', 'tertiary', 'residential', 'service'];
  const matchedClass = classes.find(cls => layer.id.includes(cls));
  
  if (matchedClass) {
    const roadColor = (palette.roads as any)[matchedClass];
    if (roadColor) {
      layer.paint['line-color'] = roadColor;
      // Special handling for glow layers - keep their blur and reduce opacity
      if (layer.id.includes('glow')) {
        layer.paint['line-opacity'] = (layer.paint?.['line-opacity'] ?? 0.4) * labelAdjustment;
      } else {
        layer.paint['line-opacity'] = (layer.paint?.['line-opacity'] ?? 1.0) * labelAdjustment;
      }
      return;
    }
  }

  // Special handling for road-glow if it didn't match a class above
  if (layer.id.includes('glow')) {
    layer.paint = {
      ...layer.paint,
      'line-color': palette.roads.motorway,
      'line-opacity': (layer.paint?.['line-opacity'] ?? 0.4) * labelAdjustment,
    };
    return;
  }

  // Fallback for any other line layers starting with 'road-'
  const isSecondary = ['road-street', 'road-residential', 'road-tertiary', 'road-service'].includes(layer.id);
  const fallbackColor = isSecondary 
    ? (palette.secondary || palette.roads.secondary) 
    : (palette.primary || palette.roads.primary);

  layer.paint = {
    ...layer.paint,
    'line-color': fallbackColor,
    'line-opacity': (layer.paint?.['line-opacity'] ?? (isSecondary ? 0.8 : 1.0)) * labelAdjustment,
  };
}

function updateLayerLayout(layer: any, layers: PosterConfig['layers'] | undefined) {
  if (layer.type === 'symbol' && layers?.labelMaxWidth) {
    layer.layout = {
      ...layer.layout,
      'text-max-width': layers.labelMaxWidth,
    };
  }
}
