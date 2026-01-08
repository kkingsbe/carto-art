import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

export async function listVariants() {
    // Load .env
    dotenv.config({ path: path.join(__dirname, '../.env') });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error('Could not find Supabase URL or Key in .env');
        if (typeof require !== 'undefined' && typeof module !== 'undefined' && require.main === module) process.exit(1);
        return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Searching for "Canvas (in) (12″×36″)" and similar...');

    const { data, error } = await supabase
        .from('product_variants')
        .select('*')
        .ilike('name', '%12%36%');

    if (error) {
        console.error('Error fetching variants:', error);
    } else {
        console.log(`Found ${data.length} variants:`);
        data.forEach(v => {
            console.log('------------------------------------------------');
            console.log(`ID: ${v.id}`);
            console.log(`Product ID: ${v.product_id}`);
            console.log(`Name: ${v.name}`);
            console.log(`Template URL: ${v.mockup_template_url}`);
        });
    }
}

if (typeof require !== 'undefined' && typeof module !== 'undefined' && require.main === module) {
    listVariants();
}
