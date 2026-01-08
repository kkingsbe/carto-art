import dotenv from 'dotenv';
import path from 'path';

// Define minimal types for the response derivation structure we care about
interface Template {
    template_id: number;
    print_area_width: number;
    print_area_height: number;
    image_url: string;
    placement: string;
    background_color: string;
}

export async function inspectTemplates() {
    dotenv.config({ path: path.join(__dirname, '../.env') });

    // Printful API Key
    const apiKey = process.env.PRINTFUL_API_KEY;
    if (!apiKey) {
        console.error('Missing PRINTFUL_API_KEY');
        if (typeof require !== 'undefined' && typeof module !== 'undefined' && require.main === module) process.exit(1);
        return;
    }

    const productId = 3;
    console.log(`Inspecting templates for Product ID: ${productId}`);

    try {
        const res = await fetch(`https://api.printful.com/mockup-generator/templates/${productId}`, {
            headers: { 'Authorization': `Bearer ${apiKey}` }
        });

        if (!res.ok) {
            console.error('API Error:', res.statusText);
            const txt = await res.text();
            console.error(txt);
            return;
        }

        const data = await res.json();
        const templates: Template[] = data.result.templates;

        console.log(`Found ${templates.length} templates.`);

        let found = false;
        templates.forEach(t => {
            // Filter for 12x36 size or similar aspect ratio (1:3)
            const ratio = t.print_area_width / t.print_area_height;
            if (Math.abs(ratio - (1 / 3)) < 0.1 || Math.abs(ratio - 3) < 0.1) {
                console.log(`MATCHING TEMPLATE: ID: ${t.template_id}, W: ${t.print_area_width}, H: ${t.print_area_height}`);
                console.log(`   URL: ${t.image_url}`);
                console.log(`   Placement: ${t.placement}, Background: ${t.background_color}`);
                found = true;
            }
        });

        if (!found) {
            console.log('No specific 1:3 templates found. Listing all...');
            templates.forEach(t => {
                console.log(`ID: ${t.template_id}, Width: ${t.print_area_width}, Height: ${t.print_area_height}, URL: ${t.image_url}`);
            });
        }

        return templates;

    } catch (e) {
        console.error(e);
        throw e;
    }
}

if (typeof require !== 'undefined' && typeof module !== 'undefined' && require.main === module) {
    inspectTemplates();
}
