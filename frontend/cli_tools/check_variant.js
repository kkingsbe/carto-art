const https = require('https');
const fs = require('fs');
const path = require('path');

// Read .env manually
const envPath = path.join(__dirname, 'frontend', '.env');
try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const apiKeyMatch = envContent.match(/PRINTFUL_API_KEY=(.+)/);
    const API_KEY = apiKeyMatch ? apiKeyMatch[1].trim() : null;

    if (!API_KEY) {
        console.error('Could not find API KEY in .env');
        process.exit(1);
    }

    const variantId = 19296;

    const options = {
        hostname: 'api.printful.com',
        path: `/products/variant/${variantId}`,
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${API_KEY}`
        }
    };

    console.log(`Fetching variant ${variantId} info...`);

    const req = https.request(options, res => {
        let data = '';
        res.on('data', chunk => { data += chunk; });
        res.on('end', () => {
            console.log('Status Code:', res.statusCode);
            console.log('Body:', data);
        });
    });

    req.on('error', error => {
        console.error(error);
    });

    req.end();
} catch (err) {
    console.error('Error reading .env or executing:', err);
}
