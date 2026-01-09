
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

async function inspect() {
    dotenv.config({ path: path.join(__dirname, '../.env') });

    // Dynamic import to ensure env is loaded
    const { printful } = await import('../lib/printful/client');

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!supabaseUrl || !supabaseServiceKey) {
        console.error('Missing Supabase credentials');
        return;
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('--- RECENT ORDERS ---');
    const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('id, printful_order_id, status, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

    if (ordersError) {
        console.error('Orders Error:', ordersError);
    } else {
        console.log(JSON.stringify(orders, null, 2));
    }

    console.log('\n--- RECENT CANCELLATION REQUESTS ---');
    const { data: cancellations, error: cancellationsError } = await supabase
        .from('order_cancellations')
        .select('id, order_id, status, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

    if (cancellationsError) {
        console.error('Cancellations Error:', cancellationsError);
    } else {
        console.log(JSON.stringify(cancellations, null, 2));
    }

    console.log('\n--- RECENT PRINTFUL ORDERS ---');
    try {
        const pfOrders = await printful.getOrders();
        console.log(JSON.stringify(pfOrders.slice(0, 5), null, 2));
    } catch (e) {
        console.error('Printful Error:', e);
    }
}

inspect();
