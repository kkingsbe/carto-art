const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: 'frontend/.env' });

async function checkThumbnail() {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    const { data, error } = await supabase
        .from('maps')
        .select('id, title, thumbnail_url')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    if (error) {
        console.error('Error fetching map:', error);
        return;
    }

    console.log('Latest Map:');
    console.log(JSON.stringify(data, null, 2));

    if (data.thumbnail_url) {
        console.log('\n✅ Thumbnail successfully generated and updated!');
    } else {
        console.log('\n❌ Thumbnail is still null. Waiting...');
    }
}

checkThumbnail();
