import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import sharp from 'sharp';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
    // 1. Fetch variants for Product 3 (assuming product_id = 3)
    const { data: variants, error } = await supabase
        .from('product_variants')
        .select('*')
        .eq('product_id', 3);

    if (error) {
        console.error('Error fetching variants:', error);
        return;
    }

    console.log(`Found ${variants.length} variants for Product 3.`);

    for (const v of variants) {
        console.log(`\nVARIANT ID: ${v.id} | NAME: ${v.name}`);
        console.log(`Template URL: ${v.mockup_template_url}`);
        console.log(`Print Area: ${JSON.stringify(v.mockup_print_area)}`);

        if (v.mockup_template_url) {
            try {
                const response = await fetch(v.mockup_template_url);
                if (!response.ok) {
                    console.error(`Failed to fetch template: ${response.statusText}`);
                    continue;
                }
                const buffer = Buffer.from(await response.arrayBuffer());
                const img = sharp(buffer);
                const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });

                // Sample center of print area to see what color it is
                let area = v.mockup_print_area;
                if (typeof area === 'string') area = JSON.parse(area);

                if (area && area.width) {
                    const cx = Math.floor((area.x + area.width / 2) * info.width);
                    const cy = Math.floor((area.y + area.height / 2) * info.height);

                    // Safe bounds
                    const x = Math.max(0, Math.min(cx, info.width - 1));
                    const y = Math.max(0, Math.min(cy, info.height - 1));

                    const offset = (y * info.width + x) * info.channels;
                    const r = data[offset];
                    const g = data[offset + 1];
                    const b = data[offset + 2];

                    console.log(`Center Pixel (${x}, ${y}): R=${r} G=${g} B=${b}`);

                    // Check for magenta
                    const isMagenta = r > 200 && g < 100 && b > 200;
                    console.log(`Is Magenta-ish? ${isMagenta}`);
                }
            } catch (e) {
                console.error(`Error analyzing image:`, e);
            }
        }
    }
}

main();
