import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from frontend root
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
config({ path: path.join(__dirname, '../.env') });

const commands: Record<string, (args: string[]) => Promise<void>> = {
    'generate-mockup': async (args) => {
        const variantId = args[0];
        const imageUrl = args[1];
        if (!variantId) {
            console.error('Usage: generate-mockup <variantId> [imageUrl]');
            return;
        }
        const { handleGenerateMockup } = await import('./pcli_mockup_impl');
        await handleGenerateMockup(parseInt(variantId), imageUrl);
    },
    'inspect': async (args) => {
        const variantId = args[0];
        if (!variantId) {
            console.error('Usage: inspect <variantId>');
            return;
        }
        await inspectVariant(parseInt(variantId));
    },
    'verify-templates': async () => {
        await verifyTemplates();
    },
    'check-site-config': async () => {
        const { checkSiteConfig } = await import('./check-config');
        await checkSiteConfig();
    },
    'check-variants-schema': async () => {
        const { checkProductVariantsSchema } = await import('./check-variants-schema');
        await checkProductVariantsSchema();
    },
    'check-feature-flags': async () => {
        const { checkFeatureFlagsSchema } = await import('./check-feature-flags');
        await checkFeatureFlagsSchema();
    },
    'help': async () => {
        printHelp();
    }
};

async function main() {
    const args = process.argv.slice(2);
    // console.log("DEBUG: Args:", args); 

    const commandName = args[0];
    const commandArgs = args.slice(1);

    if (!commandName || commandName === '--help' || commandName === '-h') {
        printHelp();
        return;
    }

    const handler = commands[commandName];
    if (handler) {
        try {
            await handler(commandArgs);
        } catch (error) {
            console.error(`Error executing command ${commandName}:`, error);
            process.exit(1);
        }
    } else {
        console.error(`Unknown command: ${commandName}`);
        printHelp();
        process.exit(1);
    }
}

function printHelp() {
    console.log(`
Printful CLI Tool (pcli)

Usage:
  pcli <command> [options]

Commands:
  inspect <variantId>    Fetch and display DB vs Printful API data for a variant.
  verify-templates       Scan DB for products with missing/incorrect templates.
  check-site-config      Check the site_config table in Supabase.
  help                   Show this help message.
`);
}

// Placeholder implementations
// Moved imports to dynamic to ensure dotenv loads first

async function getSupabase() {
    // Dynamic import to avoid hoisting issues
    const { createClient } = await import('@supabase/supabase-js');

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        throw new Error("Missing Supabase credentials in .env");
    }
    return createClient(supabaseUrl, supabaseKey);
}

async function inspectVariant(variantId: number) {
    console.log(`Inspecting Variant ID: ${variantId}`);

    // Dynamic import
    const { printful } = await import('../lib/printful/client');

    // 1. Fetch from DB
    const supabase = await getSupabase();
    const { data: dbVariant, error } = await supabase
        .from('product_variants')
        .select('*')
        .eq('id', variantId)
        .single();

    if (error) {
        console.error("DB Error:", error.message);
    } else {
        console.log("\n[Database Data]");
        console.table({
            id: dbVariant.id,
            name: dbVariant.name,
            printful_id: dbVariant.printful_variant_id,
            template_url: dbVariant.mockup_template_url?.substring(0, 50) + "...",
            print_area: JSON.stringify(dbVariant.mockup_print_area)
        });
    }

    // 2. Fetch from Printful
    try {
        console.log("\n[Printful API Data]");
        const pfVariant = await printful.getVariant(dbVariant?.printful_variant_id || variantId); // Fallback if DB fetch failed but user provided ID might be printful ID? No, CLI arg is likely DB ID. 
        // Logic check: The CLI arg is DB ID or Printful ID? Let's assume DB ID first.

        console.log("Variant Info:", pfVariant.variant.name);
        console.log("Product ID:", pfVariant.variant.product_id);
    } catch (e) {
        console.error("Printful API Error:", e instanceof Error ? e.message : e);
    }
}

async function verifyTemplates() {
    console.log("Verifying templates...");
    const supabase = await getSupabase();

    // Fetch all variants
    // Note: If too many, might need pagination, but for now select all
    const { data: variants, error } = await supabase
        .from('product_variants')
        .select('id, name, mockup_template_url, printful_variant_id');

    if (error) {
        console.error("Failed to fetch variants:", error.message);
        return;
    }

    let missingCount = 0;
    let apiTemplateCount = 0;
    let goodCount = 0;

    console.log(`Scanning ${variants.length} variants...`);

    for (const v of variants) {
        if (!v.mockup_template_url) {
            missingCount++;
            // console.log(`[MISSING] ID ${v.id} (${v.name})`);
        } else if (v.mockup_template_url.includes('api-template')) {
            apiTemplateCount++;
            console.log(`[BAD-URL] ID ${v.id} (${v.name}): ${v.mockup_template_url.substring(0, 60)}...`);
        } else {
            goodCount++;
        }
    }

    console.log("\n--- Report ---");
    console.log(`Total Variants: ${variants.length}`);
    console.log(`Good Templates: ${goodCount}`);
    console.log(`Missing Templates: ${missingCount}`);
    console.log(`Bad (API) Templates: ${apiTemplateCount}`);

    if (missingCount > 0 || apiTemplateCount > 0) {
        console.log("\nRun 'pcli generate-mockup <id>' to fix specific variants.");
    }
}

main().catch(console.error);
