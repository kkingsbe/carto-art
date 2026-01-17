
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import sharp from 'sharp';

dotenv.config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkStorage() {
    console.log('Checking Supabase Storage...');

    // 1. Check if bucket exists
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();

    if (bucketError) {
        console.error('Error listing buckets:', bucketError);
        return;
    }

    const printFilesBucket = buckets.find(b => b.name === 'print-files');
    if (!printFilesBucket) {
        console.error('❌ Bucket "print-files" NOT found!');
        console.log('Available buckets:', buckets.map(b => b.name).join(', '));
    } else {
        console.log('✅ Bucket "print-files" found.');
        console.log('Public:', printFilesBucket.public);
    }

    // 2. Try to upload a test file
    try {
        const testBuffer = await sharp({
            create: {
                width: 100,
                height: 100,
                channels: 4,
                background: { r: 255, g: 0, b: 0, alpha: 1 }
            }
        })
            .png()
            .toBuffer();

        const filename = `test-upload-${Date.now()}.png`;
        const path = `printful/${filename}`;

        console.log(`Attempting to upload ${filename} to print-files/printful/...`);

        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('print-files')
            .upload(path, testBuffer, {
                contentType: 'image/png',
                upsert: true
            });

        if (uploadError) {
            console.error('❌ Upload failed:', uploadError);
        } else {
            console.log('✅ Upload successful:', uploadData);

            const { data: { publicUrl } } = supabase.storage
                .from('print-files')
                .getPublicUrl(path);

            console.log('Public URL:', publicUrl);
        }

    } catch (e) {
        console.error('Error during test upload:', e);
    }
}

checkStorage();
