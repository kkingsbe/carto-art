const https = require('https');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

async function check() {
    // Load .env
    dotenv.config({ path: '.env' });
    const API_KEY = process.env.PRINTFUL_API_KEY;

    if (!API_KEY) {
        console.error('Could not find PRINTFUL_API_KEY in .env');
        process.exit(1);
    }

    const productId = 3;

    const options = {
        hostname: 'api.printful.com',
        path: `/mockup-generator/templates/${productId}`,
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${API_KEY}`
        }
    };

    console.log(`Fetching Printful Templates for Product ${productId}...`);

    const req = https.request(options, res => {
        let data = '';
        res.on('data', chunk => { data += chunk; });
        res.on('end', () => {
            console.log('Status Code:', res.statusCode);
            const result = JSON.parse(data);
            console.log(JSON.stringify(result, null, 2));
        });
    });

    req.on('error', error => {
        console.error(error);
    });

    req.end();
}

check();
