// Stub file for export storage - no-op for anonymous version
export async function getThumbnailUploadUrl(contentType: string): Promise<{ signedUrl: string; publicUrl: string }> {
  // No-op for anonymous version
  console.log('[ExportStorage] Get thumbnail upload URL:', contentType);
  return { signedUrl: '', publicUrl: '' };
}
