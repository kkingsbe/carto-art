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
    // Optional: Override base URL if needed (e.g. for testing)
    // baseUrl: 'https://cartoart.net/api/v1' 
});

async function main() {
    console.log(API_KEY)
    const styles = await client.styles.list();
    const style = styles.styles[0];
    console.log('Generating with style:');
    console.log(style);
    const result = await client.posters.generate({
        location: {
            lat: 0,
            lng: 0,
        },
        style: style.id,
    });
    console.log(result);
}

main();
