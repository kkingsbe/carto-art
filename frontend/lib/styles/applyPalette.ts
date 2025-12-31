import type { ColorPalette, PosterConfig, PosterStyle } from '@/types/poster';
import { isColorDark } from '@/lib/utils';

/**
 * Helper to scale a value that might be a number or a zoom interpolation expression
 */
function scaleExpression(expr: any, factor: number): any {
  if (typeof expr === 'number') return expr * factor;
  
  // Handle modern interpolate expression
  if (Array.isArray(expr) && expr[0] === 'interpolate') {
    return expr.map((val: any, i: number) => {
      // Output values are at even indices starting from 4 (0: interpolate, 1: type, 2: input, 3: first stop input, 4: first stop output...)
      if (i >= 4 && i % 2 === 0 && typeof val === 'number') {
        return val * factor;
      }
      return val;
    });
  }
  
  // Handle legacy stops format
  if (expr && typeof expr === 'object' && expr.stops) {
    return {
      ...expr,
      stops: expr.stops.map((stop: [number, number]) => [stop[0], stop[1] * factor])
    };
  }
  
  return expr;
}

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

  const roadWeightMultiplier = (layers?.roadWeight ?? 1.0) * (layers?.labels ? 0.8 : 1.0);
  const labelAdjustment = layers?.labels ? 0.7 : 1.0;

  updatedStyle.layers.forEach((layer: any) => {
    updateLayerPaint(layer, palette, layers, labelAdjustment, roadWeightMultiplier);
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

function updateLayerPaint(
  layer: any, 
  palette: ColorPalette, 
  layers: PosterConfig['layers'] | undefined, 
  labelAdjustment: number,
  roadWeightMultiplier: number
) {
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
    
    // Apply road weight multiplier correctly to interpolation arrays or numbers
    if (layer.paint?.['line-width']) {
      layer.paint['line-width'] = scaleExpression(layer.paint['line-width'], roadWeightMultiplier);
    }
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
      'text-halo-width': 2.5,
      'text-halo-blur': 1.5,
      'text-opacity': 0.9,
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
  const { type } = layer;

  if (type === 'symbol') {
    if (layers?.labelMaxWidth) {
      layer.layout = {
        ...layer.layout,
        'text-max-width': layers.labelMaxWidth,
      };
    }

    if (layers?.labelSize && layers.labelSize !== 1.0) {
      const existingSize = layer.layout?.['text-size'];
      if (existingSize) {
        layer.layout['text-size'] = scaleExpression(existingSize, layers.labelSize);
      }
    }

    // Add standard label layout optimizations
    layer.layout = {
      ...layer.layout,
      'text-padding': 10,
      'text-allow-overlap': false,
      'text-ignore-placement': false,
    };
  }
}
