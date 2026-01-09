import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function compare() {
    // Canvas = product_id 3
    const { data: canvasVariants } = await supabase
        .from('product_variants')
        .select('id, name, mockup_print_area, mockup_template_url')
        .eq('product_id', 3)
        .eq('is_active', true)
        .order('display_order')
        .limit(8);

    // Poster = product_id 2
    const { data: posterVariants } = await supabase
        .from('product_variants')
        .select('id, name, mockup_print_area, mockup_template_url')
        .eq('product_id', 2)
        .eq('is_active', true)
        .order('display_order')
        .limit(8);

    console.log('=== CANVAS (ID=3) Sample Variants ===');
    canvasVariants?.forEach(v => {
        let pa = v.mockup_print_area;
        if (typeof pa === 'string') {
            try { pa = JSON.parse(pa); } catch { }
        }
        const isSquare = pa && Math.abs(pa.width - pa.height) < 0.01;
        console.log(`  ${v.name}`);
        console.log(`    Print Area: ${JSON.stringify(pa)}`);
        console.log(`    Is Square Print Area: ${isSquare}`);
        console.log(`    Template URL exists: ${!!v.mockup_template_url}`);
    });

    console.log('\n=== POSTER (ID=2) Sample Variants ===');
    posterVariants?.forEach(v => {
        let pa = v.mockup_print_area;
        if (typeof pa === 'string') {
            try { pa = JSON.parse(pa); } catch { }
        }
        const isSquare = pa && Math.abs(pa.width - pa.height) < 0.01;
        console.log(`  ${v.name}`);
        console.log(`    Print Area: ${JSON.stringify(pa)}`);
        console.log(`    Is Square Print Area: ${isSquare}`);
        console.log(`    Template URL exists: ${!!v.mockup_template_url}`);
    });
}

compare();
