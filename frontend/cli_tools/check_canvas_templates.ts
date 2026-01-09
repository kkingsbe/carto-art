import { printful } from './lib/printful/client';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

async function checkTemplates() {
    const productId = 3; // Canvas
    console.log(`Checking templates for Product 3 (Canvas)...`);

    // We can't call inspectVariantTemplates directly easily here, let's use the fetch logic
    const API_KEY = process.env.PRINTFUL_API_KEY;
    const response = await fetch(`https://api.printful.com/mockup-generator/templates/${productId}`, {
        headers: { 'Authorization': `Bearer ${API_KEY}` }
    });

    if (!response.ok) {
        console.error('Failed to fetch templates:', await response.text());
        return;
    }

    const data: any = await response.json();
    const templates = data.result.templates;

    console.log(`Found ${templates.length} templates:`);
    templates.forEach((t: any) => {
        const ratio = t.print_area_width / t.print_area_height;
        console.log(`  Template ID: ${t.template_id}`);
        console.log(`    Print Area: ${t.print_area_width}x${t.print_area_height} (Ratio: ${ratio.toFixed(3)})`);
        console.log(`    Placement: ${t.placement}`);
        console.log(`    Background: ${t.background_url}`);
    });
}

checkTemplates();
