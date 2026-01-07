
import { printful } from '@/lib/printful/client';
import { createClient } from '@/lib/supabase/server';

// Mock process.env if needed, but it should be available in the environment
// We will just run this as a one-off script.

async function main() {
    console.log('Fetching products...');
    try {
        // Just fetch a few products to find a framed one
        const products = await printful.getCatalogProducts('Framed Poster');
        if (products.length === 0) {
            console.log('No framed posters found.');
            return;
        }

        const product = products[0];
        console.log(`Inspecting Product: ${product.id} - ${product.title}`);

        // Fetch templates
        const response = await fetch(`https://api.printful.com/mockup-generator/templates/${product.id}`, {
            headers: { 'Authorization': `Bearer ${process.env.PRINTFUL_API_KEY}` }
        });

        if (!response.ok) {
            console.error('Failed to fetch templates:', await response.text());
            return;
        }

        const data = await response.json();
        console.log('Templates Data Summary:');
        console.log(`Templates count: ${data.result.templates.length}`);
        console.log('First 3 templates placement:', data.result.templates.slice(0, 3).map((t: any) => t.placement));

        if (data.result.option_groups) {
            console.log('Option Groups:', JSON.stringify(data.result.option_groups, null, 2));
        }

        if (data.result.options) {
            console.log('Options:', JSON.stringify(data.result.options, null, 2));
        }

    } catch (e) {
        console.error(e);
    }
}

// We can't easily run 'server' checks here so we skip supabase/auth parts
// and just use the verify script pattern. 
// But wait, the environment variables need to be loaded.
// For now, I'll rely on nextjs environment loading or presume 'dotenv' is used.

main();
