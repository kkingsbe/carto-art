import https from 'https';
import dotenv from 'dotenv';
import path from 'path';

export function testKey() {
    dotenv.config({ path: path.join(__dirname, '../.env') });

    // Prefer env var, fallback to hardcoded if strictly needed (but should use env)
    const API_KEY = process.env.LOCATIONIQ_API_KEY;

    if (!API_KEY) {
        console.error("Missing LOCATIONIQ_API_KEY in .env");
        return;
    }

    console.log('Testing LocationIQ Key...');
    const url = `https://us1.locationiq.com/v1/search.php?key=${API_KEY}&q=Paris&format=json&limit=1`;

    https.get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
            console.log('Status:', res.statusCode);
            if (res.statusCode === 200) {
                console.log('Success! API Key is valid.');
            } else {
                console.error('Failed:', data);
            }
        });
    }).on('error', (err) => {
        console.error('Network Error:', err.message);
    });
}

if (typeof require !== 'undefined' && typeof module !== 'undefined' && require.main === module) {
    testKey();
}
