
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
    console.log('Fetching Framed Poster variants...');

    // Fetch all variants
    const { data: variants, error } = await supabase
        .from('product_variants')
        .select('*')
        .ilike('name', '%Framed Poster%')
        .order('id');

    if (error) {
        console.error('Error fetching variants:', error);
        return;
    }

    console.log(`Found ${variants.length} variants.`);

    // Group by size to compare colors
    const variantsBySize: Record<string, any[]> = {};

    variants.forEach(v => {
        // Extract size
        const match = v.name.match(/(\d+["″]?\s*[x×]\s*\d+["″]?)/);
        const size = match ? match[1] : 'Unknown';
        if (!variantsBySize[size]) variantsBySize[size] = [];
        variantsBySize[size].push(v);
    });

    Object.entries(variantsBySize).forEach(([size, vs]) => {
        console.log(`\n--- Size: ${size} ---`);
        vs.forEach(v => {
            const url = v.mockup_template_url || '';
            const name = v.name.toLowerCase();
            const urlLower = url.toLowerCase();

            let status = '✅ OK';
            let color = 'unknown';

            if (name.includes('white')) color = 'white';
            else if (name.includes('black')) color = 'black';
            else if (name.includes('oak') || name.includes('wood')) color = 'oak/wood';

            // Check consistency
            if (color === 'white' && !urlLower.includes('white')) {
                status = '❌ MISMATCH (Expected white in URL)';
            } else if (color === 'black' && !urlLower.includes('black')) {
                status = '❌ MISMATCH (Expected black in URL)';
            }

            console.log(`ID: ${v.id}, Name: ${v.name}`);
            console.log(`   Mockup: ${url}`);
            console.log(`   Status: ${status}`);
        });

        // Check for duplicates
        const urls = vs.map(v => v.mockup_template_url);
        const uniqueUrls = new Set(urls);
        if (uniqueUrls.size < urls.length) {
            console.log('   WARNING: Some variants share the same mockup URL!');
            // Find which ones
            const urlToNames: Record<string, string[]> = {};
            vs.forEach(v => {
                const u = v.mockup_template_url || 'null';
                if (!urlToNames[u]) urlToNames[u] = [];
                urlToNames[u].push(v.name);
            });
            Object.entries(urlToNames).forEach(([u, names]) => {
                if (names.length > 1) {
                    console.log(`   URL ${u} is used by:`, names);
                }
            });
        }
    });

}

main();
