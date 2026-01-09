
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
const envPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: envPath });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) { console.error('Missing key'); process.exit(1); }

const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });

async function debugFunnelLimits() {
    // 30 day window logic
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const startTime = thirtyDaysAgo.toISOString();

    console.log('--- Testing Null Filter ---');
    const { data, error, count } = await supabase
        .from('page_events')
        .select('session_id, metadata', { count: 'exact' })
        .eq('event_type', 'poster_export')
        .gte('created_at', startTime)
        .not('session_id', 'is', null) // FILTER OUT NULLS
        .limit(100);

    if (error) { console.error(error); return; }

    console.log(`Total rows (count): ${count}`);
    console.log(`Returned rows: ${data.length}`);

    // Check first few
    if (data.length > 0) {
        console.log('Sample session_id:', data[0].session_id);
    } else {
        console.log('No rows returned even with null filter.');
    }
}

debugFunnelLimits();
