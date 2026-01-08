
import { regenerateVariantMockup } from '@/lib/actions/printful';
import { createClient } from '@/lib/supabase/server';

export default async function Regen616Page() {
    const variantIds = [
        17626, 17624, 17625, 15706, 17620,
        17621, 17623, 15701, 15702, 17622,
        15704, 15703, 15705
    ];

    const results = [];

    // Check auth first to avoid crashing mid-loop
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return <div>Unauthorized</div>;

    // We can run these sequentially to avoid rate limits / overwhelming
    // But regenerateVariantMockup creates a task and polls, which is slow.
    // Printful allows multiple tasks?
    // Let's do it sequentially.

    for (const id of variantIds) {
        try {
            console.log(`Starting regen for ${id}...`);
            const res = await regenerateVariantMockup(id);
            results.push({ id, status: 'success', ...res });
        } catch (e: any) {
            console.error(`Failed ${id}`, e);
            results.push({ id, status: 'error', error: e.message });
        }
    }

    return (
        <div className="p-4">
            <h1>Regeneration Results</h1>
            <pre className="whitespace-pre-wrap text-xs">
                {JSON.stringify(results, null, 2)}
            </pre>
        </div>
    );
}
