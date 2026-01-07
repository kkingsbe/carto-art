import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

export async function GET() {
    const supabase = createServiceRoleClient();

    // Check orders
    const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

    // Check variants to verify DB content
    const { data: variants, error: variantsError } = await supabase
        .from('product_variants')
        .select('*')
        .limit(1);

    return NextResponse.json({
        orders,
        ordersError,
        variants,
        variantsError
    });
}
