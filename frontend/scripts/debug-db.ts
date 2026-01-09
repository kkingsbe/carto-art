
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('URL:', supabaseUrl);
// console.log('Key:', supabaseKey); // Don't log secret

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debug() {
    console.log('--- Debugging Products & Variants ---');

    // 1. Check Products Table Raw
    console.log('\nFetching products (raw)...');
    const { data: products, error: pError } = await supabase.from('products').select('*');
    if (pError) console.error('Error fetching products:', pError);
    else {
        console.log(`Found ${products?.length} products.`);
        products?.forEach(p => console.log(` - [${p.id}] ${p.title} (Active: ${p.is_active})`));
    }

    // 2. Check Variants Table Raw
    console.log('\nFetching variants (raw)...');
    const { data: variants, error: vError } = await supabase.from('product_variants').select('*');
    if (vError) console.error('Error fetching variants:', vError);
    else {
        console.log(`Found ${variants?.length} variants.`);
        const orphans = variants?.filter(v => !v.product_id);
        console.log(`Variants without product_id: ${orphans?.length}`);
    }

    // 3. Test getProducts Query
    console.log('\nTesting relational query (getProducts)...');
    const { data: relData, error: relError } = await supabase
        .from('products')
        .select(`
            *,
            product_variants(*)
        `)
        .order('display_order', { ascending: true }); // Removed explicit alias 'variants:' to see if that's the issue

    if (relError) {
        console.error('Error with inferred relationship:', relError);
        console.log('Trying with explicit alias "variants:product_variants(*)"...');

        const { data: aliasData, error: aliasError } = await supabase
            .from('products')
            .select(`
                *,
                variants:product_variants(*)
            `)
            .order('display_order', { ascending: true });

        if (aliasError) {
            console.error('Error with alias relationship:', aliasError);
        } else {
            console.log(`Success with alias! Found ${aliasData?.length} products.`);
        }
    } else {
        console.log(`Success with inferred (product_variants)! Found ${relData?.length} products.`);
        // console.log(JSON.stringify(relData[0], null, 2));
    }
}

debug().catch(console.error);
