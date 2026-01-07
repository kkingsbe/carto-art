
import { config } from 'dotenv';
import path from 'path';
config({ path: path.join(__dirname, '.env') });

// Hack to handle relative imports if we run this with tsx from frontend root
import { printful } from './lib/printful/client';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials in .env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    console.log("Fetching variants...");
    const { data: variants, error } = await supabase.from('product_variants').select('*').limit(1);

    if (error) {
        console.error("Supabase error:", error);
        return;
    }

    if (!variants || variants.length === 0) {
        console.log("No variants found in DB");
        return;
    }
    const variant = variants[0];
    const variantId = variant.id;
    console.log(`Testing with variant: ${variant.name} (ID: ${variantId})`);

    try {
        console.log("Calling createMockupTask...");
        const task = await printful.createMockupTask({
            variant_ids: [variantId],
            format: 'jpg',
            files: [
                {
                    placement: 'default',
                    image_url: 'https://placehold.co/1800x2400.png'
                }
            ]
        });
        console.log("Task created successfully:", task);
    } catch (e) {
        console.error("Test failed:", e);
    }
}

main();
