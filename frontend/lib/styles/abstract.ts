import type { PosterStyle, ColorPalette } from '@/types/poster';
import { buildStyle } from './styleBuilder';
import { extraAbstractPalettes } from './extra-palettes';

const blocksPalette: ColorPalette = {
  id: 'abstract-blocks',
  name: 'Color Block',
  style: 'abstract',
  
  background: '#F5F5F0',
  text: '#1A1A1A',
  border: '#1A1A1A',
  
  roads: {
    motorway: '#1A1A1A',
    trunk: '#2A2A2A',
    primary: '#3A3A3A',
    secondary: '#4A4A4A',
    tertiary: '#5A5A5A',
    residential: '#7A7A7A',
    service: '#9A9A9A',
  },
  
  water: '#5090C0',
  waterLine: '#3070A0',
  greenSpace: '#70A870',
  landuse: '#E8E8E0',
  buildings: '#D8A870',
  
  accent: '#E85050',
};

const pastelPalette: ColorPalette = {
  id: 'abstract-pastel',
  name: 'Pastel Dream',
  style: 'abstract',
  
  background: '#FAF8F5',
  text: '#5A5A60',
  border: '#5A5A60',
  
  roads: {
    motorway: '#5A5A60',
    trunk: '#6A6A70',
    primary: '#7A7A80',
    secondary: '#8A8A90',
    tertiary: '#9A9AA0',
    residential: '#B0B0B8',
    service: '#C8C8D0',
  },
  
  water: '#A8C8E0',
  waterLine: '#88B0D0',
  greenSpace: '#B8D8B8',
  landuse: '#F2F0EC',
  buildings: '#E8D0D8',
  
  accent: '#D8A8B8',
};

const neonPalette: ColorPalette = {
  id: 'abstract-neon',
  name: 'Neon Pop',
  style: 'abstract',
  
  background: '#0A0A0A',
  text: '#FFFFFF',
  border: '#FF00FF',
  
  roads: {
    motorway: '#FFFFFF',
    trunk: '#FF00FF',
    primary: '#00FFFF',
    secondary: '#FFFF00',
    tertiary: '#FF8800',
    residential: '#8800FF',
    service: '#0088FF',
  },
  
  water: '#0040A0',
  waterLine: '#0060C0',
  greenSpace: '#00A040',
  landuse: '#101010',
  buildings: '#181818',
  
  accent: '#FF00FF',
};

const earthPalette: ColorPalette = {
  id: 'abstract-earth',
  name: 'Muted Earth',
  style: 'abstract',
  
  background: '#F0EBE0',
  text: '#3A3530',
  border: '#3A3530',
  
  roads: {
    motorway: '#3A3530',
    trunk: '#4A4540',
    primary: '#5A5550',
    secondary: '#6A6560',
    tertiary: '#7A7570',
    residential: '#9A9590',
    service: '#B0ABA8',
  },
  
  water: '#7898A0',
  waterLine: '#5878A0',
  greenSpace: '#8A9878',
  landuse: '#E5E0D5',
  buildings: '#C8A888',
  
  accent: '#A87850',
};

const defaultPalette = blocksPalette;

export const abstractStyle: PosterStyle = buildStyle({
  id: 'abstract',
  name: 'Abstract / Artistic',
  description: 'Bold, geometric interpretations of urban layouts with vibrant color blocking',
  defaultPalette: defaultPalette,
  palettes: [
    blocksPalette, 
    pastelPalette, 
    neonPalette, 
    earthPalette,
    ...extraAbstractPalettes
  ],
  recommendedFonts: ['Outfit', 'Space Grotesk', 'Syne', 'Unbounded'],
  variant: 'abstract',
  overrides: {
    base: {
      waterOpacity: 1.0,
      parkOpacity: 0.8,
      buildingsOpacity: 0.6,
      populationOpacity: {
        stops: [[0, 0], [1, 0.1], [100, 0.3], [1000, 0.5], [10000, 0.7]],
      },
    },
    terrain: {
      hillshadeExaggeration: 0.3,
      hillshadeShadowColor: '#000000',
      hillshadeHighlightColor: '#FFFFFF',
      hillshadeAccentColor: '#000000',
    },
    labels: {
      countryTextSize: [2, 14, 6, 22],
      stateTextSize: [3, 13, 8, 20],
      cityTextSize: [4, 12, 12, 19],
      countryTextHaloWidth: 3,
      countryTextHaloBlur: 1,
      stateTextHaloWidth: 3,
      stateTextHaloBlur: 1,
      cityTextHaloWidth: 2.5,
      cityTextHaloBlur: 1,
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
