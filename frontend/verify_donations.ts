
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load env vars
dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    fs.writeFileSync('verification_result.json', JSON.stringify({ error: 'Missing env vars' }));
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkDonations() {
    const { data, error, count } = await supabase
        .from('donations')
        .select('*', { count: 'exact' });

    if (error) {
        fs.writeFileSync('verification_result.json', JSON.stringify({ error: error.message }));
        return;
    }

    const result = {
        count,
        sample: data ? data.slice(0, 5) : []
    };
    fs.writeFileSync('verification_result.json', JSON.stringify(result, null, 2));
}

checkDonations();
