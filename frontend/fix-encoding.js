const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');
// Read as UTF-16LE
const content = fs.readFileSync(envPath, 'utf16le');

console.log('Read content length:', content.length);
console.log('First 50 chars:', content.substring(0, 50));

// Write back as UTF-8
fs.writeFileSync(envPath, content, 'utf8');
console.log('Converted .env to UTF-8');
