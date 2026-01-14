import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        // Allow guest uploads
        const userId = user?.id || 'guest';

        // Generate a unique filename
        const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(7)}.png`;

        console.log('Upload design: Generating signed upload URL for', fileName);

        // 1. Create Signed Upload URL (valid for 10 minutes)
        // Use admin client to bypass RLS for generating the signed URL.
        // The signed URL itself provides the permission to upload to the specific path.
        const supabaseAdmin = createAdminClient();
        const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
            .from('print-files')
            .createSignedUploadUrl(fileName);

        if (uploadError || !uploadData) {
            console.error('Upload design: Signed Upload URL error:', uploadError);
            return NextResponse.json({ error: 'Failed to generate upload link' }, { status: 500 });
        }

        return NextResponse.json({
            uploadUrl: uploadData.signedUrl,
            path: uploadData.path,
        });

    } catch (error) {
        console.error('Upload design: Unexpected error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        const { searchParams } = new URL(request.url);
        const path = searchParams.get('path');

        if (!path) {
            return NextResponse.json({ error: 'Path required' }, { status: 400 });
        }

        // Security check: Ensure user can only access their own files
        // For guest uploads, we allow access to 'guest/' paths but we might want to restrict this more in future?
        // Ideally, we'd sign the path on upload and verify it here, or rely on RLS.
        // But since we are generating a signed URL for *read* access anyway, 
        // effectively we are minting a token. The client just needs to know *what* path to ask for.
        // If they ask for 'guest/foo.png', they can get it. 
        // If they ask for 'user-123/bar.png', they must be user 123.

        let authorized = false;

        if (path.startsWith('guest/')) {
            authorized = true;
        } else if (user && path.startsWith(`${user.id}/`)) {
            authorized = true;
        }

        if (!authorized) {
            console.error('Upload design: Unauthorized access attempt', user?.id, path);
            return NextResponse.json({ error: 'Unauthorized access to file' }, { status: 403 });
        }

        // Create Signed Read URL (valid for 24 hours)
        // Use admin client to ensure we can generate link even if RLS somehow blocks read of 'guest/' path for anon user.
        // We add a simple retry mechanism here to handle potential S3 eventual consistency lag.
        const supabaseAdmin = createAdminClient();

        let readData = null;
        let readError = null;

        for (let i = 0; i < 3; i++) {
            const result = await supabaseAdmin.storage
                .from('print-files')
                .createSignedUrl(path, 86400);

            readData = result.data;
            readError = result.error;

            if (!readError && readData) break;

            // If error is Object not found (404-like), wait and retry
            console.log(`Upload design: Attempt ${i + 1} failed to create signed URL for ${path}:`, readError?.message);
            if (i < 2) await new Promise(resolve => setTimeout(resolve, 1000));
        }

        if (readError || !readData) {
            console.error('Upload design: Signed Read URL error after retries:', readError);

            // Debug: List files in the folder to see what IS there
            const folder = path.split('/').slice(0, -1).join('/');
            const { data: listData, error: listError } = await supabaseAdmin.storage
                .from('print-files')
                .list(folder);

            console.log(`Upload design: Contents of ${folder}:`, listData?.map(f => f.name));

            return NextResponse.json({ error: 'Failed to generate preview link' }, { status: 500 });
        }

        return NextResponse.json({
            readUrl: readData.signedUrl
        });

    } catch (error) {
        console.error('Upload design: Unexpected error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
