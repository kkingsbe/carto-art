import type { PosterStyle, ColorPalette } from '@/types/poster';
import { buildStyle } from './styleBuilder';

const classicPalette: ColorPalette = {
  id: 'blueprint-classic',
  name: 'Classic Blueprint',
  style: 'blueprint',
  
  background: '#0A2647',
  text: '#E8F1F5',
  border: '#E8F1F5',
  
  roads: {
    motorway: '#FFFFFF',
    trunk: '#F5F8FA',
    primary: '#E8F1F5',
    secondary: '#D0E0EC',
    tertiary: '#A8C8E0',
    residential: '#88A8C8',
    service: '#6888A8',
  },
  
  water: '#072035',
  waterLine: '#1A4060',
  greenSpace: '#0A3040',
  landuse: '#0D2D52',
  buildings: '#0F3355',
  
  accent: '#E8F1F5',
  grid: '#1A3A5C',
};

const defaultPalette = classicPalette;

const architectPalette: ColorPalette = {
  id: 'blueprint-architect',
  name: 'Architect',
  style: 'blueprint',
  
  background: '#1C2833',
  text: '#D4E6F1',
  border: '#D4E6F1',
  
  roads: {
    motorway: '#E8F4FA',
    trunk: '#D4E6F1',
    primary: '#C0D8E8',
    secondary: '#AED6F1',
    tertiary: '#90C0DC',
    residential: '#70A0C0',
    service: '#5080A0',
  },
  
  water: '#141E28',
  waterLine: '#2E4053',
  greenSpace: '#1A2830',
  landuse: '#202D38',
  buildings: '#243540',
  
  accent: '#D4E6F1',
  grid: '#2E4053',
};

const cyanPalette: ColorPalette = {
  id: 'blueprint-cyan',
  name: 'Cyan Line',
  style: 'blueprint',
  
  background: '#001F3F',
  text: '#5DD4E8',
  border: '#5DD4E8',
  
  roads: {
    motorway: '#70E8F8',
    trunk: '#5DD4E8',
    primary: '#50C4D8',
    secondary: '#40B0C8',
    tertiary: '#3098B0',
    residential: '#207890',
    service: '#105868',
  },
  
  water: '#00152B',
  waterLine: '#003050',
  greenSpace: '#002030',
  landuse: '#002244',
  buildings: '#002850',
  
  accent: '#70E8F8',
  grid: '#003366',
};

const grayPalette: ColorPalette = {
  id: 'blueprint-gray',
  name: 'Technical Gray',
  style: 'blueprint',
  
  background: '#1A1E24',
  text: '#C8D0D8',
  border: '#C8D0D8',
  
  roads: {
    motorway: '#E0E8F0',
    trunk: '#C8D0D8',
    primary: '#B8C0C8',
    secondary: '#A0A8B0',
    tertiary: '#888F98',
    residential: '#686E78',
    service: '#484E58',
  },
  
  water: '#12161A',
  waterLine: '#282E34',
  greenSpace: '#181E1C',
  landuse: '#1E2228',
  buildings: '#22282E',
  
  accent: '#C8D0D8',
  grid: '#282E38',
};

const whitePalette: ColorPalette = {
  id: 'blueprint-white',
  name: 'Whiteprint',
  style: 'blueprint',
  
  background: '#F5F8FA',
  text: '#0A2647',
  border: '#0A2647',
  
  roads: {
    motorway: '#082040',
    trunk: '#0A2647',
    primary: '#0E3055',
    secondary: '#1A4068',
    tertiary: '#2E5580',
    residential: '#4A7098',
    service: '#6888B0',
  },
  
  water: '#E0EBF5',
  waterLine: '#A0C0DC',
  greenSpace: '#E8F0EC',
  landuse: '#EEF2F5',
  buildings: '#E5EBF0',
  
  accent: '#0A2647',
  grid: '#D0DCE8',
};

export const blueprintStyle: PosterStyle = buildStyle({
  id: 'blueprint',
  name: 'Blueprint / Technical',
  description: 'Architectural blueprint style with high-contrast lines on deep blue',
  defaultPalette: defaultPalette,
  palettes: [
    classicPalette, 
    architectPalette, 
    cyanPalette, 
    grayPalette, 
    whitePalette
  ],
  recommendedFonts: ['JetBrains Mono', 'IBM Plex Mono', 'Space Mono', 'Roboto Mono'],
  variant: 'blueprint',
  overrides: {
    base: {
      waterOpacity: 0.7,
      parkOpacity: 0.25,
      buildingsOpacity: 0.2,
      populationOpacity: {
        stops: [[0, 0], [1, 0.1], [100, 0.25], [1000, 0.45], [10000, 0.7]],
      },
    },
    terrain: {
      hillshadeShadowColor: '#061322',
      hillshadeHighlightColor: defaultPalette.secondary,
      hillshadeAccentColor: '#061322',
      hillshadeExaggeration: 0.5,
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
        water: ['water'], // Blueprint doesn't include waterway in water toggle
      },
    },
  },
});
