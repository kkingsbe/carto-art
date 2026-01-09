import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { parseAspectRatio, parseVariantDimensions, variantMatchesOrientationStrict } from '../lib/utils/store';

async function diagnoseCanvasVariants() {
    dotenv.config({ path: path.join(__dirname, '../.env') });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error('Missing Supabase credentials');
        process.exit(1);
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Get Canvas product ID
    console.log('=== Diagnosing Canvas Variant Selection ===\n');

    const { data: products, error: prodError } = await supabase
        .from('products')
        .select('id, title')
        .ilike('title', '%Canvas%');

    if (prodError || !products?.length) {
        console.error('Could not find Canvas product:', prodError);
        process.exit(1);
    }

    const canvasProduct = products[0];
    console.log(`Found Canvas Product: ID=${canvasProduct.id}, Title="${canvasProduct.title}"`);

    // 2. Get all variants for Canvas
    const { data: variants, error: varError } = await supabase
        .from('product_variants')
        .select('id, name, mockup_template_url, mockup_print_area, is_active')
        .eq('product_id', canvasProduct.id)
        .eq('is_active', true);

    if (varError) {
        console.error('Error fetching variants:', varError);
        process.exit(1);
    }

    console.log(`\nFound ${variants?.length || 0} active Canvas variants:\n`);

    // 3. Simulate the selection logic for a Portrait 2:3 design
    const targetRatio = 2 / 3; // Portrait 2:3
    const orientation = 'portrait';
    const isPortrait = true;
    const tolerance = 0.05;

    console.log(`Target: Aspect Ratio = ${targetRatio.toFixed(3)} (2:3), Orientation = ${orientation}\n`);
    console.log('--- Variant Analysis ---');

    variants?.forEach((v: any) => {
        const dims = parseVariantDimensions(v.name);
        const hasTemplate = !!v.mockup_template_url;

        let printArea: any = null;
        if (v.mockup_print_area) {
            try {
                printArea = typeof v.mockup_print_area === 'string'
                    ? JSON.parse(v.mockup_print_area)
                    : v.mockup_print_area;
            } catch { }
        }

        const variantRatio = dims ? dims.width / dims.height : null;
        const orientationMatch = variantMatchesOrientationStrict(v, isPortrait, tolerance);
        const diff = variantRatio ? Math.abs(variantRatio - targetRatio) / targetRatio : null;

        console.log(`\n[${v.id}] ${v.name}`);
        console.log(`  Dimensions parsed: ${dims ? `${dims.width}x${dims.height}` : 'N/A'}`);
        console.log(`  Variant Ratio: ${variantRatio?.toFixed(3) || 'N/A'}`);
        console.log(`  Has Template: ${hasTemplate}`);
        console.log(`  Print Area: ${printArea ? JSON.stringify(printArea) : 'NULL'}`);
        console.log(`  Orientation Match (Strict): ${orientationMatch}`);
        console.log(`  Ratio Diff from Target: ${diff !== null ? (diff * 100).toFixed(1) + '%' : 'N/A'}`);
    });

    // 4. Find the expected winner
    console.log('\n--- Expected Selection ---');
    const candidatesWithTemplate = variants?.filter((v: any) => v.mockup_template_url) || [];
    const strictMatches = candidatesWithTemplate.filter((v: any) =>
        variantMatchesOrientationStrict(v, isPortrait, tolerance)
    );

    console.log(`Variants with template: ${candidatesWithTemplate.length}`);
    console.log(`Strict orientation matches: ${strictMatches.length}`);

    const pool = strictMatches.length > 0 ? strictMatches : candidatesWithTemplate;
    console.log(`Pool for selection: ${pool.length} variants`);

    let best: any = null;
    let minDiff = Infinity;

    for (const v of pool) {
        const dims = parseVariantDimensions(v.name);
        if (!dims) continue;
        const variantRatio = dims.width / dims.height;
        const diff = Math.abs(variantRatio - targetRatio) / targetRatio;
        if (diff < minDiff) {
            minDiff = diff;
            best = v;
        }
    }

    if (best) {
        console.log(`\nSelected: [${best.id}] ${best.name} (diff=${(minDiff * 100).toFixed(1)}%)`);
    } else {
        console.log('\nNo variant selected!');
    }
}

diagnoseCanvasVariants().catch(console.error);
