
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
    console.error('Missing env vars');
    process.exit(1);
}

async function run() {
    console.log('--- Testing Anonymous Client ---');
    const anonClient = createClient(supabaseUrl!, supabaseAnonKey!);

    const { data: anonVariants, error: anonError } = await anonClient
        .from('product_variants')
        .select('id, name, mockup_template_url, is_active')
        .eq('is_active', true);

    if (anonError) console.error('Anon Error:', anonError);
    else {
        console.log(`Anon: Found ${anonVariants.length} variants`);
        anonVariants.forEach(v => {
            console.log(`[Anon] ID: ${v.id}, Name: ${v.name}, URL: ${v.mockup_template_url?.substring(0, 50)}...`);
        });
    }

    console.log('\n--- Testing Admin/Service Client ---');
    const adminClient = createClient(supabaseUrl!, supabaseServiceKey!);

    const { data: adminVariants, error: adminError } = await adminClient
        .from('product_variants')
        .select('id, name, mockup_template_url, is_active')
        .eq('is_active', true);

    if (adminError) console.error('Admin Error:', adminError);
    else {
        console.log(`Admin: Found ${adminVariants.length} variants`);
        adminVariants.forEach(v => {
            // Compare with Anon
            const anonVariant = anonVariants?.find(av => av.id === v.id);
            if (!anonVariant) {
                console.log(`[Diff] ID ${v.id} is missing in Anon results!`);
            } else if (anonVariant.mockup_template_url !== v.mockup_template_url) {
                console.log(`[Diff] ID ${v.id} URL mismatch!`);
                console.log(`  Anon:  ${anonVariant.mockup_template_url}`);
                console.log(`  Admin: ${v.mockup_template_url}`);
            } else {
                console.log(`[Match] ID ${v.id} URLs match.`);
            }
        });
    }
}

run();
