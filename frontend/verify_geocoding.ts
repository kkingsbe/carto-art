
import { searchLocation, reverseGeocode } from './lib/geocoding/locationiq';
// Mock process.env since we can't easily load .env in this script context without dotenv
// But we can just rely on the fact that I added it to .env and ts-node might pick it up if I use dotenv
// Or I can just pass it explicitly in the script for testing if I don't want to install dotenv
// Let's assume the user has the key in .env and use dotenv if available, or just hardcode for this test (bad practice to hardcode in file).
// Better: Read .env manually.

import fs from 'fs';
import path from 'path';

function loadEnv() {
    try {
        const envPath = path.resolve(process.cwd(), '.env');
        const envContent = fs.readFileSync(envPath, 'utf-8');
        envContent.split('\n').forEach(line => {
            const match = line.match(/^([^=]+)=(.*)$/);
            if (match) {
                const key = match[1].trim();
                const value = match[2].trim().replace(/^["']|["']$/g, '');
                process.env[key] = value;
            }
        });
    } catch (e) {
        console.error('Could not read .env file');
    }
}

loadEnv();

async function test() {
    console.log('Testing LocationIQ...');
    console.log('API Key present:', !!process.env.LOCATIONIQ_API_KEY);

    try {
        console.log('\n--- Forward Geocoding (Paris) ---');
        const results = await searchLocation('Paris');
        console.log(`Found ${results.length} results.`);
        if (results.length > 0) {
            console.log('First result:', JSON.stringify(results[0], null, 2));
        }

        console.log('\n--- Reverse Geocoding (40.7128, -74.0060) ---');
        const reverse = await reverseGeocode(40.7128, -74.0060); // NYC
        console.log('Reverse result:', JSON.stringify(reverse, null, 2));

    } catch (error) {
        console.error('Test failed:', error);
    }
}

test();
