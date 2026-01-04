
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Try to use service role key if available for better access, but anon might suffer RLS
// Checking .env content might be good, but I'll assume anon key is there.
// If I need admin access I might need the service role key which is usually SUPABASE_SERVICE_ROLE_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey!);

async function check() {
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

check();
