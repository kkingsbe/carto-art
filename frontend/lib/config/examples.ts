import { styles } from '../styles';
import type { PosterConfig } from '@/types/poster';
import { DEFAULT_CONFIG } from './defaults';

export interface PosterExample {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  config: PosterConfig;
}

const getStyle = (id: string) => styles.find(s => s.id === id) || styles[0];

export const POSTER_EXAMPLES: PosterExample[] = [
  {
    id: 'chesapeake',
    name: 'Chesapeake Bay',
    description: 'Vintage nautical style showing the vast bay network.',
    thumbnail: '/examples/chesapeke-poster-2.png',
    config: {
      ...DEFAULT_CONFIG,
      location: {
        name: 'Chesapeake Bay',
        city: 'The Chesapeke',
        subtitle: 'United States',
        center: [-76.17419096218805, 37.8593958816429] as [number, number],
        bounds: [[-76.35, 36.75], [-75.75, 37.15]] as [[number, number], [number, number]],
        zoom: 7.381973990444137,
      },
      style: getStyle('vintage'),
      palette: getStyle('vintage').palettes.find(p => p.id === 'vintage-parchment') || getStyle('vintage').defaultPalette,
      typography: {
        ...DEFAULT_CONFIG.typography,
        titleFont: 'Playfair Display',
        titleSize: 5.5,
        titleWeight: 700,
        titleLetterSpacing: 0.12,
        titleAllCaps: true,
        subtitleSize: 5.1,
        showTitle: false,
        backdropHeight: 62,
        backdropAlpha: 0.9,
      },
      format: {
        ...DEFAULT_CONFIG.format,
        aspectRatio: '2:3',
        margin: 8,
        borderStyle: 'double',
        texture: 'paper',
        textureIntensity: 18,
      },
      layers: {
        ...DEFAULT_CONFIG.layers,
        streets: true,
        water: true,
        terrain: true,
        hillshadeExaggeration: 0.8,
        contours: true,
        contourDensity: 50,
        marker: false,
      }
    }
  }
];

