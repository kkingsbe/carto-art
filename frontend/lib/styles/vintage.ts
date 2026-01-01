import type { PosterStyle, ColorPalette } from '@/types/poster';
import { buildStyle } from './styleBuilder';

const parchmentPalette: ColorPalette = {
  id: 'vintage-parchment',
  name: 'Parchment',
  style: 'vintage',
  
  background: '#F4E4C8',
  text: '#3C2F1F',
  border: '#8B7355',
  
  roads: {
    motorway: '#2A2010',
    trunk: '#3C2F1F',
    primary: '#4A3A28',
    secondary: '#5D4E37',
    tertiary: '#6E5E48',
    residential: '#907E68',
    service: '#A89880',
  },
  
  water: '#B8C5C0',
  waterLine: '#8AA0A0',
  greenSpace: '#D4D4B8',
  landuse: '#EBD9B8',
  buildings: '#E0D4BC',
  
  accent: '#8B7355',
};

const defaultPalette = parchmentPalette;

const atlasPalette: ColorPalette = {
  id: 'vintage-atlas',
  name: 'Old Atlas',
  style: 'vintage',
  
  background: '#EDE5D0',
  text: '#2F2A25',
  border: '#6B6055',
  
  roads: {
    motorway: '#1F1A15',
    trunk: '#2F2A25',
    primary: '#3F3530',
    secondary: '#4A4540',
    tertiary: '#5C5550',
    residential: '#787068',
    service: '#908880',
  },
  
  water: '#A8C0C8',
  waterLine: '#7898A0',
  greenSpace: '#B8C4A8',
  landuse: '#E2DAC8',
  buildings: '#D8D0C0',
  
  accent: '#6B6055',
};

const sepiaPalette: ColorPalette = {
  id: 'vintage-sepia',
  name: 'Sepia Deep',
  style: 'vintage',
  
  background: '#E8D8B8',
  text: '#2A1810',
  border: '#6B4423',
  
  roads: {
    motorway: '#1A0C08',
    trunk: '#2A1810',
    primary: '#3A2418',
    secondary: '#5C4030',
    tertiary: '#705040',
    residential: '#887058',
    service: '#A08870',
  },
  
  water: '#A0B0A8',
  waterLine: '#708880',
  greenSpace: '#C0C0A0',
  landuse: '#DCD0B0',
  buildings: '#D0C4A8',
  
  accent: '#6B4423',
};

const maritimePalette: ColorPalette = {
  id: 'vintage-maritime',
  name: 'Maritime',
  style: 'vintage',
  
  background: '#F0E8D8',
  text: '#1E3040',
  border: '#3A5060',
  
  roads: {
    motorway: '#142030',
    trunk: '#1E3040',
    primary: '#283848',
    secondary: '#3A4858',
    tertiary: '#4A5A68',
    residential: '#6A7A88',
    service: '#8898A0',
  },
  
  water: '#8AB0C8',
  waterLine: '#5A88A8',
  greenSpace: '#C8D0B8',
  landuse: '#E5DDD0',
  buildings: '#D8D0C0',
  
  accent: '#3A5060',
};

const fadedPalette: ColorPalette = {
  id: 'vintage-faded',
  name: 'Faded Ink',
  style: 'vintage',
  
  background: '#F5EDE0',
  text: '#4A4540',
  border: '#8A8580',
  
  roads: {
    motorway: '#3A3530',
    trunk: '#4A4540',
    primary: '#5A5550',
    secondary: '#6A6560',
    tertiary: '#7A7570',
    residential: '#9A9590',
    service: '#B0ABA8',
  },
  
  water: '#C0CCC8',
  waterLine: '#98A8A8',
  greenSpace: '#D4D8C8',
  landuse: '#EAE4D8',
  buildings: '#E0DAD0',
  
  accent: '#8A8580',
};

const colonialPalette: ColorPalette = {
  id: 'vintage-colonial',
  name: 'Colonial',
  style: 'vintage',
  
  background: '#F2E8D4',
  text: '#1A2A20',
  border: '#2A4038',
  
  roads: {
    motorway: '#0A1A10',
    trunk: '#1A2A20',
    primary: '#2A3830',
    secondary: '#3A4840',
    tertiary: '#4A5850',
    residential: '#6A7870',
    service: '#889890',
  },
  
  water: '#98B8C0',
  waterLine: '#6890A0',
  greenSpace: '#B8C8A8',
  landuse: '#E8DCCC',
  buildings: '#DCD0C0',
  
  accent: '#2A4038',
};

export const vintageStyle: PosterStyle = buildStyle({
  id: 'vintage',
  name: 'Vintage / Antique',
  description: 'Warm, nostalgic maps with aged parchment and sepia tones',
  defaultPalette: defaultPalette,
  palettes: [
    parchmentPalette, 
    atlasPalette, 
    sepiaPalette, 
    maritimePalette, 
    fadedPalette, 
    colonialPalette
  ],
  recommendedFonts: ['IM Fell English', 'Playfair Display', 'EB Garamond', 'Cormorant Garamond'],
  variant: 'vintage',
  overrides: {
    base: {
      waterOpacity: 0.7,
      waterwayOpacity: 0.8,
      parkOpacity: 0.5,
      buildingsOpacity: 0.25,
    },
    terrain: {
      hillshadeShadowColor: defaultPalette.primary,
      hillshadeHighlightColor: defaultPalette.background,
      hillshadeAccentColor: defaultPalette.primary,
      hillshadeExaggeration: 0.4,
    },
    poi: {
      // All GeoJSON features are spaceports by definition, so filter by name matching
      // Updated to use 'name' property (GeoJSON doesn't have 'class', 'name:en', or 'name:latin')
      spaceportLabelFilter: [
        'any',
        ['>=', ['index-of', ['downcase', ['get', 'name']], 'space center'], 0],
        ['>=', ['index-of', ['downcase', ['get', 'name']], 'spaceport'], 0],
        ['>=', ['index-of', ['downcase', ['get', 'name']], 'ksc'], 0],
      ],
    },
    layerToggles: {
      terrainUnderWaterLayerIds: [], // Vintage doesn't have bathymetry
    },
  },
});

