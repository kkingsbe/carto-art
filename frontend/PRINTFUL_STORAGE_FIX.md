# Printful Storage Bucket Fix

## Problem

The Printful upload endpoint ([`app/api/printful/upload/route.ts`](app/api/printful/upload/route.ts)) was trying to upload rotated images to a Supabase storage bucket named `'printful-uploads'`, but this bucket didn't exist. This caused a "Bucket not found" error, which forced the code to fall back to the original URL, breaking the rotation fix.

## Solution

Changed the code to use the existing `'print-files'` bucket instead of the non-existent `'printful-uploads'` bucket. The `print-files` bucket is already used for design uploads in [`app/api/upload-design/route.ts`](app/api/upload-design/route.ts:25).

### Changes Made

1. **Updated [`app/api/printful/upload/route.ts`](app/api/printful/upload/route.ts:162)**
   - Changed `adminSupabase.storage.from('printful-uploads')` to `adminSupabase.storage.from('print-files')` (line 162)
   - Changed `adminSupabase.storage.from('printful-uploads')` to `adminSupabase.storage.from('print-files')` (line 175)
   - Changed path from `printful-uploads/${filename}` to `printful/${filename}` (line 158)

2. **Updated storage policies migration** ([`supabase/migrations/20260116220000_setup_printful_storage.sql`](supabase/migrations/20260116220000_setup_printful_storage.sql))
   - Added policies to allow public read access to `print-files` bucket
   - Added policies to allow authenticated users to upload, update, and delete files
   - Granted necessary permissions to storage schema

3. **Updated [`SUPABASE_SETUP.md`](SUPABASE_SETUP.md:26)**
   - Added section for `print-files` bucket setup
   - Clarified that `print-files` bucket is used for Printful uploads and design uploads

## How to Verify the Fix

### Step 1: Ensure bucket exists

If you haven't already, create the `print-files` bucket in Supabase:

1. Go to Storage in your Supabase dashboard
2. Create a new bucket named `print-files`
3. Set it to **Public** bucket
4. Optionally configure file size limits (recommended: 5MB max)

### Step 2: Run the storage policies migration

Run the migration in your Supabase SQL Editor:

```sql
-- Copy contents of supabase/migrations/20260116220000_setup_printful_storage.sql
-- and run it in the SQL Editor
```

### Step 3: Test the Printful upload endpoint

Test the actual Printful upload endpoint with a rotation scenario:

```bash
curl -X POST http://localhost:3000/api/printful/upload \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com/image.png",
    "variant_id": 123
  }'
```

Expected behavior:
- If the image needs rotation, it should be rotated and uploaded to Supabase
- The rotated image URL should be sent to Printful
- No "Bucket not found" errors should occur

## Technical Details

### Why use `print-files` bucket?

The `print-files` bucket is already used for design uploads in [`app/api/upload-design/route.ts`](app/api/upload-design/route.ts:25). Reusing this existing bucket is more efficient than creating a new one and maintains consistency across the application.

### File organization

Printful uploads are organized in the bucket using the path structure:
```
printful/user-{userId}-{variantId}-{timestamp}{-rotated}.png
```

This keeps Printful uploads separate from other files while using the same bucket.

### Service role client

The upload endpoint uses the service role client ([`createServiceRoleClient()`](lib/supabase/server.ts:56)), which bypasses Row Level Security (RLS) policies. This ensures uploads work regardless of the user's authentication status.

### Fallback behavior

If the Supabase upload fails for any reason, the code falls back to the original URL. This ensures that the Printful upload still works, just without the rotation fix.

## Troubleshooting

### "Bucket not found" error still occurs

1. Verify the bucket exists in the Supabase dashboard
2. Check that the bucket name is exactly `print-files` (case-sensitive)
3. Ensure you're using the correct Supabase project

### Upload fails with permission error

1. Run the storage policies migration
2. Verify the bucket is set to Public
3. Check that the service role key is correctly set in environment variables

### Test script fails

1. Ensure environment variables are set correctly
2. Verify the service role key has proper permissions
3. Check that the Supabase project URL is correct

## Summary

The fix is complete. The Printful upload endpoint now uses the existing `print-files` bucket instead of the non-existent `printful-uploads` bucket. The rotation fix should now work correctly without falling back to the original URL.
