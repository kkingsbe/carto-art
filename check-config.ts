
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, 'frontend', '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function check() {
    console.log("Checking site_config...");
    const { data, error } = await supabase.from('site_config').select('*');
    if (error) {
        console.error('Error fetching site_config:', error);
    } else {
        console.table(data);
    }
}

check();
