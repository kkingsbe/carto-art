/**
 * Terrain shadow computation utilities.
 * Computes self-shadowing for 3D terrain based on sun position.
 */

export interface ShadowComputeOptions {
    /** Sun azimuth angle in degrees (0-360, 0=North, 90=East) */
    sunAzimuth: number;
    /** Sun altitude angle in degrees (0-90, 0=horizon, 90=zenith) */
    sunAltitude: number;
    /** Shadow darkness (0-1, 0=no shadow, 1=full black) */
    shadowDarkness?: number;
    /** Shadow softness - number of samples for soft shadows (1-8) */
    shadowSoftness?: number;
    /** Maximum shadow ray distance in pixels */
    maxRayDistance?: number;
}

/**
 * Decodes Terrarium-encoded elevation from RGB values.
 * Terrarium encoding: elevation = (R * 256 + G + B / 256) - 32768
 */
function decodeTerrarium(r: number, g: number, b: number): number {
    return (r * 256 + g + b / 256) - 32768;
}

/**
 * Computes a shadow texture from elevation data.
 * Uses ray marching from each pixel toward the sun to determine shadow.
 *
 * @param elevationCanvas - Canvas containing Terrarium-encoded elevation data
 * @param options - Shadow computation options
 * @returns Canvas with shadow texture (grayscale: white=lit, black=shadow)
 */
export function computeShadowTexture(
    elevationCanvas: HTMLCanvasElement | ImageBitmap,
    options: ShadowComputeOptions
): HTMLCanvasElement {
    const {
        sunAzimuth,
        sunAltitude,
        shadowDarkness = 0.7,
        shadowSoftness = 2,
        maxRayDistance = 256,
    } = options;

    // Get elevation data
    const width = elevationCanvas.width;
    const height = elevationCanvas.height;

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
    if (!tempCtx) throw new Error('Could not create temp canvas context');

    tempCtx.drawImage(elevationCanvas, 0, 0);
    const imageData = tempCtx.getImageData(0, 0, width, height);
    const data = imageData.data;

    // Decode elevation grid
    const elevation = new Float32Array(width * height);
    for (let i = 0; i < width * height; i++) {
        const idx = i * 4;
        elevation[i] = decodeTerrarium(data[idx], data[idx + 1], data[idx + 2]);
    }

    // Compute sun direction in pixel space
    // Azimuth: 0=North(+Y), 90=East(+X), 180=South(-Y), 270=West(-X)
    const azimuthRad = (sunAzimuth * Math.PI) / 180;
    const altitudeRad = (sunAltitude * Math.PI) / 180;

    // Direction TO the sun (normalized)
    const sunDirX = Math.sin(azimuthRad);
    const sunDirY = -Math.cos(azimuthRad); // Negative because canvas Y increases downward
    const sunTanAlt = Math.tan(altitudeRad);

    // Create shadow output
    const shadowData = new Uint8ClampedArray(width * height * 4);

    // Pixel scale factor - how much elevation change per pixel
    // This depends on the actual geographic scale, but we'll use an approximation
    // Assume ~30m/pixel at zoom 10, adjust based on typical terrain gradients
    const pixelScale = 30; // meters per pixel (approximate)

    // Process each pixel
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = y * width + x;
            const baseElevation = elevation[idx];

            // Accumulate shadow samples for soft shadows
            let shadowAccum = 0;
            const samples = Math.max(1, shadowSoftness);

            for (let s = 0; s < samples; s++) {
                // Add jitter for soft shadows
                const jitterAngle = (s / samples) * Math.PI * 2;
                const jitterRadius = s > 0 ? 0.5 : 0;
                const jitterX = Math.cos(jitterAngle) * jitterRadius;
                const jitterY = Math.sin(jitterAngle) * jitterRadius;

                let inShadow = false;

                // March ray toward sun
                for (let dist = 1; dist < maxRayDistance; dist++) {
                    const sampleX = Math.round(x + (sunDirX + jitterX) * dist);
                    const sampleY = Math.round(y + (sunDirY + jitterY) * dist);

                    // Check bounds
                    if (sampleX < 0 || sampleX >= width || sampleY < 0 || sampleY >= height) {
                        break;
                    }

                    const sampleIdx = sampleY * width + sampleX;
                    const sampleElevation = elevation[sampleIdx];

                    // Calculate required elevation at this distance to block sunlight
                    // The sun ray comes from angle sunAltitude above horizon
                    // At distance d, blocking terrain must be at elevation: baseElevation + d * pixelScale * tan(altitude)
                    const requiredElevation = baseElevation + dist * pixelScale * sunTanAlt;

                    if (sampleElevation > requiredElevation) {
                        inShadow = true;
                        break;
                    }
                }

                if (inShadow) {
                    shadowAccum += 1;
                }
            }

            // Calculate final shadow value
            const shadowRatio = shadowAccum / samples;
            const brightness = 255 * (1 - shadowRatio * shadowDarkness);

            const outIdx = idx * 4;
            shadowData[outIdx] = brightness;
            shadowData[outIdx + 1] = brightness;
            shadowData[outIdx + 2] = brightness;
            shadowData[outIdx + 3] = 255;
        }
    }

    // Create output canvas
    const outputCanvas = document.createElement('canvas');
    outputCanvas.width = width;
    outputCanvas.height = height;
    const outputCtx = outputCanvas.getContext('2d');
    if (!outputCtx) throw new Error('Could not create output canvas context');

    const outputImageData = new ImageData(shadowData, width, height);
    outputCtx.putImageData(outputImageData, 0, 0);

    return outputCanvas;
}

