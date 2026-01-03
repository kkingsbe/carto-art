/**
 * Color manipulation utilities
 */

/**
 * Converts a hex color string to rgba() CSS format.
 * Supports both 3-digit and 6-digit hex colors.
 * 
 * @param hex - Hex color string (e.g., "#ff0000" or "#f00")
 * @param alpha - Alpha value between 0 and 1
 * @returns RGBA CSS string (e.g., "rgba(255, 0, 0, 0.5)")
 * 
 * @example
 * ```ts
 * hexToRgba('#ff0000', 0.5) // "rgba(255, 0, 0, 0.5)"
 * hexToRgba('#f00', 1) // "rgba(255, 0, 0, 1)"
 * ```
 */
export function hexToRgba(hex: string, alpha: number): string {
    const normalized = hex.trim();
    if (!normalized.startsWith('#')) {
        return normalized;
    }

    const raw = normalized.slice(1);
    const expanded =
        raw.length === 3
            ? raw
                .split('')
                .map(ch => ch + ch)
                .join('')
            : raw;

    if (expanded.length !== 6) return normalized;

    const r = Number.parseInt(expanded.slice(0, 2), 16);
    const g = Number.parseInt(expanded.slice(2, 4), 16);
    const b = Number.parseInt(expanded.slice(4, 6), 16);

    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Determines if a hex color is dark using ITU-R BT.709 luminance formula.
 * Useful for choosing appropriate text colors on colored backgrounds.
 * 
 * @param hex - Hex color string (e.g., "#000000" or "#fff")
 * @returns true if the color is dark (luminance < 0.5), false if light
 * 
 * @example
 * ```ts
 * isColorDark('#000000') // true
 * isColorDark('#ffffff') // false
 * ```
 */
export function isColorDark(hex: string): boolean {
    const normalized = hex.trim();
    if (!normalized.startsWith('#')) return false;

    const raw = normalized.slice(1);
    const expanded =
        raw.length === 3
            ? raw
                .split('')
                .map(ch => ch + ch)
                .join('')
            : raw;

    if (expanded.length !== 6) return false;

    const r = Number.parseInt(expanded.slice(0, 2), 16);
    const g = Number.parseInt(expanded.slice(2, 4), 16);
    const b = Number.parseInt(expanded.slice(4, 6), 16);

    // ITU-R BT.709 luminance formula
    const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    return luminance < 0.5;
}

/**
 * Converts hex to RGB tuple
 */
export function hexToRgb(hex: string): [number, number, number] | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16)
    ] : null;
}

/**
 * Converts RGB tuple to hex string
 */
export function rgbToHex(r: number, g: number, b: number): string {
    return '#' + [r, g, b].map(x => {
        const hex = Math.round(x).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    }).join('');
}

/**
 * Simple hue adjustment by rotating RGB values
 */
export function adjustColorHue(hex: string, degrees: number): string {
    const rgb = hexToRgb(hex);
    if (!rgb) return hex;

    const [r, g, b] = rgb;
    const factor = degrees / 360;

    // Shift towards yellow (increase green) or blue (increase blue)
    if (degrees > 0) {
        // Shift towards yellow: increase green, decrease blue slightly
        return rgbToHex(
            Math.min(255, r + factor * 20),
            Math.min(255, g + factor * 30),
            Math.max(0, b - factor * 10)
        );
    } else {
        // Shift towards blue: increase blue, decrease green slightly
        return rgbToHex(
            Math.max(0, r - Math.abs(factor) * 10),
            Math.max(0, g - Math.abs(factor) * 20),
            Math.min(255, b + Math.abs(factor) * 30)
        );
    }
}

export function lightenColor(hex: string, amount: number): string {
    const rgb = hexToRgb(hex);
    if (!rgb) return hex;

    const [r, g, b] = rgb;
    return rgbToHex(
        Math.min(255, r + (255 - r) * amount),
        Math.min(255, g + (255 - g) * amount),
        Math.min(255, b + (255 - b) * amount)
    );
}

export function darkenColor(hex: string, amount: number): string {
    const rgb = hexToRgb(hex);
    if (!rgb) return hex;

    const [r, g, b] = rgb;
    return rgbToHex(
        Math.max(0, r * (1 - amount)),
        Math.max(0, g * (1 - amount)),
        Math.max(0, b * (1 - amount))
    );
}

export function desaturateColor(hex: string, amount: number): string {
    const rgb = hexToRgb(hex);
    if (!rgb) return hex;

    const [r, g, b] = rgb;
    const gray = r * 0.299 + g * 0.587 + b * 0.114;

    return rgbToHex(
        Math.round(r + (gray - r) * amount),
        Math.round(g + (gray - g) * amount),
        Math.round(b + (gray - b) * amount)
    );
}

export function saturateColor(hex: string, amount: number): string {
    const rgb = hexToRgb(hex);
    if (!rgb) return hex;

    const [r, g, b] = rgb;
    const gray = r * 0.299 + g * 0.587 + b * 0.114;

    return rgbToHex(
        Math.max(0, Math.min(255, Math.round(gray + (r - gray) * (1 + amount)))),
        Math.max(0, Math.min(255, Math.round(gray + (g - gray) * (1 + amount)))),
        Math.max(0, Math.min(255, Math.round(gray + (b - gray) * (1 + amount))))
    );
}

export function mixColor(hex1: string, hex2: string, weight: number): string {
    const rgb1 = hexToRgb(hex1);
    const rgb2 = hexToRgb(hex2);
    if (!rgb1 || !rgb2) return hex1;

    const w = Math.min(1, Math.max(0, weight));
    const w1 = 1 - w;

    return rgbToHex(
        Math.round(rgb1[0] * w1 + rgb2[0] * w),
        Math.round(rgb1[1] * w1 + rgb2[1] * w),
        Math.round(rgb1[2] * w1 + rgb2[2] * w)
    );
}
