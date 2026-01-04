
import { CartoArtClient } from '../src';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config({ path: path.resolve(__dirname, '.env.local'), override: true });

const API_KEY = process.env.CARTOART_API_KEY;

if (!API_KEY) {
    console.error('Error: CARTOART_API_KEY not found');
    process.exit(1);
}

const client = new CartoArtClient({
    apiKey: API_KEY,
    baseUrl: process.env.CARTOART_API_URL || 'http://localhost:3000/api/v1'
});

async function main() {
    console.log('--- Starting Social SDK Test ---');

    // 1. Create a Map
    console.log('\n1. Creating a new map...');
    try {
        const map = await client.maps.create({
            location: {
                lat: 40.7128,
                lng: -74.0060 // NYC
            },
            text: {
                title: "New York City",
                subtitle: "The Big Apple"
            }
        }, "NYC Test Map", { is_published: true });

        console.log(`✅ Map created! ID: ${map.id}, Title: ${map.title}`);

        // 2. Vote on the Map
        console.log(`\n2. Voting on map ${map.id}...`);
        await client.maps.vote(map.id, 1);
        console.log('✅ Voted successfully');

        // 3. Comment on the Map
        console.log(`\n3. Commenting on map ${map.id}...`);
        const comment = await client.comments.create(map.id, "This is an automated comment from the SDK!");
        console.log(`✅ Comment added! ID: ${comment.id}, Content: "${comment.content}"`);

        // 4. List Comments
        console.log('\n4. Listing comments...');
        const comments = await client.comments.list(map.id);
        console.log(`✅ Found ${comments.length} comments.`);
        console.log(comments);

    } catch (error: any) {
        console.error('❌ Error:', error.message);
        if (error.response) {
            console.error('Response:', await error.response.text());
        }
    }
}

main();
