import { z } from 'zod';
import type { PosterConfig } from '@/types/poster';

/**
 * Zod schema for validating PosterConfig
 * This ensures data integrity when saving/loading map configurations
 */
export const PosterConfigSchema: z.ZodType<PosterConfig> = z.object({
  location: z.object({
    name: z.string().min(1, 'Location name is required'),
    city: z.string().optional(),
    subtitle: z.string().optional(),
    center: z.tuple([z.number(), z.number()]).describe('Center must be [lng, lat]'),
    bounds: z.tuple([
      z.tuple([z.number(), z.number()]),
      z.tuple([z.number(), z.number()])
    ]).describe('Bounds must be [[SW], [NE]]'),
    zoom: z.number().min(0).max(24),
  }),
  style: z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    description: z.string(),
    mapStyle: z.any(), // MapLibre style spec is complex, using any for now
    defaultPalette: z.any(), // Will be validated by ColorPalette if needed
    palettes: z.array(z.any()),
    recommendedFonts: z.array(z.string()),
    layerToggles: z.array(z.object({
      id: z.string(),
      name: z.string(),
      layerIds: z.array(z.string()),
    })),
  }),
  palette: z.object({
    id: z.string(),
    name: z.string(),
    style: z.string(),
    background: z.string(),
    text: z.string(),
    border: z.string(),
    roads: z.object({
      motorway: z.string(),
      trunk: z.string(),
      primary: z.string(),
      secondary: z.string(),
      tertiary: z.string(),
      residential: z.string(),
      service: z.string(),
    }),
    water: z.string(),
    waterLine: z.string(),
    greenSpace: z.string(),
    landuse: z.string(),
    buildings: z.string(),
    accent: z.string().optional(),
    contour: z.string().optional(),
    contourIndex: z.string().optional(),
    grid: z.string().optional(),
    hillshade: z.string().optional(),
    primary: z.string().optional(),
    secondary: z.string().optional(),
    population: z.string().optional(),
    parks: z.string().optional(),
  }),
  typography: z.object({
    titleFont: z.string(),
    titleSize: z.number().min(0),
    titleWeight: z.number().min(0).max(900),
    titleLetterSpacing: z.number().optional(),
    titleAllCaps: z.boolean().optional(),
    subtitleFont: z.string(),
    subtitleSize: z.number().min(0),
    showTitle: z.boolean().optional(),
    showSubtitle: z.boolean().optional(),
    showCoordinates: z.boolean().optional(),
    position: z.enum(['top', 'bottom', 'center']),
    textBackdrop: z.enum(['none', 'subtle', 'strong', 'gradient']).optional(),
    backdropHeight: z.number().min(0).max(100).optional(),
    backdropAlpha: z.number().min(0).max(1).optional(),
    backdropSharpness: z.number().min(0).max(100).optional(),
    maxWidth: z.number().min(0).max(100).optional(),
  }),
  format: z.object({
    aspectRatio: z.enum(['2:3', '3:4', '4:5', '1:1', 'ISO']),
    orientation: z.enum(['portrait', 'landscape']),
    margin: z.number().min(0).max(100),
    borderStyle: z.enum(['none', 'thin', 'thick', 'double', 'inset']),
    maskShape: z.enum(['rectangular', 'circular']).optional(),
    compassRose: z.boolean().optional(),
    texture: z.enum(['none', 'paper', 'canvas', 'grain']).optional(),
    textureIntensity: z.number().min(0).max(100).optional(),
  }),
  layers: z.object({
    streets: z.boolean(),
    buildings: z.boolean(),
    water: z.boolean(),
    parks: z.boolean(),
    terrain: z.boolean(),
    terrainUnderWater: z.boolean(),
    hillshadeExaggeration: z.number(),
    contours: z.boolean(),
    contourDensity: z.number(),
    population: z.boolean(),
    pois: z.boolean().optional(),
    labels: z.boolean(),
    labelSize: z.number(),
    labelMaxWidth: z.number(),
    labelStyle: z.enum(['standard', 'elevated', 'glass', 'vintage']).optional(),
    'labels-admin': z.boolean().optional(),
    'labels-cities': z.boolean().optional(),
    boundaries: z.boolean().optional(),
    marker: z.boolean(),
    markerType: z.enum(['pin', 'crosshair', 'dot', 'ring', 'heart', 'home']).optional(),
    markerColor: z.string().optional(),
    roadWeight: z.number(),
  }),
});

/**
 * Validate a PosterConfig object
 * @throws {z.ZodError} if validation fails
 */
export function validatePosterConfig(config: unknown): PosterConfig {
  return PosterConfigSchema.parse(config);
}

/**
 * Safely validate a PosterConfig, returning a result object
 */
export function safeValidatePosterConfig(config: unknown): {
  success: boolean;
  data?: PosterConfig;
  error?: z.ZodError;
} {
  const result = PosterConfigSchema.safeParse(config);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}

