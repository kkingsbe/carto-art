import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { parseAspectRatio, parseVariantDimensions, variantMatchesOrientationStrict, findBestMatchingVariant } from '../lib/utils/store';

async function diagnoseCanvasIssue() {
    dotenv.config({ path: path.join(__dirname, '../.env') });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error('Missing Supabase credentials');
        process.exit(1);
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('=== Diagnosing Canvas vs Poster Variant Selection ===\n');

    // Get Canvas and Poster products
    const { data: products } = await supabase
        .from('products')
        .select('id, title')
        .in('id', [3, 2]); // Canvas=3, Poster=2 (guessing based on user screenshots)

    console.log('Products:', products);

    // Get variants for both products
    const { data: allVariants } = await supabase
        .from('product_variants')
        .select('id, name, product_id, mockup_template_url, mockup_print_area, is_active, display_price_cents')
        .in('product_id', products?.map(p => p.id) || [])
        .eq('is_active', true);

    console.log(`\nTotal variants loaded: ${allVariants?.length}`);

    // Test with 2:3 portrait
    const targetRatio = 2 / 3;
    const orientation = 'portrait' as 'portrait' | 'landscape';

    // Group by product
    const byProduct = new Map<number, any[]>();
    allVariants?.forEach(v => {
        if (!byProduct.has(v.product_id)) byProduct.set(v.product_id, []);
        byProduct.get(v.product_id)?.push(v);
    });

    byProduct.forEach((variants, productId) => {
        const product = products?.find(p => p.id === productId);
        console.log(`\n\n======= Product: ${product?.title || productId} (ID=${productId}) =======`);
        console.log(`Variants count: ${variants.length}`);

        // Check what findBestMatchingVariant returns
        const result = findBestMatchingVariant(variants as any, targetRatio, orientation);

        if (result) {
            console.log(`\nSelected by findBestMatchingVariant:`);
            console.log(`  Name: ${result.variant.name}`);
            console.log(`  Is Exact Match: ${result.isExactMatch}`);
            console.log(`  Match Score: ${(result.matchScore * 100).toFixed(1)}%`);
            console.log(`  Has Mockup Template: ${!!result.variant.mockup_template_url}`);

            // Check print area
            let printArea: any = null;
            if (result.variant.mockup_print_area) {
                try {
                    printArea = typeof result.variant.mockup_print_area === 'string'
                        ? JSON.parse(result.variant.mockup_print_area)
                        : result.variant.mockup_print_area;
                } catch { }
            }
            console.log(`  Print Area: ${printArea ? JSON.stringify(printArea) : 'NULL'}`);

            if (printArea) {
                const isSquarePrintArea = Math.abs(printArea.width - printArea.height) < 0.01;
                console.log(`  Print Area is Square: ${isSquarePrintArea}`);
            }
        } else {
            console.log(`\nNo variant selected!`);
        }

        // List a few variants with their mockup template presence
        console.log(`\nSample variants (first 5 with dimensions parsed):`);
        let count = 0;
        for (const v of variants) {
            const dims = parseVariantDimensions(v.name);
            if (dims && count < 5) {
                count++;
                console.log(`  [${v.id}] ${v.name} - Dims: ${dims.width}x${dims.height}, Ratio: ${(dims.width / dims.height).toFixed(3)}, Template: ${v.mockup_template_url ? 'YES' : 'NO'}`);
            }
        }
    });
}

diagnoseCanvasIssue().catch(console.error);
