/**
 * One-off script to generate a 4000x4000 magenta placeholder PNG
 * Used for mockup template generation with Printful API
 * 
 * Run: node scripts/generate-placeholder.js
 */

const fs = require('fs');
const path = require('path');

// PNG signature and minimal valid PNG structure
function createSolidColorPNG(width, height, r, g, b) {
    // We'll use the 'sharp' library if available, otherwise create a simple BMP
    try {
        const sharp = require('sharp');

        // Create raw pixel data (RGBA)
        const channels = 4;
        const pixelData = Buffer.alloc(width * height * channels);

        for (let i = 0; i < width * height; i++) {
            pixelData[i * channels] = r;     // R
            pixelData[i * channels + 1] = g; // G
            pixelData[i * channels + 2] = b; // B
            pixelData[i * channels + 3] = 255; // A (fully opaque)
        }

        return sharp(pixelData, {
            raw: {
                width,
                height,
                channels
            }
        }).png();
    } catch (e) {
        console.log('Sharp not available, trying canvas...');

        // Fallback to canvas
        const { createCanvas } = require('canvas');
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.fillRect(0, 0, width, height);

        return canvas.createPNGStream();
    }
}

async function main() {
    const outputDir = path.join(__dirname, '..', 'temp');
    const outputPath = path.join(outputDir, 'magenta-placeholder-4000x4000.png');

    // Create temp directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    console.log('Generating 4000x4000 magenta placeholder image...');

    const SIZE = 4000;
    const MAGENTA = { r: 255, g: 0, b: 255 }; // #FF00FF

    try {
        const result = createSolidColorPNG(SIZE, SIZE, MAGENTA.r, MAGENTA.g, MAGENTA.b);

        if (result.toFile) {
            // Sharp
            await result.toFile(outputPath);
        } else {
            // Canvas stream
            const writeStream = fs.createWriteStream(outputPath);
            result.pipe(writeStream);
            await new Promise((resolve, reject) => {
                writeStream.on('finish', resolve);
                writeStream.on('error', reject);
            });
        }

        console.log(`✅ Created: ${outputPath}`);
        console.log('');
        console.log('Next steps:');
        console.log('1. Upload this image to Supabase Storage (public bucket)');
        console.log('2. Copy the public URL');
        console.log('3. Update MAGENTA_PLACEHOLDER in lib/actions/printful.ts');

    } catch (error) {
        console.error('Failed to generate image:', error.message);
        console.log('');
        console.log('Try installing sharp: npm install sharp');
        console.log('Or canvas: npm install canvas');
        process.exit(1);
    }
}

main();
