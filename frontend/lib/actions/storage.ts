'use server';

import { createClient } from '@/lib/supabase/server';
import { createError, ServerActionError } from '@/lib/errors/ServerActionError';
import { logger } from '@/lib/logger';
import { THUMBNAIL_MAX_SIZE, THUMBNAIL_MAX_DIMENSION } from '@/lib/constants/limits';
import sharp from 'sharp';

/**
 * Upload a thumbnail to Supabase Storage
 * @returns Public URL of the uploaded thumbnail
 */
export async function uploadThumbnail(
  mapId: string,
  userId: string,
  thumbnailBlob: Blob
): Promise<string> {
  const supabase = await createClient();

  // Verify map ownership
  const { data: map, error: mapError } = await supabase
    .from('maps')
    .select('user_id')
    .eq('id', mapId)
    .single();

  if (mapError) {
    logger.error('Map not found during thumbnail upload', { mapId, userId, error: mapError });
    throw createError.notFound('Map');
  }

  if (!map) {
    logger.error('Map not found during thumbnail upload', { mapId, userId });
    throw createError.notFound('Map');
  }

  const mapData = map as { user_id: string };
  if (mapData.user_id !== userId) {
    logger.warn('Unauthorized thumbnail upload attempt', { mapId, userId, ownerId: mapData.user_id });
    throw createError.permissionDenied('You do not have permission to upload thumbnails for this map');
  }

  // Validate file size
  if (thumbnailBlob.size > THUMBNAIL_MAX_SIZE) {
    throw createError.validationError(
      `Thumbnail size (${(thumbnailBlob.size / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed size (${THUMBNAIL_MAX_SIZE / 1024 / 1024}MB)`
    );
  }

  // Validate file type
  const allowedTypes = ['image/webp', 'image/png', 'image/jpeg', 'image/jpg'];
  if (!allowedTypes.includes(thumbnailBlob.type)) {
    throw createError.validationError(
      `Invalid file type: ${thumbnailBlob.type}. Allowed types: ${allowedTypes.join(', ')}`
    );
  }

  // Convert blob to array buffer for upload
  const arrayBuffer = await thumbnailBlob.arrayBuffer();
  
  // Validate image content using sharp
  try {
    const metadata = await sharp(arrayBuffer).metadata();
    if (!metadata.width || !metadata.height) {
      throw createError.validationError('Invalid image file: unable to read dimensions');
    }
    if (metadata.width > THUMBNAIL_MAX_DIMENSION || metadata.height > THUMBNAIL_MAX_DIMENSION) {
      throw createError.validationError(
        `Image dimensions (${metadata.width}x${metadata.height}) exceed maximum (${THUMBNAIL_MAX_DIMENSION}x${THUMBNAIL_MAX_DIMENSION})`
      );
    }
    logger.info('Image validated successfully', { 
      mapId, 
      userId, 
      width: metadata.width, 
      height: metadata.height,
      format: metadata.format 
    });
  } catch (error: any) {
    // If it's already a ServerActionError, re-throw it
    if (error instanceof ServerActionError) {
      throw error;
    }
    // If sharp fails to read the image, it's likely corrupted or not a real image
    logger.error('Image validation failed:', { error, mapId, userId });
    throw createError.validationError('Invalid image file: file may be corrupted or not a valid image');
  }
  
  const fileExt = thumbnailBlob.type === 'image/webp' ? 'webp' : 
                   thumbnailBlob.type === 'image/jpeg' || thumbnailBlob.type === 'image/jpg' ? 'jpg' : 'png';
  const fileName = `${userId}/${mapId}.${fileExt}`;

  logger.info('Uploading thumbnail', { mapId, userId, size: thumbnailBlob.size, type: thumbnailBlob.type });

  const { data, error } = await supabase.storage
    .from('map-thumbnails')
    .upload(fileName, arrayBuffer, {
      contentType: thumbnailBlob.type,
      upsert: true, // Replace if exists
    });

  if (error) {
    logger.error('Failed to upload thumbnail:', { error, mapId, userId, fileName });
    throw createError.storageError(`Failed to upload thumbnail: ${error.message}`);
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('map-thumbnails')
    .getPublicUrl(fileName);

  if (!urlData?.publicUrl) {
    logger.error('Failed to get public URL for thumbnail:', { mapId, userId, fileName });
    throw createError.storageError('Failed to get public URL for thumbnail');
  }

  logger.info('Thumbnail uploaded successfully', { mapId, userId, url: urlData.publicUrl });
  return urlData.publicUrl;
}

/**
 * Delete a thumbnail from Supabase Storage
 * Used for cleanup when publish fails after thumbnail upload
 */
export async function deleteThumbnail(thumbnailUrl: string): Promise<void> {
  const supabase = await createClient();
  
  // Extract path from URL
  // URL format: https://<project>.supabase.co/storage/v1/object/public/map-thumbnails/<path>
  const urlParts = thumbnailUrl.split('/map-thumbnails/');
  if (urlParts.length !== 2) {
    logger.warn('Invalid thumbnail URL format, cannot delete', { thumbnailUrl });
    return;
  }
  
  const filePath = urlParts[1];
  
  const { error } = await supabase.storage
    .from('map-thumbnails')
    .remove([filePath]);
  
  if (error) {
    logger.error('Failed to delete thumbnail:', { error, thumbnailUrl, filePath });
    // Don't throw - cleanup failures shouldn't break the flow
  } else {
    logger.info('Thumbnail deleted successfully', { thumbnailUrl, filePath });
  }
}

