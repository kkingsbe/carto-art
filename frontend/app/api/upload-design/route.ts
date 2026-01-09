import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            console.error('Upload design: Unauthorized - no user');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Generate a unique filename
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.png`;

        console.log('Upload design: Generating signed upload URL for', fileName);

        // 1. Create Signed Upload URL (valid for 10 minutes)
        const { data: uploadData, error: uploadError } = await supabase.storage
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

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const path = searchParams.get('path');

        if (!path) {
            return NextResponse.json({ error: 'Path required' }, { status: 400 });
        }

        // Security check: Ensure user can only access their own files
        if (!path.startsWith(`${user.id}/`)) {
            console.error('Upload design: User tried to access file not belonging to them', user.id, path);
            return NextResponse.json({ error: 'Unauthorized access to file' }, { status: 403 });
        }

        // Create Signed Read URL (valid for 24 hours)
        const { data: readData, error: readError } = await supabase.storage
            .from('print-files')
            .createSignedUrl(path, 86400);

        if (readError || !readData) {
            console.error('Upload design: Signed Read URL error:', readError);
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
