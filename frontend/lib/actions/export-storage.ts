'use server';

import { createServiceRoleClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { createError } from '@/lib/errors/ServerActionError';

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
