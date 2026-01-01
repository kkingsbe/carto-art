'use server';

import { createClient } from '@/lib/supabase/server';

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

  // Convert blob to array buffer for upload
  const arrayBuffer = await thumbnailBlob.arrayBuffer();
  const fileExt = thumbnailBlob.type === 'image/webp' ? 'webp' : 'png';
  const fileName = `${userId}/${mapId}.${fileExt}`;

  const { data, error } = await supabase.storage
    .from('map-thumbnails')
    .upload(fileName, arrayBuffer, {
      contentType: thumbnailBlob.type,
      upsert: true, // Replace if exists
    });

  if (error) {
    throw new Error(`Failed to upload thumbnail: ${error.message}`);
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('map-thumbnails')
    .getPublicUrl(fileName);

  if (!urlData?.publicUrl) {
    throw new Error('Failed to get public URL for thumbnail');
  }

  return urlData.publicUrl;
}

