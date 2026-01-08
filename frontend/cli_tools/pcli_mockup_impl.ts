

export async function handleGenerateMockup(variantId: number, imageUrl?: string) {
    console.log(`Generating mockup for Variant ID: ${variantId}`);
    const { printful } = await import('../lib/printful/client');

    // Default magenta placeholder if no image provided
    const MAGENTA_PLACEHOLDER = 'https://cdhewcjfrghjhenztwdq.supabase.co/storage/v1/object/public/placeholder-templates/magenta-placeholder-4000x4000.png';
    const finalImageUrl = imageUrl || MAGENTA_PLACEHOLDER;

    try {
        console.log(`Using Image: ${finalImageUrl}`);
        console.log("Creating task...");

        const task = await printful.createMockupTask({
            variant_ids: [variantId],
            format: 'jpg',
            files: [
                {
                    placement: 'default',
                    image_url: finalImageUrl
                }
            ]
        });

        console.log(`Task created! Task Key: ${task.task_key}`);
        console.log("Polling for results...");

        // Poll logic
        let attempts = 0;
        while (attempts < 30) {
            await new Promise(r => setTimeout(r, 2000));
            const result = await printful.getMockupTask(task.task_key);

            if (result.status === 'completed') {
                console.log("\n[COMPLETED]");
                console.log("Mockups:");
                result.mockups.forEach((m: any) => {
                    console.log(`- Placement: ${m.placement}`);
                    console.log(`  URL: ${m.mockup_url}`);
                });
                return;
            } else if (result.status === 'failed') {
                console.log("\n[FAILED]");
                console.error(result.error || "Unknown error");
                return;
            }

            process.stdout.write('.');
            attempts++;
        }
        console.log("\nTimeout waiting for task completion.");

    } catch (e) {
        console.error("Error generating mockup:", e);
    }
}
