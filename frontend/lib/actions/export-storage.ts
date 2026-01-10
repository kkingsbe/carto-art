'use server';

import { createServiceRoleClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { createError } from '@/lib/errors/ServerActionError';

// ... keep existing imports ...

/**
 * Get a signed upload URL for a thumbnail.
 * allowing the client to upload directly to Storage
 * (bypassing Next.js server body limits).
 */
export async function getThumbnailUploadUrl(contentType: string = 'image/png'): Promise<{ signedUrl: string; path: string; publicUrl: string }> {
    const supabase = createServiceRoleClient();

    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 7);
    const extension = contentType === 'image/jpeg' ? 'jpg' : 'png';
    const fileName = `thumbnails/${timestamp}-${random}.${extension}`;

    // Create a signed URL that allows uploading to this specific path
    // Note: Supabase has a 50MB limit on free tier, 5GB on pro tier
    const { data, error } = await supabase.storage
        .from('posters')
        .createSignedUploadUrl(fileName, {
            upsert: true
        });

    if (error) {
        logger.error('Failed to create signed upload URL:', error);
        throw createError.storageError(`Failed to create upload URL: ${error.message}`);
    }

    // Pre-calculate the public URL since we know the path
    const { data: urlData } = supabase.storage
        .from('posters')
        .getPublicUrl(fileName);

    return {
        signedUrl: data.signedUrl,
        path: fileName,
        publicUrl: urlData.publicUrl
    };
}

/**
 * Upload an export thumbnail to Supabase Storage.
 * This is used for the admin dashboard feed.
 * 
 * @param formData - FormData containing the 'file' (Blob/File)
 * @returns Public URL of the uploaded thumbnail
 */
export async function uploadExportThumbnail(formData: FormData): Promise<string> {
    const file = formData.get('file') as File;
    if (!file) {
        throw createError.validationError('No file provided for thumbnail upload');
    }

    const supabase = createServiceRoleClient();

    // Use a predictable but unique filename
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 7);
    const fileName = `thumbnails/${timestamp}-${random}.png`;

    logger.info('Uploading export thumbnail', { fileName, size: file.size });

    try {
        const { data, error } = await supabase.storage
            .from('posters')
            .upload(fileName, file, {
                contentType: 'image/png',
                upsert: true,
            });

        if (error) {
            logger.error('Failed to upload export thumbnail:', error);
            throw createError.storageError(`Failed to upload thumbnail: ${error.message}`);
        }

        // Get public URL
        const { data: urlData } = supabase.storage
            .from('posters')
            .getPublicUrl(fileName);

        if (!urlData?.publicUrl) {
            throw createError.storageError('Failed to get public URL for export thumbnail');
        }

        logger.info('Export thumbnail uploaded successfully', { url: urlData.publicUrl });
        return urlData.publicUrl;
    } catch (err: any) {
        logger.error('Error in uploadExportThumbnail:', err);
        throw err;
    }
}
