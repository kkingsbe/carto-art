
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

export async function checkDb() {
    // Load env vars
    dotenv.config({ path: path.join(__dirname, '../.env') });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    // Try to use service role key if available for better access, but anon might suffer RLS
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
        console.error('Missing Supabase credentials');
        return;
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data, error } = await supabase.from('feature_flags').select('*').limit(1);
    if (error) {
        console.error('Error:', error);
    } else {
        // console.log('Data:', data);
        if (data && data.length > 0) {
            console.log('Columns:', Object.keys(data[0]));
        } else {
            console.log('No data found, cannot infer columns easily via select *');
        }
    }
}

if (typeof require !== 'undefined' && typeof module !== 'undefined' && require.main === module) {
    checkDb();
}
