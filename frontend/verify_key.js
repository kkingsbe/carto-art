
const https = require('https');

const API_KEY = 'pk.c591714b39866f1887ab5d15ed1395e6';

function testKey() {
    console.log('Testing LocationIQ Key...');
    const url = `https://us1.locationiq.com/v1/search.php?key=${API_KEY}&q=Paris&format=json&limit=1`;

    https.get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
            console.log('Status:', res.statusCode);
            if (res.statusCode === 200) {
                console.log('Success! API Key is valid.');
                // console.log('Response:', data.substring(0, 100) + '...');
            } else {
                console.error('Failed:', data);
            }
        });
    }).on('error', (err) => {
        console.error('Network Error:', err.message);
    });
}

testKey();
