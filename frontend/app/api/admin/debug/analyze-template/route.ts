import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';

export async function POST(request: NextRequest) {
    try {
        const { templateUrl, printArea } = await request.json();

        if (!templateUrl) {
            return NextResponse.json({ error: 'Template URL is required' }, { status: 400 });
        }

        // Fetch the template image
        const response = await fetch(templateUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch template: ${response.status}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Get image dimensions
        const metadata = await sharp(buffer).metadata();
        const width = metadata.width || 1000;
        const height = metadata.height || 1000;

        // Convert to raw pixel data
        const { data, info } = await sharp(buffer)
            .raw()
            .toBuffer({ resolveWithObject: true });

        // Find magenta bounds (same logic as detectPrintArea)
        const MAGENTA_HUE = 300;
        const HUE_TOLERANCE = 15;
        const MIN_SATURATION = 0.4;
        const MIN_LIGHTNESS = 0.15;

        let minX = width, minY = height, maxX = 0, maxY = 0;
        let found = false;

        const rgbToHsl = (r: number, g: number, b: number): [number, number, number] => {
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
        };

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const offset = (y * width + x) * info.channels;
                const r = data[offset];
                const g = data[offset + 1];
                const b = data[offset + 2];

                const [h, s, l] = rgbToHsl(r, g, b);
                const hueDiff = Math.min(Math.abs(h - MAGENTA_HUE), 360 - Math.abs(h - MAGENTA_HUE));
                const isMagenta = hueDiff < HUE_TOLERANCE && s > MIN_SATURATION && l > MIN_LIGHTNESS;

                if (isMagenta) {
                    found = true;
                    minX = Math.min(minX, x);
                    minY = Math.min(minY, y);
                    maxX = Math.max(maxX, x);
                    maxY = Math.max(maxY, y);
                }
            }
        }

        if (!found) {
            return NextResponse.json({ error: 'No magenta pixels found in template' }, { status: 400 });
        }

        const detectedBounds = {
            x: minX / width,
            y: minY / height,
            width: (maxX - minX + 1) / width,
            height: (maxY - minY + 1) / height
        };

        const printAreaPixels = {
            x: printArea.x * width,
            y: printArea.y * height,
            width: printArea.width * width,
            height: printArea.height * height
        };

        const analysis = {
            templateDimensions: { width, height },
            detectedBounds,
            printAreaPixels
        };

        return NextResponse.json({
            analysis,
            magentaBounds: detectedBounds
        });

    } catch (error: any) {
        console.error('Template analysis error:', error);
        return NextResponse.json({
            error: error.message || 'Failed to analyze template'
        }, { status: 500 });
    }
}
