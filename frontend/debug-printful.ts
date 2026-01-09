
require('dotenv').config({ path: '.env' });
const { printful } = require('./lib/printful/client');

async function main() {
    const productId = 614;
    try {
        console.log(`Fetching templates for product ${productId}...`);
        const templatesRes = await fetch(`https://api.printful.com/mockup-generator/templates/${productId}`, {
            headers: { 'Authorization': `Bearer ${process.env.PRINTFUL_API_KEY}` }
        });

        if (!templatesRes.ok) {
            console.error('Failed to fetch templates:', templatesRes.status, await templatesRes.text());
            return;
        }

        const data = await templatesRes.json();
        console.log('Templates:', JSON.stringify(data.result.templates, null, 2));

        // Also fetch variant info to see what we are dealing with
        console.log('Fetching variants...');
        const variantsRes = await fetch(`https://api.printful.com/products/${productId}`, {
            headers: { 'Authorization': `Bearer ${process.env.PRINTFUL_API_KEY}` }
        });
        const variantsData = await variantsRes.json();
        const variant = variantsData.result.variants.find((v: any) => v.id === 33974) || variantsData.result.variants[0];
        console.log('Target Variant:', JSON.stringify(variant, null, 2));

    } catch (e) {
        console.error(e);
    }
}

main();
