import { searchLocation, reverseGeocode } from '../lib/geocoding/locationiq';
import dotenv from 'dotenv';
import path from 'path';

export async function verifyGeocoding() {
    dotenv.config({ path: path.join(__dirname, '../.env') });

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

if (typeof require !== 'undefined' && typeof module !== 'undefined' && require.main === module) {
    verifyGeocoding();
}
