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
    baseUrl: process.env.CARTOART_API_URL || 'https://cartoart.net/api/v1'
});

async function run() {
    console.log('--- Verifying SDK at https://cartoart.net/api/v1 ---');

    try {
        console.log('\n1. Fetching Styles...');
        const styles = await client.styles.list();
        console.log(`✅ Success! Found ${styles.styles.length} styles.`);
        if (styles.styles.length > 0) {
            console.log(`   First style: ${styles.styles[0].name} (${styles.styles[0].id})`);
        }

        console.log('\n2. Generating Poster...');
        const poster = await client.posters.generate({
            location: { lat: 34.0522, lng: -118.2437 }, // LA
            style: 'minimal',
            options: { high_res: false }
        });

        console.log('✅ Poster Generation Initiated!');
        console.log(`   ID: ${poster.id}`);
        console.log(`   Status: ${poster.status}`);
        if (poster.download_url) {
            console.log(`   URL: ${poster.download_url}`);
        }

    } catch (error: any) {
        console.error('❌ Verification Failed:', error.message);
        process.exit(1);
    }
}

run();
