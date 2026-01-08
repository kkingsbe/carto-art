
import { createClient } from '@/lib/supabase/server';

export default async function DebugProductPage({ params }: { params: { id: string } }) {
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
        <div className="p-4">
            <h1>Variants for Product {id}</h1>
            <pre className="whitespace-pre-wrap text-xs">
                {JSON.stringify(variants, null, 2)}
            </pre>
        </div>
    );
}
