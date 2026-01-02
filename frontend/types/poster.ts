// Core type definitions for the Map Poster Generator

export interface PosterLocation {
  name: string;
  city?: string; // New: specific city/municipality field
  subtitle?: string;
  center: [number, number]; // [lng, lat]
  bounds: [[number, number], [number, number]]; // SW, NE corners
  zoom: number;
}

export interface ColorPalette {
  id: string;
  name: string;
  style: string;                    // Parent style ID
  
  // Core colors
  background: string;
  text: string;
  border: string;
  
  // Road hierarchy (7 levels)
  roads: {
    motorway: string;
    trunk: string;
    primary: string;
    secondary: string;
    tertiary: string;
    residential: string;
    service: string;
  };
  
  // Land features
  water: string;
  waterLine: string;                // Rivers, streams
  greenSpace: string;
  landuse: string;                  // General land tint
  buildings: string;
  
  // Optional/style-specific
  accent?: string;
  contour?: string;
  contourIndex?: string;
  grid?: string;
  hillshade?: string;
  
  // Keep for backward compatibility/internal use
  primary?: string; // Main streets/features
  secondary?: string; // Minor streets/features
  population?: string; // Color for population density
  parks?: string; // Alias for greenSpace
}

export interface LayerToggle {
  id: string;
  name: string;
  layerIds: string[]; // MapLibre layer IDs this toggle affects
}

export interface PosterStyle {
  id: string;
  name: string;
  description: string;
  mapStyle: any; // MapLibre style spec (using any for now as the spec is complex)
  defaultPalette: ColorPalette;
  palettes: ColorPalette[];
  recommendedFonts: string[];
  layerToggles: LayerToggle[];
}

export interface PosterConfig {
  location: PosterLocation;
  style: PosterStyle;
  palette: ColorPalette;
  typography: {
    titleFont: string;
    titleSize: number;
    titleWeight: number;
    titleLetterSpacing?: number; // Added tracking
    titleAllCaps?: boolean;      // Added all-caps support
    subtitleFont: string;
    subtitleSize: number;
    showTitle?: boolean;      // New: toggle title visibility
    showSubtitle?: boolean;   // New: toggle subtitle visibility
    showCoordinates?: boolean; // New: toggle coordinates visibility
    position: 'top' | 'bottom' | 'center';
    textBackdrop?: 'none' | 'subtle' | 'strong' | 'gradient'; // Added gradient type
    backdropHeight?: number; // percentage (0-100)
    backdropAlpha?: number;  // opacity (0-1)
    backdropSharpness?: number; // New: 0-100 (soft to abrupt)
    maxWidth?: number; // New: max width percentage (0-100)
  };
  format: {
    aspectRatio: '2:3' | '3:4' | '4:5' | '1:1' | 'ISO';
    orientation: 'portrait' | 'landscape';
    margin: number; // 0-100 (percentage based)
    borderStyle: 'none' | 'thin' | 'thick' | 'double' | 'inset';
    maskShape?: 'rectangular' | 'circular';
    compassRose?: boolean; // Show compass rose around circular mask
    texture?: 'none' | 'paper' | 'canvas' | 'grain'; // Added texture support
    textureIntensity?: number; // 0-100
  };
  layers: {
    streets: boolean;
    buildings: boolean;
    water: boolean;
    parks: boolean;
    terrain: boolean;
    terrainUnderWater: boolean; // New: toggle bathymetry/terrain under water
    hillshadeExaggeration: number; // New: control hillshade intensity
    contours: boolean;
    contourDensity: number; // New: control contour line density (interval)
    population: boolean;
    pois?: boolean; // Toggle for points of interest (airports, monuments, etc.)
    labels: boolean;
    labelSize: number; // New: control map label size
    labelMaxWidth: number; // New: control map label wrap width
    labelStyle?: 'standard' | 'elevated' | 'glass' | 'vintage'; // New: control map label visual style
    'labels-admin'?: boolean; // Toggle for state & country names
    labelAdminSize?: number; // Size for state & country names
    'labels-cities'?: boolean; // Toggle for city names
    labelCitiesSize?: number; // Size for city names
    boundaries?: boolean; // Toggle for administrative boundaries (country/state/county)
    marker: boolean;
    markerType?: 'pin' | 'crosshair' | 'dot' | 'ring' | 'heart' | 'home';
    markerColor?: string;
    roadWeight: number; // New: control road line thickness
    // Landcover layers (from 'landcover' source-layer)
    landcoverWood?: boolean;
    landcoverGrass?: boolean;
    landcoverFarmland?: boolean;
    landcoverIce?: boolean;
    // Landuse layers (from 'landuse' source-layer)
    landuseForest?: boolean;
    landuseOrchard?: boolean;
    landuseVineyard?: boolean;
    landuseCemetery?: boolean;
    landuseGrass?: boolean;
  };
}

export interface SavedProject {
  id: string;
  name: string;
  config: PosterConfig;
  updatedAt: number;
}

