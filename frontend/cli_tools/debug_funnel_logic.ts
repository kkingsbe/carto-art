
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

// Create client exactly like createServiceRoleClient
const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function debugFunnel() {
    console.log('--- Debugging Funnel Logic (With Fix) ---');

    // 30 day window logic
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const startTime = thirtyDaysAgo.toISOString();

    // Replicate the 'exportEvents' query WITH THE FIX
    console.log('Executing query with .not("session_id", "is", null)...');
    const { data: exportEvents, error, count } = await supabase
        .from('page_events')
        .select('session_id', { count: 'exact' })
        .eq('event_type', 'poster_export')
        .gte('created_at', startTime)
        .not('session_id', 'is', null); // <--- THE FIX

    if (error) {
        console.error('Query Error:', error);
        return;
    }

    console.log(`Query returned ${exportEvents?.length} rows.`);

    // Helper to count unique sessions
    const countUnique = (data: { session_id: string | null }[] | null) => {
        if (!data) return 0;
        const unique = new Set(data.map(d => d.session_id).filter(Boolean));
        return unique.size;
    };

    const uniqueCount = countUnique(exportEvents);
    console.log('Unique Session Count:', uniqueCount);

    if (uniqueCount > 0) {
        console.log('SUCCESS: Fix verified. We are now counting unique sessions correctly.');
    } else {
        console.log('FAILURE: Still seeing 0 unique sessions.');
    }
}

debugFunnel();
