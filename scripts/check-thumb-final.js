const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: 'frontend/.env' });

async function checkThumbnail() {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    const { data, error } = await supabase
        .from('maps')
        .select('id, title, thumbnail_url')
        .eq('id', 'a7580c17-ede5-40c0-976b-0fb7aeefc1e6')
        .single();

    if (error) {
        console.error('Error fetching map:', error);
        process.exit(1);
    }

    console.log('Verification Result:');
    console.log(JSON.stringify(data, null, 2));
    process.exit(0);
}

checkThumbnail();
