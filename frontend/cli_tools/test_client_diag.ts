import { printful } from '../lib/printful/client';
import dotenv from 'dotenv';
import path from 'path';

export async function testClient() {
    // Load .env from frontend root
    dotenv.config({ path: path.join(__dirname, '../.env') });

    console.log('Testing createMockupTask via client.ts...');

    // Variant 19301 is Canvas 12x36
    const variantId = 19301;
    const MAGENTA_PLACEHOLDER = 'https://cdhewcjfrghjhenztwdq.supabase.co/storage/v1/object/public/placeholder-templates/magenta-placeholder-4000x4000.png';

    try {
        const result = await printful.createMockupTask({
            variant_ids: [variantId],
            format: 'png',
            files: [{
                placement: 'default',
                image_url: MAGENTA_PLACEHOLDER
            }]
        });

        console.log('Task Result:', result);
    } catch (e) {
        console.error('Test Error:', e);
    }
}

if (typeof require !== 'undefined' && typeof module !== 'undefined' && require.main === module) {
    testClient();
}
