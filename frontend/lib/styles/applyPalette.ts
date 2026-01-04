import type { ColorPalette, PosterConfig, PosterStyle } from '@/types/poster';
import { isColorDark, hexToRgb, rgbToHex, adjustColorHue, lightenColor, darkenColor, desaturateColor, saturateColor, mixColor } from '@/lib/utils/color';
import { getContourTileJsonUrl } from '@/lib/styles/tileUrl';
import { logger } from '@/lib/logger';
import { VisibilityManager } from './palette/VisibilityManager';



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

  if (!updatedStyle.layers) {
    return updatedStyle;
  }

  if (!palette) {
    console.warn('applyPaletteToStyle called without palette');
    return updatedStyle;
  }

  handleContourSource(updatedStyle);
  normalizeSpaceportsSource(updatedStyle);

  // Ensure water layers always come after hillshade to hide terrain under water
  reorderLayersForWater(updatedStyle.layers);

  if (layers && layerToggles) {
    const visibilityManager = new VisibilityManager();
    visibilityManager.apply(updatedStyle.layers, layers, layerToggles);
  } else if (layers) {
    // Even without layerToggles, we should still handle terrainUnderWater for bathymetry layers
    updatedStyle.layers.forEach((layer: any) => {
      if (layer.id.includes('bathymetry')) {
        if (!layer.layout) {
          layer.layout = {};
        }
        const terrainUnderWaterEnabled = layers.terrainUnderWater ?? true;
        layer.layout.visibility = terrainUnderWaterEnabled ? 'visible' : 'none';
      }
    });
  }

  const roadWeightMultiplier = (layers?.roadWeight ?? 1.0) * (layers?.labels ? 0.8 : 1.0);
  const labelAdjustment = layers?.labels ? 0.7 : 1.0;

  updatedStyle.layers.forEach((layer: any) => {
    updateLayerPaint(layer, palette, layers, labelAdjustment, roadWeightMultiplier);
    updateLayerLayout(layer, layers);
  });

  // Update global light from palette if building3D config exists
  if (palette.building3D && updatedStyle.light) {
    if (palette.building3D.lightColor) {
      updatedStyle.light.color = palette.building3D.lightColor;
    }
    if (palette.building3D.lightIntensity !== undefined) {
      updatedStyle.light.intensity = palette.building3D.lightIntensity;
    }
  }

  // detailed terrain configuration
  if (layers?.volumetricTerrain) {
    updatedStyle.terrain = {
      source: 'terrain',
      exaggeration: layers.volumetricTerrainExaggeration ?? 1.5
    };
  } else {
    delete updatedStyle.terrain;
  }

  return updatedStyle;
}

function handleContourSource(style: any) {
  const contourSource = style.sources?.contours;

  // If source doesn't exist at all, filter out layers
  if (!contourSource) {
    style.layers = style.layers.filter((layer: any) =>
      layer.id !== 'contours' &&
      !layer.id.includes('contour') &&
      !layer.id.includes('bathymetry')
    );
    return;
  }

  // If source exists but URL is empty, try to regenerate it at runtime
  // This handles cases where getBaseUrl() returned empty at module load time
  if (!contourSource.url || contourSource.url === '') {
    const url = getContourTileJsonUrl();

    if (url) {
      // Set the URL if we can get it now (browser context has window.location)
      contourSource.url = url;
    } else {
      // Only filter if we're certain the key is missing
      // This should be rare if NEXT_PUBLIC_MAPTILER_KEY is set
      style.layers = style.layers.filter((layer: any) =>
        layer.id !== 'contours' &&
        !layer.id.includes('contour') &&
        !layer.id.includes('bathymetry')
      );
    }
  }
  // If URL exists (even if relative), don't filter - let MapLibre handle it
}

/**
 * Normalizes spaceports source URL to always be relative.
 * This ensures saved map styles work regardless of where they were saved or where they're being viewed.
 * Handles cases where the URL might be an absolute URL like https://www.cartoart.net/api/spaceports.
 */
function normalizeSpaceportsSource(style: any): void {
  const spaceportsSource = style.sources?.spaceports;
  if (spaceportsSource && spaceportsSource.data) {
    const url = spaceportsSource.data;
    // If it's an absolute URL containing /api/spaceports, normalize to relative
    if (typeof url === 'string' && url.includes('/api/spaceports')) {
      const originalUrl = url;
      spaceportsSource.data = '/api/spaceports';
      logger.debug(`Normalized spaceports URL from ${originalUrl} to /api/spaceports`);
    }
  }
}

