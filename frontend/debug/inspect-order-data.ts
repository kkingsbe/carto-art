import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load envs
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// Try to find the service role key
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

console.error('URL:', supabaseUrl ? 'Found' : 'Missing');
console.error('Key:', supabaseKey ? 'Found' : 'Missing');

if (!supabaseUrl) {
    console.error('Missing URL. Please check .env');
    process.exit(1);
}

if (!supabaseKey) {
    console.error('Missing KEY. Keys found in env:', Object.keys(process.env).filter(k => k.includes('KEY')));
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

export async function inspectOrderData() {
    // Get latest 5 orders
    const { data: orders, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error('Supabase Error:', error);
        return;
    }

    if (!orders) {
        console.error('No orders found');
        return;
    }

    console.error(`Found ${orders.length} orders. Inspecting design_ids...`);

    orders.forEach((order: any) => {
        console.error(`Order ${order.id}:`);
        console.error(`  - status: ${order.status}`);
        console.error(`  - design_id: "${order.design_id}" (type: ${typeof order.design_id})`);
        console.error(`  - printful_order_id: ${order.printful_order_id}`);
        console.error('---');
    });

    // Test getFile for the known ID
    const fileId = 926130141; // Using number
    console.error(`Testing getFile(${fileId})...`);

    // We need to fetch it manually because we can't easily import the client here without complex setup
    // But wait, we have the API key in env
    const apiKey = process.env.PRINTFUL_API_KEY;
    if (apiKey) {
        try {
            const res = await fetch(`https://api.printful.com/files/${fileId}`, {
                headers: { 'Authorization': `Bearer ${apiKey}` }
            });
            if (res.ok) {
                const data = await res.json();
                console.error('getFile result:', JSON.stringify(data.result, null, 2));
            } else {
                console.error('getFile failed:', res.status, res.statusText);
            }
        } catch (e) {
            console.error('getFile error:', e);
        }
    } else {
        console.error('No PRINTFUL_API_KEY found');
    }
}

inspectOrderData().catch(console.error);
