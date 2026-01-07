import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { printful } from '@/lib/printful/client';

const mockupSchema = z.object({
    variant_id: z.number(),
    image_url: z.string().url(),
});

export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { variant_id, image_url } = mockupSchema.parse(body);

        // 1. Create Mockup Task
        // We use the variant_id as the "product_id" parameter if possible, or we need to map it.
        // Printful API allows creating tasks. 
        // We really need the Product ID (e.g. 71). 
        // For now, let's assume valid variant_id works or we have a mapping. 
        // In our case, Carto Art primarily sells Framed Posters (Enhanced Matte Paper Framed Poster).
        // The Product ID for that is usually static (e.g. 71 or similar).
        // Let's rely on the variant_id. As per docs: "POST /mockup-generator/create-task/{id}" 
        // "The ID of the product or variant". So variant_id should work!

        const task = await printful.createMockupTask({
            variant_ids: [variant_id],
            format: 'jpg',
            files: [
                {
                    placement: 'default',
                    image_url: image_url
                }
            ]
        });

        const taskKey = task.task_key;

        // 2. Poll for completion (Simple polling)
        // In a real production app we might return the task key and let client poll, 
        // but for simplicity/speed let's poll here up to a limit.
        let attempts = 0;
        const maxAttempts = 10;

        while (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s

            const result = await printful.getMockupTask(taskKey);

            if (result.status === 'completed') {
                // Find the mockup for our variant
                const mockup = result.mockups.find((m: any) => m.variant_id === variant_id);
                // Return the first "mockup_url" or "extra" 
                // Usually comes in 'mockups' array.
                // Let's verify structure. result.mockups is array of { variant_id, placement, mockup_url, ... }
                if (mockup) {
                    return NextResponse.json({ mockup_url: mockup.mockup_url });
                }
                // If not found specific, maybe return first
                if (result.mockups.length > 0) {
                    return NextResponse.json({ mockup_url: result.mockups[0].mockup_url });
                }
            } else if (result.status === 'failed') {
                console.error('Mockup generation failed result:', JSON.stringify(result, null, 2));
                const errorMessage = result.error || 'Mockup generation failed';
                throw new Error(errorMessage);
            }

            attempts++;
        }

        throw new Error('Mockup generation timed out');

    } catch (error: any) {
        console.error('Mockup API Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
