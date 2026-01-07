
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.join(__dirname, 'frontend', '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log('Checking product_variants table...');
    const { data, error } = await supabase.from('product_variants').select('*').limit(1);
    if (error) {
        console.error('Error selecting from product_variants:', error);
    } else {
        if (data && data.length > 0) {
            console.log('Columns found:', Object.keys(data[0]));
        } else {
            console.log('Table exists but is empty. Cannot determine columns from data.');
            // Attempt to list columns via rpc or just assume we need to add product_id
            // If table is empty, we can just try to upsert a dummy with product_id and see if it fails.
            // Or better, assume we need to add it.
        }
    }
}

check();
