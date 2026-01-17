
require('dotenv').config({ path: '.env' });
const { printful } = require('./lib/printful/client');
const fs = require('fs');

async function run() {
    const logBuffer = [];
    const log = (...args) => {
        console.log(...args);
        logBuffer.push(args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' '));
    };

    const productId = 1419;

    if (!process.env.PRINTFUL_API_KEY) {
        log("FATAL: PRINTFUL_API_KEY is missing");
        fs.writeFileSync('reproduce_log.txt', logBuffer.join('\n'));
        return;
    }

    try {
        log(`Fetching variants for Product ${productId}...`);
        const variantsRes = await fetch(`https://api.printful.com/products/${productId}`, {
            headers: { 'Authorization': `Bearer ${process.env.PRINTFUL_API_KEY}` }
        });
        const variantsData = await variantsRes.json();
        const variantId = variantsData.result.variants[0].id; // 33980 Usually
        log(`Using Variant ID: ${variantId}`);

        const MAGENTA_PLACEHOLDER = 'https://cdhewcjfrghjhenztwdq.supabase.co/storage/v1/object/public/placeholder-templates/magenta-placeholder-4000x4000.png';

        // Now we use the Wrapper function `createMockupTask` which should handle the error and retry
        // We INTENTIONALLY pass 'front' (or allow it to default/detect to front) to trigger the retry logic
        log(`\nCalling printful.createMockupTask with placement: "front" (expecting retry to front_dtfabric)...`);

        try {
            const task = await printful.createMockupTask({
                variant_ids: [variantId],
                format: 'png',
                files: [{
                    placement: 'front', // This will fail initially, then wrapper should retry with front_dtfabric
                    image_url: MAGENTA_PLACEHOLDER
                }]
            });
            log(`SUCCESS: Task created! Task Key: ${task.task_key}`);
        } catch (err) {
            log(`FAILED: wrapper call failed with error: ${err.message}`);
        }

    } catch (e) {
        log(e);
    }

    fs.writeFileSync('reproduce_log.txt', logBuffer.join('\n'));
}

run();
