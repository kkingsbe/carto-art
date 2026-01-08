
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

export async function debugLatency() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
        console.error('Missing Supabase credentials in environment');
        return;
    }

    const supabase = createClient(url, key);
    const now = new Date();
    const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000);

    console.log('Querying api_usage since:', sixHoursAgo.toISOString());

    const { data, error } = await supabase
        .from('api_usage')
        .select('created_at, response_time_ms')
        .gte('created_at', sixHoursAgo.toISOString())
        .not('response_time_ms', 'is', null)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching data:', error);
        return;
    }

    console.log('Found records in last 6 hours:', data.length);
    if (data.length > 0) {
        data.forEach((r, i) => {
            console.log(`[${i}] created_at: ${r.created_at}, response_time_ms: ${r.response_time_ms}`);
        });
    } else {
        // Check all records to see if there are ANY
        const { data: allData, error: allErr } = await supabase
            .from('api_usage')
            .select('created_at, response_time_ms')
            .limit(5)
            .order('created_at', { ascending: false });

        if (allErr) {
            console.error('Error fetching all data:', allErr);
        } else {
            console.log('Last 5 records in table:');
            allData.forEach((r, i) => {
                console.log(`[${i}] created_at: ${r.created_at}, response_time_ms: ${r.response_time_ms}`);
            });
        }
    }
}

if (typeof require !== 'undefined' && typeof module !== 'undefined' && require.main === module) {
    // Load environment variables from the frontend directory
    dotenv.config({ path: path.join(__dirname, '../.env') });
    dotenv.config({ path: path.join(__dirname, '../.env.local') });
    debugLatency();
}
