import { createClient } from '@/lib/supabase/server';

export default async function AdminDebugProductPage({ params }: { params: { id: string } }) {
    const { id } = await params;
    const supabase = await createClient();

    const { data: variants, error } = await supabase
        .from('product_variants')
        .select('*')
        .eq('product_id', id);

    if (error) {
        return <pre>{JSON.stringify(error, null, 2)}</pre>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Product Data</h1>
                <p className="text-gray-500 dark:text-gray-400">
                    View variants for product {id}
                </p>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-lg border p-4">
                <pre className="whitespace-pre-wrap text-xs">
                    {JSON.stringify(variants, null, 2)}
                </pre>
            </div>
        </div>
    );
}
