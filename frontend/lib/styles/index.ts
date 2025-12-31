import type { PosterStyle } from '@/types/poster';
import { minimalStyle } from './minimal';
import { darkModeStyle } from './dark-mode';
import { blueprintStyle } from './blueprint';
import { vintageStyle } from './vintage';
import { topographicStyle } from './topographic';
import { watercolorStyle } from './watercolor';
import { midnightStyle } from './midnight';
import { abstractStyle } from './abstract';
import { atmosphericStyle } from './atmospheric';
import { organicStyle } from './organic';
import { retroStyle } from './retro';

export const styles: PosterStyle[] = [
  minimalStyle,
  darkModeStyle,
  midnightStyle,
  blueprintStyle,
  vintageStyle,
  topographicStyle,
  watercolorStyle,
  abstractStyle,
  atmosphericStyle,
  organicStyle,
  retroStyle,
];

export function getStyleById(id: string): PosterStyle | undefined {
  return styles.find(style => style.id === id);
}

export function getDefaultStyle(): PosterStyle {
  return minimalStyle;
}
