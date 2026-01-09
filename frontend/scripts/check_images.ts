import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
    const { data: variants } = await supabase
        .from('product_variants')
        .select('id, name, image_url')
        .eq('product_id', 3)
        .limit(5);

    console.log('Variant Image URLs:');
    variants?.forEach(v => {
        console.log(`${v.name}: ${v.image_url}`);
    });
}

main();
