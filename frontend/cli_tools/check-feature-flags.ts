import { createClient } from '@supabase/supabase-js';

export async function checkFeatureFlagsSchema() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
        console.error("Missing Supabase credentials");
        return;
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Checking feature_flags table...");
    const { data, error } = await supabase.from('feature_flags').select('*').limit(1);
    if (error) {
        console.error('Error:', error);
    } else {
        if (data && data.length > 0) {
            console.log('Columns:', Object.keys(data[0]));
        } else {
            console.log('No data found, cannot infer columns easily via select *');
        }
    }
}
