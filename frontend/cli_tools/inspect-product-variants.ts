import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

export async function inspectVariants() {
    dotenv.config({ path: path.join(__dirname, '../.env') });

    // Load env vars
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error('Missing Supabase credentials');
        if (typeof require !== 'undefined' && typeof module !== 'undefined' && require.main === module) process.exit(1);
        return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Checking product_variants table...');
    const { data, error } = await supabase.from('product_variants').select('*').limit(1);
    if (error) {
        console.error('Error selecting from product_variants:', error);
    } else {
        if (data && data.length > 0) {
            console.log('Columns found:', Object.keys(data[0]));
        } else {
            console.log('Table exists but is empty.');
        }
    }
}

if (typeof require !== 'undefined' && typeof module !== 'undefined' && require.main === module) {
    inspectVariants();
}