/**
 * Creates a combined shadow + base color texture.
 * Multiplies shadow values with a base color to create shaded terrain appearance.
 */
export function createShadedTexture(
    shadowCanvas: HTMLCanvasElement,
    baseColor: [number, number, number] = [200, 200, 200],
    highlightColor: [number, number, number] = [255, 255, 255],
    shadowColor: [number, number, number] = [50, 50, 70]
): HTMLCanvasElement {
    const width = shadowCanvas.width;
    const height = shadowCanvas.height;

    const ctx = shadowCanvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('Could not get shadow canvas context');

    const shadowData = ctx.getImageData(0, 0, width, height);
    const outputData = new Uint8ClampedArray(width * height * 4);

    for (let i = 0; i < width * height; i++) {
        const shadowValue = shadowData.data[i * 4] / 255; // 0 = full shadow, 1 = full light

        // Interpolate between shadow and highlight colors based on shadow value
        const r = shadowColor[0] + (highlightColor[0] - shadowColor[0]) * shadowValue;
        const g = shadowColor[1] + (highlightColor[1] - shadowColor[1]) * shadowValue;
        const b = shadowColor[2] + (highlightColor[2] - shadowColor[2]) * shadowValue;

        const idx = i * 4;
        outputData[idx] = r;
        outputData[idx + 1] = g;
        outputData[idx + 2] = b;
        outputData[idx + 3] = 255;
    }

    const outputCanvas = document.createElement('canvas');
    outputCanvas.width = width;
    outputCanvas.height = height;
    const outputCtx = outputCanvas.getContext('2d');
    if (!outputCtx) throw new Error('Could not create output canvas context');

    outputCtx.putImageData(new ImageData(outputData, width, height), 0, 0);

    return outputCanvas;
}

/**
 * Fetches an elevation tile and returns as ImageBitmap.
 */
export async function fetchElevationTile(
    url: string,
    z: number,
    x: number,
    y: number
): Promise<ImageBitmap> {
    const tileUrl = url
        .replace('{z}', String(z))
        .replace('{x}', String(x))
        .replace('{y}', String(y));

    const response = await fetch(tileUrl);
    if (!response.ok) {
        throw new Error(`Failed to fetch elevation tile: ${response.status}`);
    }

    const blob = await response.blob();
    return createImageBitmap(blob);
}
