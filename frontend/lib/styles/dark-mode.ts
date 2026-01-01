import type { PosterStyle, ColorPalette } from '@/types/poster';
import { buildStyle } from './styleBuilder';

const goldPalette: ColorPalette = {
  id: 'dark-gold',
  name: 'Gold Standard',
  style: 'dark-mode',
  
  background: '#0A0A0F',
  text: '#D4AF37',
  border: '#D4AF37',
  
  roads: {
    motorway: '#E8C547',
    trunk: '#D4AF37',
    primary: '#C9A432',
    secondary: '#B89428',
    tertiary: '#9A8228',
    residential: '#7A6820',
    service: '#5A4E1A',
  },
  
  water: '#06080D',
  waterLine: '#1A1A25',
  greenSpace: '#0A0F0A',
  landuse: '#0C0C12',
  buildings: '#12121A',
  
  accent: '#E8C547',
};

const defaultPalette = goldPalette;

const silverPalette: ColorPalette = {
  id: 'dark-silver',
  name: 'Silver City',
  style: 'dark-mode',
  
  background: '#0C0C10',
  text: '#C0C0C8',
  border: '#C0C0C8',
  
  roads: {
    motorway: '#E8E8F0',
    trunk: '#D0D0D8',
    primary: '#C0C0C8',
    secondary: '#A8A8B0',
    tertiary: '#888890',
    residential: '#686870',
    service: '#484850',
  },
  
  water: '#08080C',
  waterLine: '#18181C',
  greenSpace: '#0C100C',
  landuse: '#0E0E12',
  buildings: '#141418',
  
  accent: '#E8E8F0',
};

const rosePalette: ColorPalette = {
  id: 'dark-rose',
  name: 'Rose Night',
  style: 'dark-mode',
  
  background: '#1A0F14',
  text: '#E8B4B8',
  border: '#E8B4B8',
  
  roads: {
    motorway: '#F5D0D4',
    trunk: '#E8B4B8',
    primary: '#D8A0A4',
    secondary: '#C08888',
    tertiary: '#A07070',
    residential: '#805858',
    service: '#604040',
  },
  
  water: '#0F0A10',
  waterLine: '#2A1A20',
  greenSpace: '#0F1410',
  landuse: '#1C1218',
  buildings: '#201820',
  
  accent: '#E8B4B8',
};

const neonPalette: ColorPalette = {
  id: 'dark-neon',
  name: 'Neon Noir',
  style: 'dark-mode',
  
  background: '#0B0B1A',
  text: '#FFFFFF',
  border: '#00E5FF',
  
  roads: {
    motorway: '#00F5FF',
    trunk: '#00E5EE',
    primary: '#00D4DD',
    secondary: '#00B8C0',
    tertiary: '#009099',
    residential: '#006870',
    service: '#004048',
  },
  
  water: '#050510',
  waterLine: '#0A1020',
  greenSpace: '#0A140A',
  landuse: '#0D0D1E',
  buildings: '#10102A',
  
  accent: '#00F5FF',
};

const navyPalette: ColorPalette = {
  id: 'dark-navy',
  name: 'Deep Navy',
  style: 'dark-mode',
  
  background: '#0B1929',
  text: '#F5F5F5',
  border: '#F5F5F5',
  
  roads: {
    motorway: '#FFFFFF',
    trunk: '#F0F0F0',
    primary: '#E0E0E0',
    secondary: '#C8C8C8',
    tertiary: '#A8A8A8',
    residential: '#808080',
    service: '#585858',
  },
  
  water: '#061220',
  waterLine: '#102030',
  greenSpace: '#0A1A10',
  landuse: '#0D1C2C',
  buildings: '#101F30',
  
  accent: '#F5F5F5',
};

const emberPalette: ColorPalette = {
  id: 'dark-ember',
  name: 'Ember',
  style: 'dark-mode',
  
  background: '#0F0A08',
  text: '#E85A30',
  border: '#E85A30',
  
  roads: {
    motorway: '#FF6A40',
    trunk: '#E85A30',
    primary: '#D04A28',
    secondary: '#B83A20',
    tertiary: '#982A18',
    residential: '#702010',
    service: '#481008',
  },
  
  water: '#080608',
  waterLine: '#1A1010',
  greenSpace: '#0A0A08',
  landuse: '#120C0A',
  buildings: '#181210',
  
  accent: '#FF6A40',
};

const auroraPalette: ColorPalette = {
  id: 'dark-aurora',
  name: 'Aurora',
  style: 'dark-mode',
  
  background: '#080C10',
  text: '#40E8B0',
  border: '#40E8B0',
  
  roads: {
    motorway: '#50F8C0',
    trunk: '#40E8B0',
    primary: '#30D8A0',
    secondary: '#28C090',
    tertiary: '#20A078',
    residential: '#188060',
    service: '#106048',
  },
  
  water: '#04080C',
  waterLine: '#0C1418',
  greenSpace: '#081008',
  landuse: '#0A0E12',
  buildings: '#0E1418',
  
  accent: '#50F8C0',
};

export const darkModeStyle: PosterStyle = buildStyle({
  id: 'dark-mode',
  name: 'Dark Mode / Noir',
  description: 'Dramatic dark maps with luminous street networks',
  defaultPalette: defaultPalette,
  palettes: [
    goldPalette, 
    silverPalette, 
    rosePalette, 
    neonPalette, 
    navyPalette, 
    emberPalette, 
    auroraPalette
  ],
  recommendedFonts: ['Montserrat', 'Poppins', 'Bebas Neue', 'Oswald'],
  variant: 'dark-mode',
  overrides: {
    base: {
      waterOpacity: 0.8,
      waterwayOpacity: 0.5,
      parkOpacity: 0.4,
      buildingsOpacity: 0.3,
      populationOpacity: {
        stops: [[0, 0], [1, 0.1], [100, 0.25], [1000, 0.45], [10000, 0.7]],
      },
    },
    terrain: {
      hillshadeShadowColor: '#000000',
      hillshadeHighlightColor: defaultPalette.roads.secondary,
      hillshadeAccentColor: '#000000',
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
  },
});

