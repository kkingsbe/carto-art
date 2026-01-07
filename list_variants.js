const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function listVariants() {
    // Read .env manually
    const envPath = path.join(__dirname, 'frontend', '.env');
    const envContent = fs.readFileSync(envPath, 'utf8');

    const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/);
    const keyMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)/);
    const serviceKeyMatch = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/);

    const supabaseUrl = urlMatch ? urlMatch[1].trim() : null;
    const supabaseKey = serviceKeyMatch ? serviceKeyMatch[1].trim() : (keyMatch ? keyMatch[1].trim() : null);

    if (!supabaseUrl || !supabaseKey) {
        console.error('Could not find Supabase URL or Key');
        process.exit(1);
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
        .from('product_variants')
        .select('*')
        .limit(20);

    if (error) {
        console.error('Error fetching variants:', error);
    } else {
        console.log('Product Variants (first 20):');
        console.table(data.map(v => ({
            id: v.id,
            product_id: v.product_id,
            name: v.name,
            price: v.price_cents / 100,
            active: v.is_active
        })));
    }
}

listVariants();
