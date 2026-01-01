import type { PosterStyle, ColorPalette } from '@/types/poster';
import { buildStyle } from './styleBuilder';
import { extraMinimalPalettes } from './extra-palettes';

const inkPalette: ColorPalette = {
  id: 'minimal-ink',
  name: 'Ink & Paper',
  style: 'minimal',
  
  background: '#F7F5F0',
  text: '#2C2C2C',
  border: '#2C2C2C',
  
  roads: {
    motorway: '#1A1A1A',
    trunk: '#252525',
    primary: '#2C2C2C',
    secondary: '#3D3D3D',
    tertiary: '#5C5C5C',
    residential: '#6E6E6E',
    service: '#8A8A8A',
  },
  
  water: '#E0E7ED',
  waterLine: '#C8D4DC',
  greenSpace: '#EDEEE8',
  landuse: '#F0EDE6',
  buildings: '#EBE8E2',
  
  accent: '#2C2C2C',
};

const defaultPalette = inkPalette;

const charcoalPalette: ColorPalette = {
  id: 'minimal-charcoal',
  name: 'Charcoal',
  style: 'minimal',
  
  background: '#F5F5F0',
  text: '#2D2D2D',
  border: '#2D2D2D',
  
  roads: {
    motorway: '#1F1F1F',
    trunk: '#2D2D2D',
    primary: '#3A3A3A',
    secondary: '#4D4D4D',
    tertiary: '#666666',
    residential: '#7A7A7A',
    service: '#909090',
  },
  
  water: '#B8C5D0',
  waterLine: '#A0B0BC',
  greenSpace: '#C5CBBA',
  landuse: '#ECEBE5',
  buildings: '#E5E4DE',
  
  accent: '#2D2D2D',
};

const navyPalette: ColorPalette = {
  id: 'minimal-navy',
  name: 'Navy & Cream',
  style: 'minimal',
  
  background: '#FDF6E3',
  text: '#1E3A5F',
  border: '#1E3A5F',
  
  roads: {
    motorway: '#0F2840',
    trunk: '#1A3350',
    primary: '#1E3A5F',
    secondary: '#2E4A6F',
    tertiary: '#3E5C81',
    residential: '#5070A0',
    service: '#6888B0',
  },
  
  water: '#D4E4F0',
  waterLine: '#B8D0E4',
  greenSpace: '#E4EAD8',
  landuse: '#F5EED8',
  buildings: '#EFE8D8',
  
  accent: '#1E3A5F',
};

const warmGrayPalette: ColorPalette = {
  id: 'minimal-warm',
  name: 'Warm Gray',
  style: 'minimal',
  
  background: '#FAF8F5',
  text: '#4A4A4A',
  border: '#4A4A4A',
  
  roads: {
    motorway: '#3A3A3A',
    trunk: '#454545',
    primary: '#4A4A4A',
    secondary: '#5A5A5A',
    tertiary: '#707070',
    residential: '#888888',
    service: '#A0A0A0',
  },
  
  water: '#D8E4EC',
  waterLine: '#C0D0DC',
  greenSpace: '#E4E8DC',
  landuse: '#F2F0EB',
  buildings: '#EBE9E4',
  
  accent: '#4A4A4A',
};

const blushPalette: ColorPalette = {
  id: 'minimal-blush',
  name: 'Blush',
  style: 'minimal',
  
  background: '#F8F4F1',
  text: '#4A3F3F',
  border: '#4A3F3F',
  
  roads: {
    motorway: '#4A3F3F',
    trunk: '#5A4D4D',
    primary: '#6B5B5B',
    secondary: '#7A6A6A',
    tertiary: '#8B7E7E',
    residential: '#A09090',
    service: '#B8A8A8',
  },
  
  water: '#D4E4ED',
  waterLine: '#B8D0E0',
  greenSpace: '#E2E8DC',
  landuse: '#F2EEEA',
  buildings: '#ECE8E4',
  
  accent: '#6B5B5B',
};

const sagePalette: ColorPalette = {
  id: 'minimal-sage',
  name: 'Sage',
  style: 'minimal',
  
  background: '#F5F5F0',
  text: '#3D4A3D',
  border: '#3D4A3D',
  
  roads: {
    motorway: '#2D3A2D',
    trunk: '#374437',
    primary: '#3D4A3D',
    secondary: '#4D5A4D',
    tertiary: '#5D6A5D',
    residential: '#6D7A6D',
    service: '#8A9A8A',
  },
  
  water: '#C8D8E0',
  waterLine: '#A8C0CC',
  greenSpace: '#D8E0D0',
  landuse: '#ECEEE8',
  buildings: '#E5E8E2',
  
  accent: '#3D4A3D',
};

const copperPalette: ColorPalette = {
  id: 'minimal-copper',
  name: 'Copper',
  style: 'minimal',
  
  background: '#FAF6F2',
  text: '#6B4423',
  border: '#6B4423',
  
  roads: {
    motorway: '#5A3818',
    trunk: '#634020',
    primary: '#6B4423',
    secondary: '#7A5533',
    tertiary: '#8B6644',
    residential: '#A07850',
    service: '#B89070',
  },
  
  water: '#D0E0E8',
  waterLine: '#B0CCD8',
  greenSpace: '#E0E4D8',
  landuse: '#F2EEE8',
  buildings: '#ECE8E2',
  
  accent: '#8B5A30',
};

export const minimalStyle: PosterStyle = buildStyle({
  id: 'minimal',
  name: 'Minimal Line Art',
  description: 'Clean, monochromatic street maps with minimal detail',
  defaultPalette: defaultPalette,
  palettes: [
    inkPalette, 
    charcoalPalette, 
    navyPalette, 
    warmGrayPalette, 
    blushPalette, 
    sagePalette, 
    copperPalette,
    ...extraMinimalPalettes
  ],
  recommendedFonts: ['Inter', 'Helvetica Neue', 'Outfit', 'DM Sans'],
  variant: 'minimal',
  overrides: {
    base: {
      waterFilter: ['all', ['!=', ['get', 'class'], 'pier'], ['!=', ['get', 'brunnel'], 'bridge']],
    },
    terrain: {
      hillshadeShadowColor: defaultPalette.roads.secondary,
      hillshadeHighlightColor: defaultPalette.background,
      hillshadeAccentColor: defaultPalette.roads.secondary,
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
      customLayerIds: {
        streets: [
          'road-service', 
          'road-residential', 
          'road-tertiary', 
          'road-secondary', 
          'road-primary', 
          'road-trunk', 
          'road-motorway',
          'bridge-motorway-casing',
          'bridge-motorway'
        ],
      },
    },
  },
});

