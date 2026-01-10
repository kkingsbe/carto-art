
const path = require('path');
const fs = require('fs');

// Try to load .env.local from likely locations
const possiblePaths = [
    path.join(__dirname, '../frontend/.env.local'),
    path.join(__dirname, '../.env.local'),
    path.join(__dirname, '.env.local')
];

let envLoaded = false;
for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
        console.log(`Loading env from ${p}`);
        require('dotenv').config({ path: p });
        envLoaded = true;
        break;
    }
}

if (!envLoaded) {
    console.warn('Could not find .env.local file. Checking process.env...');
}

const { createClient } = require('@supabase/supabase-js');

async function main() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
        console.error('Missing Supabase credentials in env');
        console.log('URL:', url);
        console.log('KEY:', key ? 'FOUND' : 'MISSING');
        return;
    }

    const supabase = createClient(url, key);

    console.log('Searching for variants with "12" and "36" in name...');

    // Find variants like "%12%36%"
    const { data: variants, error } = await supabase
        .from('product_variants')
        .select('id, name, mockup_template_url, product_id')
        .ilike('name', '%12%36%');

    if (error) {
        console.error('Supabase Error:', error);
        return;
    }

    if (!variants || variants.length === 0) {
        console.log('No variants found.');
        return;
    }

    console.log(`Found ${variants.length} variants:`);
    variants.forEach(v => {
        console.log('------------------------------------------------');
        console.log(`ID: ${v.id}`);
        console.log(`Name: ${v.name}`);
        console.log(`Product ID: ${v.product_id}`);
        console.log(`Template URL: ${v.mockup_template_url}`);
    });
}

main().catch(console.error);
