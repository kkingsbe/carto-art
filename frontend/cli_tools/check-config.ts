import { createClient } from '@supabase/supabase-js';

export async function checkSiteConfig() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!supabaseUrl || !supabaseServiceKey) {
        console.error("Missing Supabase credentials. Ensure .env is loaded.");
        return;
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Checking site_config...");
    const { data, error } = await supabase.from('site_config').select('*');
    if (error) {
        console.error('Error fetching site_config:', error);
    } else {
        console.table(data);
    }
}
