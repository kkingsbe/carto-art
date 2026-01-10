import { createClient } from '@supabase/supabase-js';

export async function checkProductVariantsSchema() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error('Missing Supabase credentials');
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
            console.log('Table exists but is empty. Cannot determine columns from data.');
        }
    }
}
