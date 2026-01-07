
import fs from 'fs';
import path from 'path';

async function testUpload() {
    const url = 'http://localhost:3000/api/upload-design';

    // Create a dummy file
    const dummyFilePath = path.join(__dirname, 'test-image.png');
    fs.writeFileSync(dummyFilePath, 'fake image content');

    const blob = new Blob(['fake image content'], { type: 'image/png' });
    const formData = new FormData();
    formData.append('file', blob, 'test-image.png');

    console.log('Sending request to', url);

    try {
        const res = await fetch(url, {
            method: 'POST',
            body: formData,
        });

        console.log('Status:', res.status);
        const text = await res.text();
        console.log('Response:', text);
    } catch (err) {
        console.error('Fetch failed:', err);
    }
}

testUpload();
