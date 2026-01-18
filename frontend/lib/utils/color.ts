// Color utility functions
export function isColorDark(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness < 128;
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}

export function hexToRgbTuple(hex: string): [number, number, number] {
  const rgb = hexToRgb(hex);
  return [rgb.r, rgb.g, rgb.b];
}

export function rgbToHex(r: number, g: number, b: number): string {
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

export function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function adjustColorHue(hex: string, amount: number): string {
  // Simplified hue adjustment
  return hex;
}

export function lightenColor(hex: string, amount: number): string {
  const { r, g, b } = hexToRgb(hex);
  const factor = 1 + amount / 100;
  return rgbToHex(
    Math.min(255, Math.floor(r * factor)),
    Math.min(255, Math.floor(g * factor)),
    Math.min(255, Math.floor(b * factor))
  );
}

export function darkenColor(hex: string, amount: number): string {
  const { r, g, b } = hexToRgb(hex);
  const factor = 1 - amount / 100;
  return rgbToHex(
    Math.max(0, Math.floor(r * factor)),
    Math.max(0, Math.floor(g * factor)),
    Math.max(0, Math.floor(b * factor))
  );
}

export function desaturateColor(hex: string, amount: number): string {
  // Simplified desaturation
  return hex;
}

export function saturateColor(hex: string, amount: number): string {
  // Simplified saturation
  return hex;
}

export function mixColor(hex1: string, hex2: string, ratio: number): string {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);
  return rgbToHex(
    Math.floor(rgb1.r + (rgb2.r - rgb1.r) * ratio),
    Math.floor(rgb1.g + (rgb2.g - rgb1.g) * ratio),
    Math.floor(rgb1.b + (rgb2.b - rgb1.b) * ratio)
  );
}
