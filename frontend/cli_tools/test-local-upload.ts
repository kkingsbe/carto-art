import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function testLocalUpload() {
    const url = 'http://localhost:3000/api/upload-design';

    // Create a dummy file
    const dummyFilePath = path.join(__dirname, 'test-image.png');
    // Ensure test-image.png exists or create it
    if (!fs.existsSync(dummyFilePath)) {
        fs.writeFileSync(dummyFilePath, 'fake image content');
    }
    const fileContent = fs.readFileSync(dummyFilePath);

    const blob = new Blob([fileContent], { type: 'image/png' });
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
