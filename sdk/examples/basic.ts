import { CartoArtClient } from '../src';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env and .env.local
dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config({ path: path.resolve(__dirname, '.env.local'), override: true });

const API_KEY = process.env.CARTOART_API_KEY;

if (!API_KEY) {
    console.error('Error: CARTOART_API_KEY not found in .env or .env.local');
    process.exit(1);
}

const client = new CartoArtClient({
    apiKey: API_KEY,
    baseUrl: process.env.CARTOART_API_URL
});

import * as fs from 'fs';

async function main() {
    // console.log(API_KEY) // Removed for security
    const styles = await client.styles.list();
    const style = styles.styles[0];
    console.log('Generating with style:');
    console.log(style);
    const result = await client.posters.generate({
        location: {
            lat: 34.0522,
            lng: -118.2437, // LA
        },
        style: style.id,
        text: {
            title: "LOS ANGELES",
            subtitle: "California, USA",
            position: "bottom"
        },
        options: {
            buildings_3d: true,
            parks: true,
            water: true,
            marker: true, // New toggle
        }
    });
    console.log('Generation result:', result);

    if (result.download_url) {
        console.log(`Downloading image from ${result.download_url}...`);
        const response = await fetch(result.download_url);
        const buffer = await response.arrayBuffer();
        const fileName = 'outputs/basic.png';
        fs.writeFileSync(path.resolve(__dirname, fileName), Buffer.from(buffer));
        console.log(`✅ Image saved to ${fileName}`);
    } else {
        console.error('❌ No download_url found in the result.');
    }
}

main();
