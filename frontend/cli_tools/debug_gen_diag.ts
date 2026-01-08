import dotenv from 'dotenv';
import path from 'path';

export async function debugGeneration() {
    dotenv.config({ path: path.join(__dirname, '../.env') });
    const apiKey = process.env.PRINTFUL_API_KEY;

    if (!apiKey) {
        console.error("Missing PRINTFUL_API_KEY");
        return;
    }

    // Dynamic import to handle ESM module in node
    const fetch = (await import('node-fetch')).default as unknown as typeof global.fetch;

    const variantId = 19301; // Canvas 12x36
    const MAGENTA_PLACEHOLDER = 'https://cdhewcjfrghjhenztwdq.supabase.co/storage/v1/object/public/placeholder-templates/magenta-placeholder-4000x4000.png';

    console.log(`Generating mockup for variant ${variantId}...`);

    try {
        // 1. Create Task
        const createRes = await fetch('https://api.printful.com/mockup-generator/create-task/3', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                variant_ids: [variantId],
                format: 'png',
                files: [{
                    placement: 'default',
                    image_url: MAGENTA_PLACEHOLDER
                }]
            })
        });

        const createData: any = await createRes.json();
        if (!createRes.ok) {
            console.error('Create failed:', JSON.stringify(createData, null, 2));
            return;
        }

        const taskKey = createData.result.task_key;
        console.log(`Task key: ${taskKey}`);

        // 2. Poll output
        let attempts = 0;
        while (attempts < 20) {
            await new Promise(r => setTimeout(r, 2000));
            const checkRes = await fetch(`https://api.printful.com/mockup-generator/task?task_key=${taskKey}`, {
                headers: { 'Authorization': `Bearer ${apiKey}` }
            });
            const checkData: any = await checkRes.json();

            if (checkData.result.status === 'completed') {
                console.log('COMPLETED!');
                console.log('Number of mockups returned:', checkData.result.mockups.length);
                console.log('First 3 mockups:');
                checkData.result.mockups.slice(0, 3).forEach((m: any) => {
                    console.log(`- Template ID: (unavailable in response), Placement: ${m.placement}, URL: ${m.mockup_url}`);
                    // Try to infer dimensions from URL metadata? No, URL.
                });
                return checkData.result;
            } else if (checkData.result.status === 'failed') {
                console.log('FAILED');
                return;
            }
            console.log(`Status: ${checkData.result.status}...`);
            attempts++;
        }
    } catch (e) {
        console.error(e);
    }
}

if (typeof require !== 'undefined' && typeof module !== 'undefined' && require.main === module) {
    debugGeneration();
}
