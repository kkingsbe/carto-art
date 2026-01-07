const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

async function listVariants() {
    // Load .env
    dotenv.config({ path: '.env' });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error('Could not find Supabase URL or Key in .env');
        process.exit(1);
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
        .from('product_variants')
        .select('*');

    if (error) {
        console.error('Error fetching variants:', error);
    } else {
        console.log('Product Variants:');
        const summary = data.map(v => ({
            id: v.id,
            product_id: v.product_id,
            name: v.name,
            price: v.price_cents / 100,
            active: v.is_active
        }));
        console.table(summary);
    }
}

listVariants();
