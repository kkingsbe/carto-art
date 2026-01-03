const { CartoArtClient } = require('../dist');

const API_KEY = 'ca_live_demo_sandbox_key_2024';

const client = new CartoArtClient({
    apiKey: API_KEY,
    baseUrl: 'https://cartoart.net/api/v1'
});

async function run() {
    console.log('Running simple.js check...');
    try {
        await client.styles.list();
        console.log('Success!');
    } catch (e) {
        console.error('Error:', e.message);
    }
}

run();
