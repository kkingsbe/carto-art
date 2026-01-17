
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function makeBucketPublic() {
    console.log('Updating "print-files" bucket to PUBLIC...');

    const { data, error } = await supabase.storage.updateBucket('print-files', {
        public: true
    });

    if (error) {
        console.error('❌ Failed to update bucket:', error);
    } else {
        console.log('✅ Bucket updated successfully:', data);
    }

    // Verify
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucket = buckets?.find(b => b.name === 'print-files');
    console.log('Verification - Public:', bucket?.public);
}

makeBucketPublic();
