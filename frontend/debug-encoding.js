const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');
const buffer = fs.readFileSync(envPath);

console.log('File size:', buffer.length);
console.log('First 16 bytes:', buffer.subarray(0, 16));
console.log('First 16 bytes (hex):', buffer.subarray(0, 16).toString('hex'));

const content = buffer.toString('utf8');
console.log('Content starts with:', content.substring(0, 50));
