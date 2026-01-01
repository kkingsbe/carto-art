import type { PosterStyle, ColorPalette } from '@/types/poster';
import { buildStyle } from './styleBuilder';

const surveyPalette: ColorPalette = {
  id: 'topo-survey',
  name: 'Survey',
  style: 'topographic',
  
  background: '#F5F2E8',
  text: '#3C3020',
  border: '#5C4830',
  
  roads: {
    motorway: '#4A3020',
    trunk: '#5C4830',
    primary: '#6E5840',
    secondary: '#806848',
    tertiary: '#9A8060',
    residential: '#B89870',
    service: '#C8A880',
  },
  
  water: '#B8D4E8',
  waterLine: '#7BA3C4',
  greenSpace: '#D8E4D0',
  landuse: '#EBE8DE',
  buildings: '#E0DCD0',
  
  accent: '#5C4830',
  contour: '#B8A080',
  contourIndex: '#8B7355',
  hillshade: '#00000020',
};

const defaultPalette = surveyPalette;

const usgsPalette: ColorPalette = {
  id: 'topo-usgs',
  name: 'USGS Classic',
  style: 'topographic',
  
  background: '#F8F4E8',
  text: '#2A1810',
  border: '#4A3020',
  
  roads: {
    motorway: '#3A2010',
    trunk: '#4A3020',
    primary: '#5C4030',
    secondary: '#705040',
    tertiary: '#886858',
    residential: '#A08070',
    service: '#B89888',
  },
  
  water: '#8BC4E8',
  waterLine: '#4A98C8',
  greenSpace: '#B8D890',
  landuse: '#F0ECDC',
  buildings: '#E8E0D0',
  
  accent: '#4A3020',
  contour: '#B89070',
  contourIndex: '#8B6040',
  hillshade: '#00000018',
};

const nightPalette: ColorPalette = {
  id: 'topo-night',
  name: 'Terrain Night',
  style: 'topographic',
  
  background: '#1A1A2E',
  text: '#B8C5D0',
  border: '#6BB8C8',
  
  roads: {
    motorway: '#8AD0E0',
    trunk: '#6BB8C8',
    primary: '#58A0B0',
    secondary: '#4A8898',
    tertiary: '#3A7080',
    residential: '#2A5868',
    service: '#1A4050',
  },
  
  water: '#0F2040',
  waterLine: '#2A4060',
  greenSpace: '#1A2A1A',
  landuse: '#1C1C30',
  buildings: '#202040',
  
  accent: '#6BB8C8',
  contour: '#4A90A4',
  contourIndex: '#6BB8C8',
  hillshade: '#FFFFFF10',
};

const earthPalette: ColorPalette = {
  id: 'topo-earth',
  name: 'Earth Tone',
  style: 'topographic',
  
  background: '#F0E8D8',
  text: '#3A3028',
  border: '#5A4838',
  
  roads: {
    motorway: '#2A2018',
    trunk: '#3A3028',
    primary: '#4A4038',
    secondary: '#5A5048',
    tertiary: '#706860',
    residential: '#908878',
    service: '#A8A090',
  },
  
  water: '#88B8C8',
  waterLine: '#5898B0',
  greenSpace: '#B8C8A0',
  landuse: '#E8E0D0',
  buildings: '#DCD4C4',
  
  accent: '#5A4838',
  contour: '#A09078',
  contourIndex: '#786850',
  hillshade: '#00000015',
};

const monoPalette: ColorPalette = {
  id: 'topo-mono',
  name: 'Monochrome Relief',
  style: 'topographic',
  
  background: '#F0F0EC',
  text: '#2A2A28',
  border: '#4A4A48',
  
  roads: {
    motorway: '#1A1A18',
    trunk: '#2A2A28',
    primary: '#3A3A38',
    secondary: '#4A4A48',
    tertiary: '#5A5A58',
    residential: '#7A7A78',
    service: '#9A9A98',
  },
  
  water: '#C8D0D8',
  waterLine: '#98A8B0',
  greenSpace: '#D8DCD0',
  landuse: '#E8E8E4',
  buildings: '#DCDCD8',
  
  accent: '#4A4A48',
  contour: '#8A8A88',
  contourIndex: '#5A5A58',
  hillshade: '#00000012',
};

export const topographicStyle: PosterStyle = buildStyle({
  id: 'topographic',
  name: 'Topographic / Contour',
  description: 'Terrain-focused maps with detailed elevation contours and hillshading',
  defaultPalette: defaultPalette,
  palettes: [
    surveyPalette, 
    usgsPalette, 
    nightPalette, 
    earthPalette, 
    monoPalette
  ],
  recommendedFonts: ['Spectral', 'Merriweather', 'Lora', 'Noto Serif'],
  variant: 'topographic',
  overrides: {
    base: {
      waterOpacity: 1.0,
      parkOpacity: 0.4,
      buildingsOpacity: 0.2,
      populationOpacity: {
        stops: [[0, 0], [1, 0.05], [100, 0.15], [1000, 0.3], [10000, 0.5]],
      },
    },
    terrain: {
      hillshadeExaggeration: 0.15,
      hillshadeShadowColor: '#000000',
      hillshadeHighlightColor: '#FFFFFF',
      hillshadeAccentColor: '#000000',
      contourLineWidth: 0.5,
      contourLineOpacity: 0.4,
      contourIndexLineWidth: 0.8,
      contourIndexLineOpacity: 0.65,
      contourLabelMinZoom: 11,
    },
    labels: {
      countryTextSize: [2, 10, 6, 16],
      stateTextSize: [3, 9, 8, 14],
      cityTextSize: [4, 8, 12, 12],
      countryTextHaloWidth: 2.5,
      countryTextHaloBlur: 1.0,
      stateTextHaloWidth: 2.5,
      stateTextHaloBlur: 1.0,
      cityTextHaloWidth: 1.5,
      cityTextHaloBlur: 0.5,
    },
    poi: {
      aerodromeLabelTextField: ['concat', '✈ ', ['coalesce', ['get', 'name:en'], ['get', 'name:latin'], ['get', 'name']]],
      // All GeoJSON features are spaceports by definition, so filter by name matching
      // Updated to use 'name' property (GeoJSON doesn't have 'class', 'name:en', or 'name:latin')
      spaceportLabelFilter: [
        'any',
        ['>=', ['index-of', ['downcase', ['get', 'name']], 'space center'], 0],
        ['>=', ['index-of', ['downcase', ['get', 'name']], 'spaceport'], 0],
        ['>=', ['index-of', ['downcase', ['get', 'name']], 'ksc'], 0],
      ],
      spaceportLabelTextField: ['concat', '🚀 ', ['coalesce', ['get', 'name:en'], ['get', 'name:latin'], ['get', 'name']]],
    },
    layerToggles: {
      customLayerIds: {
        terrainUnderWater: ['bathymetry-volumetric-10', 'bathymetry-volumetric-50', 'bathymetry-volumetric-200', 'bathymetry-volumetric-1000', 'bathymetry-volumetric-3000', 'bathymetry-volumetric-5000'],
        contours: ['contours-regular', 'contours-index', 'contours-labels'],
      },
    },
  },
});
