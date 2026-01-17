-- Setup storage bucket for Printful uploads
-- This migration ensures that print-files bucket exists and has proper policies

-- Insert storage bucket (if it doesn't exist)
-- Note: This may need to be run manually in Supabase dashboard if bucket doesn't exist
-- The bucket name 'print-files' is used for Printful uploads and design uploads

-- Create storage policies for print-files bucket
-- These policies allow authenticated users to upload and read files
-- The service role client (used in Printful upload endpoint) bypasses RLS

-- Allow public read access to all files in bucket
CREATE POLICY IF NOT EXISTS "Allow public read access"
ON storage.objects FOR SELECT
TO anon
USING (bucket_id = 'print-files');

-- Allow authenticated users to upload files
CREATE POLICY IF NOT EXISTS "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'print-files');

-- Allow authenticated users to update files
CREATE POLICY IF NOT EXISTS "Allow authenticated updates"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'print-files')
WITH CHECK (bucket_id = 'print-files');

-- Allow authenticated users to delete their own files
CREATE POLICY IF NOT EXISTS "Allow authenticated deletes"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'print-files');

-- Grant necessary permissions
GRANT USAGE ON SCHEMA storage TO authenticated, anon;
GRANT ALL ON storage.objects TO authenticated, anon;
GRANT ALL ON storage.buckets TO authenticated, anon;

-- Note: If the 'print-files' bucket doesn't exist, you need to create it manually:
-- 1. Go to Storage in your Supabase dashboard
-- 2. Create a new bucket named 'print-files'
-- 3. Set it to Public bucket
-- 4. Optionally configure file size limits (recommended: 5MB max)
