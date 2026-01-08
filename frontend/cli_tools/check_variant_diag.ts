import https from 'https';
import dotenv from 'dotenv';
import path from 'path';

export async function checkVariant() {
    // Load .env
    dotenv.config({ path: path.join(__dirname, '../.env') });
    const API_KEY = process.env.PRINTFUL_API_KEY;

    if (!API_KEY) {
        console.error('Could not find PRINTFUL_API_KEY in .env');
        if (typeof require !== 'undefined' && typeof module !== 'undefined' && require.main === module) process.exit(1);
        return;
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

    console.log(`Fetching Printful Variant ${variantId} info...`);

    return new Promise((resolve, reject) => {
        const req = https.request(options, res => {
            let data = '';
            res.on('data', chunk => { data += chunk; });
            res.on('end', () => {
                console.log('Status Code:', res.statusCode);
                try {
                    const result = JSON.parse(data);
                    console.log(JSON.stringify(result, null, 2));
                    resolve(result);
                } catch (e) {
                    reject(e);
                }
            });
        });

        req.on('error', error => {
            console.error(error);
            reject(error);
        });

        req.end();
    });
}

if (typeof require !== 'undefined' && typeof module !== 'undefined' && require.main === module) {
    checkVariant();
}
