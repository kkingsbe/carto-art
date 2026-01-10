import { createClient } from '@supabase/supabase-js';

export async function checkProductsIntegrity() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error('Missing Supabase credentials');
        return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('--- Debugging Products & Variants ---');

    // 1. Check Products Table
    const { data: products, error: pError } = await supabase.from('products').select('*');
    if (pError) console.error('Error fetching products:', pError);
    else {
        console.log(`Found ${products.length} products:`);
        products.forEach(p => console.log(` - [${p.id}] ${p.title} (Active: ${p.is_active})`));
    }

    // 2. Check Variants Table
    const { data: variants, error: vError } = await supabase.from('product_variants').select('*');
    if (vError) console.error('Error fetching variants:', vError);
    else {
        console.log(`Found ${variants.length} variants.`);
        const orphans = variants.filter(v => !v.product_id);
        if (orphans.length > 0) {
            console.log(`WARNING: ${orphans.length} variants have NO product_id!`);
            orphans.slice(0, 5).forEach(v => console.log(`   Orphan: [${v.id}] ${v.name}`));
        } else {
            console.log('All variants have a product_id.');
        }

        // Check for variants pointing to non-existent products
        if (products) {
            const productIds = new Set(products.map(p => p.id));
            const badLinks = variants.filter(v => v.product_id && !productIds.has(v.product_id));
            if (badLinks.length > 0) {
                console.log(`WARNING: ${badLinks.length} variants point to non-existent products!`);
                badLinks.slice(0, 5).forEach(v => console.log(`   Bad Link: [${v.id}] ${v.name} -> Product [${v.product_id}]`));
            } else {
                console.log('All variant product_ids point to existing products.');
            }
        }
    }
}
