import LZString from 'lz-string';
import { PosterConfig } from '@/types/poster';
import { getStyleById } from '@/lib/styles';

/**
 * Encodes a config object into a compressed URL-safe string.
 * We save IDs for Style and Palette to keep the URL short.
 */
export function encodeConfig(config: PosterConfig): string {
  const compact = {
    l: config.location,
    s: config.style.id,
    p: config.palette.id,
    t: config.typography,
    f: config.format,
    ly: config.layers,
  };
  
  try {
    const json = JSON.stringify(compact);
    return LZString.compressToEncodedURIComponent(json);
  } catch (e) {
    console.error('Failed to encode config', e);
    return '';
  }
}

/**
 * Decodes a compressed string back into a partial config.
 */
export function decodeConfig(encoded: string): Partial<PosterConfig> | null {
  try {
    const json = LZString.decompressFromEncodedURIComponent(encoded);
    if (!json) return null;
    
    const data = JSON.parse(json);
    
    const style = getStyleById(data.s);
    if (!style) return null;

    // Find the palette by ID within the style
    const palette = style.palettes.find(p => p.id === data.p) || style.defaultPalette;

    return {
      location: data.l,
      style,
      palette,
      typography: data.t,
      format: data.f,
      layers: data.ly,
    };
  } catch (e) {
    console.error('Failed to decode config', e);
    return null;
  }
}

