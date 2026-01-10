/**
 * Style variant configurations that define the visual characteristics
 * of each map style. These are used by the style builder to generate
 * consistent layer definitions across styles.
 */

export interface StyleVariantConfig {
  roadStyle: 'round' | 'square' | 'miter';
  roadOptions: {
    lineCap: 'round' | 'square';
    lineJoin: 'round' | 'miter';
    includeGlow?: boolean;
    includeBridges?: boolean;
  };
  labelStyle: 'halo' | 'none' | 'strong' | 'standard' | 'elevated' | 'glass' | 'vintage';
  includeSpaceports: boolean;
  terrainOptions?: {
    includeVolumetricBathymetry?: boolean;
    hillshadeExaggeration?: number;
  };
}

export const styleVariants: Record<string, StyleVariantConfig> = {
  minimal: {
    roadStyle: 'round',
    roadOptions: { lineCap: 'round', lineJoin: 'round', includeGlow: false, includeBridges: true },
    labelStyle: 'halo',
    includeSpaceports: true,
  },
  'dark-mode': {
    roadStyle: 'round',
    roadOptions: { lineCap: 'round', lineJoin: 'round', includeGlow: true },
    labelStyle: 'halo',
    includeSpaceports: true,
  },
  vintage: {
    roadStyle: 'round',
    roadOptions: { lineCap: 'round', lineJoin: 'round', includeGlow: false },
    labelStyle: 'halo',
    includeSpaceports: true,
  },
  blueprint: {
    roadStyle: 'square',
    roadOptions: { lineCap: 'square', lineJoin: 'miter', includeGlow: false },
    labelStyle: 'none',
    includeSpaceports: true,
  },
  topographic: {
    roadStyle: 'round',
    roadOptions: { lineCap: 'round', lineJoin: 'round', includeGlow: false },
    labelStyle: 'halo',
    includeSpaceports: true,
    terrainOptions: { includeVolumetricBathymetry: true, hillshadeExaggeration: 0.15 },
  },
  watercolor: {
    roadStyle: 'round',
    roadOptions: { lineCap: 'round', lineJoin: 'round', includeGlow: false },
    labelStyle: 'halo',
    includeSpaceports: true,
  },
  midnight: {
    roadStyle: 'round',
    roadOptions: { lineCap: 'round', lineJoin: 'round', includeGlow: false },
    labelStyle: 'halo',
    includeSpaceports: true,
  },
  abstract: {
    roadStyle: 'round',
    roadOptions: { lineCap: 'round', lineJoin: 'round', includeGlow: false },
    labelStyle: 'strong',
    includeSpaceports: true,
  },
  atmospheric: {
    roadStyle: 'round',
    roadOptions: { lineCap: 'round', lineJoin: 'round', includeGlow: false },
    labelStyle: 'halo',
    includeSpaceports: true,
  },
  organic: {
    roadStyle: 'round',
    roadOptions: { lineCap: 'round', lineJoin: 'round', includeGlow: false },
    labelStyle: 'halo',
    includeSpaceports: false,
  },
  retro: {
    roadStyle: 'round',
    roadOptions: { lineCap: 'round', lineJoin: 'round', includeGlow: false },
    labelStyle: 'halo',
    includeSpaceports: false,
  },
};

