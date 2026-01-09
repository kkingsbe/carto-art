
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
const envPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: envPath });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

async function debugFunnelLimits() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const startTime = thirtyDaysAgo.toISOString();

    console.log('--- Testing High Limits ---');
    console.log('Fetching with limit(50000)...');

    const { data, error } = await supabase
        .from('page_events')
        .select('session_id')
        .eq('event_type', 'poster_export')
        .gte('created_at', startTime)
        .not('session_id', 'is', null)
        .limit(50000); // <--- Matches production fix

    if (error) { console.error(error); return; }

    console.log(`Returned rows: ${data?.length}`);

    const unique = new Set(data?.map(d => d.session_id).filter(Boolean));
    console.log(`Unique Sessions: ${unique.size}`);

    if (data && data.length > 1000) {
        console.log('SUCCESS: We fetched more than 1000 rows, limit is working!');
    } else if (data && data.length < 1000) {
        console.log('Info: Total rows are under 1000, so limit increase strictly wasn\'t needed yet, but good for safety.');
    } else {
        console.log('WARNING: Returned exactly 1000 rows. Limit might not be working or coinicidence.');
    }
}

debugFunnelLimits();
