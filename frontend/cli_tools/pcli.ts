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
    'check-products-integrity': async () => {
        const { checkProductsIntegrity } = await import('./check-products-integrity');
        await checkProductsIntegrity();
    },
    'view-feedback': async () => {
        const { viewFeedback } = await import('./view-feedback');
        await viewFeedback();
    },
    'test-local-upload': async () => {
        const { testLocalUpload } = await import('./test-local-upload');
        await testLocalUpload();
    },
    'help': async () => {
        printHelp();
    },
    'check-paywall-stats': async () => {
        const { checkPaywallStats } = await import('./check_paywall_stats');
        await checkPaywallStats();
    },
    'check-subscribers': async () => {
        const { checkNewSubscribers } = await import('./check_new_subscribers');
        await checkNewSubscribers();
    },
    'db:inspect': async (args) => {
        const table = args[0];
        if (!table) {
            console.error('Usage: db:inspect <table> [limit] [--json]');
            return;
        }
        const json = args.includes('--json');
        const limitIndex = args.findIndex(arg => !arg.startsWith('--') && arg !== table);
        const limit = limitIndex !== -1 ? parseInt(args[limitIndex]) : 20;

        const { inspectTable } = await import('./db-utils');
        await inspectTable(table, limit, json);
    },
    'db:get': async (args) => {
        const table = args[0];
        const id = args[1];
        if (!table || !id) {
            console.error('Usage: db:get <table> <id> [--json]');
            return;
        }
        const json = args.includes('--json');
        const { getRow } = await import('./db-utils');
        await getRow(table, id, json);
    },
    'db:rpc': async (args) => {
        const func = args[0];
        if (!func) {
            console.error('Usage: db:rpc <function> [key=value]... [--json]');
            return;
        }
        const json = args.includes('--json');
        const rpcArgs: Record<string, any> = {};

        // Parse key=value arguments
        for (const arg of args.slice(1)) {
            if (arg.startsWith('--')) continue;
            const [key, value] = arg.split('=');
            if (key && value) {
                // Try to parse basic types
                if (value === 'true') rpcArgs[key] = true;
                else if (value === 'false') rpcArgs[key] = false;
                else if (!isNaN(Number(value))) rpcArgs[key] = Number(value);
                else rpcArgs[key] = value;
            }
        }

        const { callRpc } = await import('./db-utils');
        await callRpc(func, rpcArgs, json);
    },

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

  inspect <variantId>    Fetch and display DB vs Printful API data for a variant.
  verify-templates       Scan DB for products with missing/incorrect templates.
  check-site-config      Check the site_config table in Supabase.
  check-variants-schema  Check schema for product_variants table.
  check-feature-flags    Check schema for feature_flags table.
  check-products-integrity Check for orphaned variants and bad product links.
  view-feedback          View recent user feedback.
  test-local-upload      Test local upload endpoint (requires dev server).
  db:inspect <table> [limit] [--json] View table rows.
  db:get <table> <id> [--json]        Fetch row by ID.
  db:rpc <func> [k=v]... [--json]     Call Supabase RPC.
  check-paywall-stats                 Show users who hit the paywall in last 24h.
  check-subscribers                   Show new subscribers in last 24h.
  help                                Show this help message.
`);
}

// Placeholder implementations
// Moved imports to dynamic to ensure dotenv loads first

async function getSupabase() {
    const { getSupabase } = await import('./db-utils');
    return getSupabase();
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
        const pfVariant = await printful.getVariant(dbVariant?.id || variantId);
        // Logic check: The CLI arg is DB ID or Printful ID? We are using DB ID as fallback.

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
    const { data: variants, error } = await supabase
        .from('product_variants')
        .select('id, name, mockup_template_url');

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
