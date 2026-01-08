import fs from 'fs';
import path from 'path';

export function checkEncoding() {
    const envPath = path.join(__dirname, '../.env');

    if (!fs.existsSync(envPath)) {
        console.error('.env file not found at', envPath);
        return;
    }

    const buffer = fs.readFileSync(envPath);

    console.log('File size:', buffer.length);
    console.log('First 16 bytes:', buffer.subarray(0, 16));
    console.log('First 16 bytes (hex):', buffer.subarray(0, 16).toString('hex'));

    const content = buffer.toString('utf8');
    console.log('Content starts with:', content.substring(0, 50));
    return { size: buffer.length, contentHeader: content.substring(0, 50) };
}

if (typeof require !== 'undefined' && typeof module !== 'undefined' && require.main === module) {
    checkEncoding();
}
