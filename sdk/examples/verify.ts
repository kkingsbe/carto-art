import { CartoArtClient } from '../src';

// Use the public sandbox key
const API_KEY = 'ca_live_demo_sandbox_key_2024';

const client = new CartoArtClient({
    apiKey: API_KEY,
    // Explicitly set to prod in case we want to change later, though default matches
    baseUrl: 'https://cartoart.net/api/v1'
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
