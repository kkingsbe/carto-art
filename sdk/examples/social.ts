
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
    baseUrl: process.env.CARTOART_API_URL
});

async function main() {
    console.log('--- Starting Social SDK Test (Virtual Users) ---');

    try {
        // 1. Create a Virtual User
        console.log('\n1. Creating a new virtual user...');
        const virtualUser = await client.users.createVirtual({
            username: `bot_${Math.floor(Math.random() * 10000)}`,
            display_name: "Automated Bot"
        });
        console.log(`✅ Virtual User created! ID: ${virtualUser.id}, Username: ${virtualUser.username}`);

        // 2. Set as active user
        client.setVirtualUser(virtualUser.id);
        console.log(`✅ Client acting as ${virtualUser.username}`);

        // 3. Create a Map as the virtual user
        console.log('\n3. Creating a new map as virtual user...');
        const map = await client.maps.create({
            location: {
                lat: -33.8688,
                lng: 151.2093 // Sydney
            },
            text: {
                title: "Sydney Harbour",
                subtitle: "Automated Generation"
            }
        }, "Sydney Bot Map", { is_published: true });

        console.log(`✅ Map created! ID: ${map.id}, Title: ${map.title}`);

        // 4. Vote on the Map (as ourselves/bot)
        console.log(`\n4. Voting on map ${map.id}...`);
        await client.maps.vote(map.id, 1);
        console.log('✅ Voted successfully');

        // 5. Comment on the Map
        console.log(`\n5. Adding comment as bot...`);
        const comment = await client.comments.create(map.id, "I love this city! (Beep boop)");
        console.log(`✅ Comment added! ID: ${comment.id}, Content: "${comment.content}"`);

        // 6. Follow a User
        // For testing, let's follow the bot owner (the user associated with the API key)
        // We can get the owner ID from the virtual user record if needed, but let's just 
        // try to follow a known user or skip if we don't have one.
        // Actually, we can just follow another virtual user!
        console.log('\n6. Creating second virtual user to test following...');
        const bot2 = await client.users.createVirtual({
            username: `follower_${Math.floor(Math.random() * 10000)}`
        });
        console.log(`✅ Second bot created: ${bot2.username}`);

        console.log(`\n7. Bot 1 (${virtualUser.username}) following Bot 2 (${bot2.username})...`);
        await client.users.follow(bot2.id);
        console.log('✅ Followed successfully');

        console.log(`\n8. Bot 1 unfollowing Bot 2...`);
        await client.users.unfollow(bot2.id);
        console.log('✅ Unfollowed successfully');

        // 6. Cleanup (Optional: delete the virtual user)
        // console.log(`\n6. Deleting virtual user ${virtualUser.id}...`);
        // await client.users.deleteVirtual(virtualUser.id);
        // console.log('✅ Bot deleted');

    } catch (error: any) {
        console.error('❌ Error:', error.message);
        if (error.response) {
            try {
                const body = await error.response.json();
                console.error('Response Details:', JSON.stringify(body, null, 2));
            } catch {
                console.error('Response:', await error.response.text());
            }
        }
    }
}

main();
