import type { PosterConfig, PosterLocation } from '@/types/poster';
import { MAP } from '@/lib/constants';
import { getDefaultStyle } from '@/lib/styles';

export const DEFAULT_LOCATION: PosterLocation = {
  name: 'San Francisco',
  city: 'San Francisco, CA',
  subtitle: 'California, USA',
  center: [-122.4194, 37.7749],
  bounds: [
    [-122.5179, 37.7038], // SW corner
    [-122.3774, 37.8324], // NE corner
  ],
  zoom: MAP.DEFAULT_ZOOM,
};

const defaultStyle = getDefaultStyle();

export const DEFAULT_CONFIG: PosterConfig = {
  location: DEFAULT_LOCATION,
  style: defaultStyle,
  palette: defaultStyle.defaultPalette,
  typography: {
    titleFont: defaultStyle.recommendedFonts[0] || 'Inter',
    titleSize: 5,
    titleWeight: 800,
    titleLetterSpacing: 0.08,
    titleAllCaps: true,
    subtitleFont: defaultStyle.recommendedFonts[0] || 'Inter',
    subtitleSize: 2.5,
    showTitle: true,
    showSubtitle: true,
    showCoordinates: true,
    position: 'bottom',
    textBackdrop: 'gradient',
    backdropHeight: 35,
    backdropAlpha: 1.0,
    backdropSharpness: 50,
    maxWidth: 80,
    offsetY: 0,
  },
  format: {
    aspectRatio: '2:3',
    orientation: 'portrait',
    margin: 5,
    borderStyle: 'none',
    maskShape: 'rectangular',
    compassRose: false,
    texture: 'none',
    textureIntensity: 20,
  },
  layers: {
    streets: true,
    buildings: false,
    water: true,
    parks: false,
    terrain: true,
    terrainUnderWater: true,
    hillshadeExaggeration: 0.5,
    contours: false,
    contourDensity: 50,
    population: false,
    pois: true, // Points of Interest (airports, monuments, etc.)
    labels: false,
    labelSize: 1,
    labelMaxWidth: 10,
    labelStyle: 'elevated',
    labelAdminSize: 1.0,
    labelCitiesSize: 1.0,
    'labels-streets': false, // Street names toggle (off by default to maintain clean aesthetic)
    boundaries: false,
    marker: true,
    markerType: 'crosshair',
    markerColor: undefined, // Default to palette primary
    roadWeight: 1.0,
    // 3D Terrain
    volumetricTerrain: false,
    volumetricTerrainExaggeration: 1.5,
    terrainMeshQuality: 'balanced',
    terrainDetailLevel: 'normal', // Tile resolution: 'normal' = 256px, 'high' = 128px (2x), 'ultra' = 64px (4x)
    // Terrain Atmosphere & Fog
    terrainFog: true,
    terrainFogColor: 'rgba(186, 210, 235, 0.5)',
    terrainFogRange: [0.5, 10],
    // Terrain Lighting
    terrainLightAzimuth: 315,    // Northwest light (classic cartographic)
    terrainLightAltitude: 45,
    terrainAmbientLight: 0.35,
    terrainDiffuseLight: 0.8,
    // Landcover layers (enabled by default)
    landcoverWood: true,
    landcoverGrass: true,
    landcoverFarmland: true,
    landcoverIce: true,
    // Landuse layers (disabled by default)
    landuseForest: false,
    landuseOrchard: false,
    landuseVineyard: false,
    landuseCemetery: false,
    landuseGrass: false,
    // Railroads
    railroads: true,
    // Graticules
    graticules: false,
    graticuleWeight: 1.0,
    graticuleLabelSize: 12,
    graticuleDensity: 10,
    showScale: true,
  },
  rendering: {
    overzoom: 1,
  },
};

