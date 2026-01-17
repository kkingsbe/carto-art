/**
 * Test script to verify Printful storage bucket setup
 * Run with: npx tsx test-printful-storage.ts
 */

import { createServiceRoleClient } from './lib/supabase/server';

async function testPrintfulStorage() {
    console.log('Testing Printful storage bucket setup...\n');

    try {
        const adminSupabase = createServiceRoleClient();

        // Test 1: Check if bucket exists
        console.log('Test 1: Checking if print-files bucket exists...');
        const { data: buckets, error: bucketsError } = await adminSupabase.storage.listBuckets();

        if (bucketsError) {
            console.error('❌ Failed to list buckets:', bucketsError);
            return;
        }

        const printFilesBucket = buckets?.find(b => b.name === 'print-files');
        if (!printFilesBucket) {
            console.error('❌ print-files bucket not found!');
            console.log('   Available buckets:', buckets?.map(b => b.name).join(', ') || 'none');
            console.log('\n   Please create the bucket manually in Supabase dashboard:');
            console.log('   1. Go to Storage in your Supabase dashboard');
            console.log('   2. Create a new bucket named "print-files"');
            console.log('   3. Set it to Public bucket');
            return;
        }

        console.log('✅ print-files bucket exists');
        console.log(`   Public: ${printFilesBucket.public}`);
        console.log(`   File size limit: ${printFilesBucket.file_size_limit || 'none'}`);

        // Test 2: Try to upload a test file
        console.log('\nTest 2: Testing file upload...');
        const testBuffer = Buffer.from('test image data');
        const testPath = `printful/test-${Date.now()}.txt`;

        const { error: uploadError } = await adminSupabase.storage
            .from('print-files')
            .upload(testPath, testBuffer, {
                contentType: 'text/plain',
                upsert: true
            });

        if (uploadError) {
            console.error('❌ Upload failed:', uploadError);
            return;
        }

        console.log('✅ Upload successful');

        // Test 3: Get public URL
        console.log('\nTest 3: Getting public URL...');
        const { data: { publicUrl } } = adminSupabase.storage
            .from('print-files')
            .getPublicUrl(testPath);

        console.log('✅ Public URL generated:', publicUrl);

        // Test 4: Clean up test file
        console.log('\nTest 4: Cleaning up test file...');
        const { error: deleteError } = await adminSupabase.storage
            .from('print-files')
            .remove([testPath]);

        if (deleteError) {
            console.warn('⚠️  Failed to delete test file:', deleteError);
        } else {
            console.log('✅ Test file deleted');
        }

        console.log('\n✅ All tests passed! Printful storage is properly configured.');

    } catch (error) {
        console.error('\n❌ Test failed with error:', error);
    }
}

testPrintfulStorage();