function reorderLayersForWater(layers: any[]) {
  // Find indices of hillshade and water layers
  const hillshadeIndex = layers.findIndex((layer: any) => layer.id === 'hillshade' && layer.type === 'hillshade');
  const waterIndices: number[] = [];

  layers.forEach((layer: any, index: number) => {
    if (layer.id === 'water' && layer.type === 'fill') {
      waterIndices.push(index);
    }
  });

  // If hillshade exists and comes after any water layer, we need to reorder
  if (hillshadeIndex !== -1 && waterIndices.length > 0) {
    const firstWaterIndex = waterIndices[0];

    // If hillshade comes after water, move it before water
    if (hillshadeIndex > firstWaterIndex) {
      const hillshadeLayer = layers[hillshadeIndex];
      layers.splice(hillshadeIndex, 1); // Remove hillshade from its current position
      layers.splice(firstWaterIndex, 0, hillshadeLayer); // Insert it before the first water layer
    }
  }
}

function applyVisibilityToggles(
  styleLayers: any[],
  configLayers: PosterConfig['layers'],
  layerToggles: PosterStyle['layerToggles']
) {
  styleLayers.forEach((layer) => {
    // Initialize layout if it doesn't exist
    if (!layer.layout) {
      layer.layout = {};
    }

    // Special handling for bathymetry/terrain under water
    if (layer.id.includes('bathymetry')) {
      // If terrainUnderWater is disabled or undefined, hide the layer and skip further processing
      const terrainUnderWaterEnabled = configLayers.terrainUnderWater ?? true; // Default to true if undefined
      if (!terrainUnderWaterEnabled) {
        layer.layout.visibility = 'none';
        return; // Early return - don't process this layer further
      }
      // If enabled, set to visible initially (may be overridden by toggle check below)
      layer.layout.visibility = 'visible';
    }

    const toggle = layerToggles.find(t => t.layerIds.includes(layer.id));
    if (toggle) {
      const toggleValue = configLayers[toggle.id as keyof PosterConfig['layers']];
      const isVisible = Boolean(toggleValue);

      // For bathymetry layers, we already set visibility above based on terrainUnderWater
      // Only override if this is a different toggle (not terrainUnderWater) that's disabled
      if (layer.id.includes('bathymetry')) {
        // If this is the terrainUnderWater toggle itself, we've already handled it above
        // If this is a different toggle (shouldn't happen now, but handle it), respect it
        if (toggle.id !== 'terrainUnderWater' && !isVisible) {
          layer.layout.visibility = 'none';
        }
        // Otherwise, keep the visibility we set above (visible if terrainUnderWater is enabled)
      } else {
        // For non-bathymetry layers, use the toggle's visibility
        layer.layout.visibility = isVisible ? 'visible' : 'none';
      }
    } else if (!layer.id.includes('bathymetry')) {
      // For layers not in any toggle and not bathymetry, ensure visibility is set
      // (default to visible if not specified)
      if (layer.layout.visibility === undefined) {
        layer.layout.visibility = 'visible';
      }
    } else {
      // Bathymetry layer not in any toggle (shouldn't happen, but handle it)
      // If terrainUnderWater is enabled, show it; otherwise hide it
      const terrainUnderWaterEnabled = configLayers.terrainUnderWater ?? true;
      layer.layout.visibility = terrainUnderWaterEnabled ? 'visible' : 'none';
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

    // Add exaggeration from config if available, clamped between 0 and 1
    const exaggeration = Math.min(Math.max(layers?.hillshadeExaggeration ?? 0.5, 0), 1);

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
    // Always ensure water is fully opaque to hide hillshade underneath
    // When terrainUnderWater is disabled, we definitely want full opacity
    // When enabled, we can allow some transparency if the style wants it
    const terrainUnderWaterEnabled = layers?.terrainUnderWater ?? true;
    const baseOpacity = layer.paint?.['fill-opacity'] ?? 1;
    // If terrainUnderWater is disabled, force full opacity to hide hillshade
    // Otherwise, use the style's opacity (but ensure it's at least 0.95 to mostly hide hillshade)
    const waterOpacity = terrainUnderWaterEnabled
      ? Math.max(baseOpacity, 0.95) // Allow slight transparency only when underwater terrain is enabled
      : 1.0; // Full opacity when disabled to completely hide hillshade

    layer.paint = {
      ...layer.paint,
      'fill-color': palette.water,
      'fill-opacity': waterOpacity
    };
    return;
  }

  // Bathymetry Gradient / Detail
  if (id === 'bathymetry-gradient' || id.includes('bathymetry-detail')) {
    const isDark = isColorDark(palette.background);
    const depthColor = isDark ? '#FFFFFF' : '#001a33';
    layer.paint = {
      ...layer.paint,
      'line-color': depthColor,
      'line-opacity': isDark ? 0.05 : 0.1,
    };
    return;
  }

  // Disable any water outline/border/casing layers that create halos
  // This catches layers from the base tile data that we don't explicitly create
  if (type === 'line' &&
    (id.includes('water-outline') ||
      id.includes('water-border') ||
      id.includes('water-casing') ||
      (id.includes('water-line') && id !== 'waterway'))) {
    layer.paint = {
      ...layer.paint,
      'line-opacity': 0,
    };
    return;
  }

  // Parks
  if (id === 'park' && type === 'fill') {
    layer.paint = { ...layer.paint, 'fill-color': palette.parks || palette.greenSpace };
    return;
  }

  // Landcover layers
  const baseGreenSpace = palette.greenSpace || palette.parks || '#90EE90';
  if (id.startsWith('landcover-') && type === 'fill') {
    let color = baseGreenSpace;
    let opacity = layer.paint?.['fill-opacity'] || 0.3;

    if (id === 'landcover-farmland') {
      // Farmland: Mix greenSpace with a warm wheat/gold color
      // #F5DEB3 is Wheat, #DAA520 is Goldenrod. let's range towards a warm earth tone.
      // If base is dark (e.g. night mode), we might want to keep it subtle.
      const isDark = isColorDark(palette.background);
      const earthTone = isDark ? '#8B4513' : '#F4D03F'; // SaddleBrown or Sunflower Yellow
      color = mixColor(baseGreenSpace, earthTone, 0.35); // 35% earth tone
      opacity = 0.3;
    } else if (id === 'landcover-ice') {
      // Ice: White/Blue tint
      color = '#F0F8FF'; // AliceBlue
      if (isColorDark(palette.background)) {
        color = '#1E90FF'; // DodgerBlue in dark mode
      }
      opacity = 0.45; // Reduced opacity to blend better
    } else if (id === 'landcover-wood') {
      // Wood: Deeper, darker green.
      color = darkenColor(baseGreenSpace, 0.25);
      color = saturateColor(color, 0.1);
      opacity = 0.45; // slightly higher opacity for density
    } else if (id === 'landcover-grass') {
      // Grass: Vibrant, fresh. 
      // Maybe slightly lighter/yellower than base if base is generic
      color = adjustColorHue(baseGreenSpace, 5);
      color = saturateColor(color, 0.2);
    }

    layer.paint = {
      ...layer.paint,
      'fill-color': color,
      'fill-opacity': opacity
    };
    return;
  }

  // Landuse layers
  if (id.startsWith('landuse-') && type === 'fill') {
    let color = baseGreenSpace;
    let opacity = layer.paint?.['fill-opacity'] || 0.3;

    if (id === 'landuse-forest') {
      // Forest: similar to Wood but maybe even denser
      color = darkenColor(baseGreenSpace, 0.3);
      color = saturateColor(color, 0.1);
      opacity = 0.5;
    } else if (id === 'landuse-orchard') {
      // Orchard: organized vegetation, maybe olive tone
      color = mixColor(baseGreenSpace, '#808000', 0.4); // Mix with Olive
    } else if (id === 'landuse-vineyard') {
      // Vineyard: similar to orchard but maybe more purple/red tint? 
      // actually usually just green, but let's go with a warm green.
      color = mixColor(baseGreenSpace, '#9ACD32', 0.3); // YellowGreen
    } else if (id === 'landuse-cemetery') {
      // Cemetery: Muted, respectful green
      color = desaturateColor(baseGreenSpace, 0.4);
      color = darkenColor(color, 0.1);
    } else if (id === 'landuse-grass') {
      // Grass (landuse): Match landcover-grass vibrancy
      color = adjustColorHue(baseGreenSpace, 5);
      color = saturateColor(color, 0.2);
    }

    layer.paint = {
      ...layer.paint,
      'fill-color': color,
      'fill-opacity': opacity
    };
    return;
  }

  // Contours
  if (id.includes('contour') || id.includes('topo')) {
    if (type === 'line') {
      const color = id.includes('index')
        ? (palette.contourIndex || palette.contour || palette.secondary || palette.roads?.secondary || palette.text)
        : (palette.contour || palette.secondary || palette.roads?.secondary || palette.text);

      layer.paint = {
        ...layer.paint,
        'line-color': color,
        'line-opacity': layer.paint?.['line-opacity'] ?? 0.4,
      };
    } else if (type === 'symbol' && id.includes('label')) {
      // Contour labels - update text color and halo
      const textColor = palette.contourIndex || palette.text || palette.secondary;
      const haloColor = palette.background;

      layer.paint = {
        ...layer.paint,
        'text-color': textColor,
        'text-halo-color': haloColor,
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
      'fill-color': palette.population || palette.accent || palette.primary || palette.roads?.motorway || palette.text,
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
    if (id === 'buildings-3d' && type === 'fill-extrusion') {
      const b3d = palette.building3D;
      const heightScale = layers?.buildings3DHeightScale ?? 1.0;
      const defaultHeight = layers?.buildings3DDefaultHeight ?? 6;

      if (b3d) {
        layer.paint = {
          ...layer.paint,
          'fill-extrusion-color': [
            'interpolate',
            ['linear'],
            ['coalesce', ['get', 'render_height'], defaultHeight],
            0, b3d.colorLow,
            30, b3d.colorMid,
            100, b3d.colorHigh,
          ],
          'fill-extrusion-opacity': b3d.opacity,
          'fill-extrusion-height': [
            'interpolate',
            ['linear'],
            ['zoom'],
            layer.minzoom || 8, 0,
            (layer.minzoom || 8) + 0.5, ['*', heightScale, ['coalesce', ['get', 'render_height'], defaultHeight]],
          ],
        };
      } else {
        // Fallback if no 3D-specific palette exists
        layer.paint = {
          ...layer.paint,
          'fill-extrusion-color': palette.buildings || palette.primary || palette.text,
          'fill-extrusion-opacity': 1.0,
          'fill-extrusion-height': [
            'interpolate',
            ['linear'],
            ['zoom'],
            layer.minzoom || 8, 0,
            (layer.minzoom || 8) + 0.5, ['*', heightScale, ['coalesce', ['get', 'render_height'], defaultHeight]],
          ],
        };
      }
      return;
    }

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

  // Boundaries
  if (id.startsWith('boundaries-')) {
    layer.paint = {
      ...layer.paint,
      'line-color': palette.border || palette.text,
    };
    return;
  }

  // Labels
  if (id.includes('label') && type === 'symbol') {
    // Determine label type and set appropriate halo settings for fade-out effect
    let haloWidth: number;
    let haloBlur: number;

    if (id === 'labels-country') {
      // Country labels: largest halos for maximum legibility
      haloWidth = 3.5;
      haloBlur = 2.5;
    } else if (id === 'labels-state') {
      // State labels: medium halos
      haloWidth = 2.75;
      haloBlur = 1.75;
    } else if (id === 'labels-city') {
      // City labels: smaller halos
      haloWidth = 2.25;
      haloBlur = 1.25;
    } else {
      // Unknown label type: use city label defaults as fallback
      haloWidth = 2.25;
      haloBlur = 1.25;
    }

    // Preserve existing text-opacity if set, otherwise default to 0.9
    const textOpacity = layer.paint?.['text-opacity'] ?? 0.9;

    layer.paint = {
      ...layer.paint,
      'text-color': palette.text,
      'text-halo-color': palette.background,
      'text-halo-width': haloWidth,
      'text-halo-blur': haloBlur,
      'text-opacity': textOpacity,
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
  if (!density || layer['source-layer'] !== 'contour') {
    return;
  }

  // MapTiler contours uses 'height' property (not 'ele' or 'elevation')
  const hasEle = ['has', 'height'];
  const getEle = ['get', 'height'];

  // Zoom-aware filters: At low zoom, show whatever data is available
  // At high zoom (13+), use user's density setting for fine control

  if (layer.id.includes('label')) {
    // Labels: Zoom-adaptive intervals
    layer.filter = [
      'all',
      hasEle,
      ['>', getEle, 0],
      [
        'any',
        // High zoom: user's 5x density (e.g., 50m if density=10m)
        [
          'all',
          ['>=', ['zoom'], 13],
          ['==', ['%', getEle, density * 5], 0]
        ],
        // Medium zoom: 500m intervals
        [
          'all',
          ['<', ['zoom'], 13],
          ['>=', ['zoom'], 11],
          ['==', ['%', getEle, 500], 0]
        ],
        // Low zoom: 1000m intervals
        [
          'all',
          ['<', ['zoom'], 11],
          ['==', ['%', getEle, 1000], 0]
        ]
      ]
    ];
  } else if (layer.id.includes('index')) {
    // Index contours: Zoom-adaptive major intervals
    layer.filter = [
      'all',
      hasEle,
      ['>', getEle, 0],
      [
        'any',
        // High zoom (13+): user's 5x density (e.g., 50m if density=10m)
        [
          'all',
          ['>=', ['zoom'], 13],
          ['==', ['%', getEle, density * 5], 0]
        ],
        // Medium zoom (11-13): 500m intervals
        [
          'all',
          ['<', ['zoom'], 13],
          ['>=', ['zoom'], 11],
          ['==', ['%', getEle, 500], 0]
        ],
        // Low zoom (<11): 1000m intervals
        [
          'all',
          ['<', ['zoom'], 11],
          ['==', ['%', getEle, 1000], 0]
        ]
      ]
    ];
  } else if (layer.id.includes('regular')) {
    // Regular contours: Zoom-adaptive intermediate intervals
    layer.filter = [
      'all',
      hasEle,
      ['>', getEle, 0],
      [
        'any',
        // High zoom (13+): user's density, excluding index intervals
        [
          'all',
          ['>=', ['zoom'], 13],
          ['==', ['%', getEle, density], 0],
          ['!=', ['%', getEle, density * 5], 0]
        ],
        // Medium zoom (11-13): show all non-500m intervals (200m, 300m, 400m, 600m, etc.)
        [
          'all',
          ['<', ['zoom'], 13],
          ['>=', ['zoom'], 11],
          ['!=', ['%', getEle, 500], 0]
        ],
        // Low zoom (<11): show 200m intervals (excluding 1000m)
        [
          'all',
          ['<', ['zoom'], 11],
          ['==', ['%', getEle, 200], 0],
          ['!=', ['%', getEle, 1000], 0]
        ]
      ]
    ];
  } else {
    // Simple contours: Just user's density
    layer.filter = [
      'all',
      hasEle,
      ['==', ['%', getEle, density], 0]
    ];
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
    const roadColor = palette.roads ? (palette.roads as any)[matchedClass] : null;
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
      'line-color': palette.roads?.motorway || palette.primary || palette.text,
      'line-opacity': (layer.paint?.['line-opacity'] ?? 0.4) * labelAdjustment,
    };
    return;
  }

  // Fallback for any other line layers starting with 'road-'
  const isSecondary = ['road-street', 'road-residential', 'road-tertiary', 'road-service'].includes(layer.id);
  const fallbackColor = isSecondary
    ? (palette.secondary || palette.roads?.secondary)
    : (palette.primary || palette.roads?.primary);

  layer.paint = {
    ...layer.paint,
    'line-color': fallbackColor,
    'line-opacity': (layer.paint?.['line-opacity'] ?? (isSecondary ? 0.8 : 1.0)) * labelAdjustment,
  };
}

function updateLayerLayout(layer: any, layers: PosterConfig['layers'] | undefined) {
  const { type, id } = layer;

  if (type === 'symbol') {
    // Don't override spaceport label settings - they need special collision handling
    if (id === 'spaceport-label') {
      return; // Skip this layer to preserve its custom layout settings
    }

    if (layers?.labelMaxWidth) {
      layer.layout = {
        ...layer.layout,
        'text-max-width': layers.labelMaxWidth,
      };
    }

    // Apply specific label sizes based on layer type
    let sizeMultiplier = 1.0;

    // Admin labels (country, state) - use labelAdminSize if available
    if ((id.includes('labels-country') || id.includes('labels-state')) && layers?.labelAdminSize && layers.labelAdminSize !== 1.0) {
      sizeMultiplier = layers.labelAdminSize;
    }
    // City labels - use labelCitiesSize if available
    else if (id.includes('labels-city') && layers?.labelCitiesSize && layers.labelCitiesSize !== 1.0) {
      sizeMultiplier = layers.labelCitiesSize;
    }
    // General labels - use labelSize if available and no specific size was applied
    else if (layers?.labelSize && layers.labelSize !== 1.0) {
      sizeMultiplier = layers.labelSize;
    }

    // Apply the size multiplier if it's not 1.0
    if (sizeMultiplier !== 1.0) {
      const existingSize = layer.layout?.['text-size'];
      if (existingSize) {
        layer.layout['text-size'] = scaleExpression(existingSize, sizeMultiplier);
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
