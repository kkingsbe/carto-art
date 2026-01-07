
import sharp from 'sharp';

/**
 * Convert RGB to HSL
 */
function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h *= 60;
    }
    return [h, s, l];
}

async function detectPrintArea(imageUrl: string) {
    console.log(`Downloading ${imageUrl}...`);
    const response = await fetch(imageUrl);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const image = sharp(buffer);
    const metadata = await image.metadata();
    const width = metadata.width || 1000;
    const height = metadata.height || 1000;

    console.log(`Image dimensions: ${width}x${height}`);

    const { data, info } = await image
        .raw()
        .toBuffer({ resolveWithObject: true });

    let minX = width, minY = height, maxX = 0, maxY = 0;
    let found = false;
    let matchCount = 0;

    // Magenta has a hue of ~300 degrees
    const MAGENTA_HUE = 300;
    const HUE_TOLERANCE = 15;
    const MIN_SATURATION = 0.4;
    const MIN_LIGHTNESS = 0.15;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const offset = (y * width + x) * info.channels;
            const r = data[offset];
            const g = data[offset + 1];
            const b = data[offset + 2];

            const [h, s, l] = rgbToHsl(r, g, b);
            const hueDiff = Math.min(Math.abs(h - MAGENTA_HUE), 360 - Math.abs(h - MAGENTA_HUE));
            const isMagenta = hueDiff < HUE_TOLERANCE && s > MIN_SATURATION && l > MIN_LIGHTNESS;

            if (y === 500 && x % 50 === 0) {
                console.log(`Pixel at 500,${x}: R=${r}, G=${g}, B=${b} H=${h.toFixed(0)} S=${s.toFixed(2)} L=${l.toFixed(2)} - Match: ${isMagenta}`);
            }

            if (isMagenta) {
                found = true;
                matchCount++;
                minX = Math.min(minX, x);
                minY = Math.min(minY, y);
                maxX = Math.max(maxX, x);
                maxY = Math.max(maxY, y);
            }
        }
    }

    if (!found) {
        throw new Error('Could not find magenta placeholder in template');
    }

    console.log(`Found ${matchCount} matching pixels.`);
    console.log(`Bounds: minX=${minX}, minY=${minY}, maxX=${maxX}, maxY=${maxY}`);

    return {
        x: minX / width,
        y: minY / height,
        width: (maxX - minX + 1) / width,
        height: (maxY - minY + 1) / height
    };
}

const TEST_URL = 'https://printful-upload.s3-accelerate.amazonaws.com/tmp/61c381e4bec5273aef0da64ff4339fe0/canvas-(in)-10x10-wall-695e6ed98dea0.png';

detectPrintArea(TEST_URL)
    .then(area => console.log('Detected Area:', area))
    .catch(err => console.error(err));

