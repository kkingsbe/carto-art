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


        // Log headers to debug Content-Type issues
        const contentType = request.headers.get('content-type') || '';
        console.log('Upload design: Content-Type:', contentType);
        console.log('Upload design: Content-Length:', request.headers.get('content-length'));

        let fileBlob: Blob | null = null;
        let fileType = 'image/png';

        if (contentType.includes('multipart/form-data')) {
            try {
                const formData = await request.formData();
                const file = formData.get('file');
                if (file && typeof file !== 'string') {
                    fileBlob = file as Blob;
                    fileType = file.type || 'image/png';
                }
            } catch (formDataError) {
                console.error('Upload design: Failed to parse formData:', formDataError);
                return NextResponse.json(
                    { error: 'Failed to parse form data' },
                    { status: 400 }
                );
            }
        } else {
            // Assume raw binary upload
            try {
                fileBlob = await request.blob();
                fileType = contentType;
            } catch (blobError) {
                console.error('Upload design: Failed to read raw body:', blobError);
                return NextResponse.json(
                    { error: 'Failed to read file body' },
                    { status: 400 }
                );
            }
        }

        if (!fileBlob || fileBlob.size === 0) {
            console.error('Upload design: No file provided or empty file');
            return NextResponse.json(
                { error: 'No file provided' },
                { status: 400 }
            );
        }



        // Limit size (e.g. 50MB)
        if (fileBlob.size > 50 * 1024 * 1024) {
            return NextResponse.json({ error: 'File too large (max 50MB)' }, { status: 400 });
        }

        console.log('Upload design: Processing file, size:', fileBlob.size, 'type:', fileBlob.type);

        // Ensure safe buffer conversion
        const arrayBuffer = await fileBlob.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.png`;

        console.log('Upload design: Uploading to storage, fileName:', fileName);

        const { error: uploadError } = await supabase.storage
            .from('print-files')
            .upload(fileName, buffer, {
                contentType: fileType || 'image/png',
                upsert: false
            });

        if (uploadError) {
            console.error('Upload design: Storage upload error:', uploadError);
            return NextResponse.json(
                { error: `Failed to upload file: ${uploadError.message}` },
                { status: 500 }
            );
        }

        console.log('Upload design: File uploaded, creating signed URL');

        // Create Signed URL for Printful (valid for 24 hours)
        const { data: signedData, error: signError } = await supabase.storage
            .from('print-files')
            .createSignedUrl(fileName, 86400);

        if (signError || !signedData) {
            console.error('Upload design: Signed URL error:', signError);
            return NextResponse.json({ error: 'Failed to generate secure link' }, { status: 500 });
        }

        console.log('Upload design: Success');
        return NextResponse.json({ signedUrl: signedData.signedUrl });
    } catch (error) {
        console.error('Upload design: Unexpected error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

