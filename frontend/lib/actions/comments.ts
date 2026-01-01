'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { createError } from '@/lib/errors/ServerActionError';
import { logger } from '@/lib/logger';
import { COMMENT_MIN_LENGTH, COMMENT_MAX_LENGTH } from '@/lib/constants/limits';
import { checkRateLimit } from '@/lib/middleware/rateLimit';
import { RATE_LIMITS } from '@/lib/constants/limits';
import { normalizeComment, sanitizeText } from '@/lib/utils/sanitize';

export interface Comment {
  id: string;
  user_id: string;
  map_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  profile?: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
}

/**
 * Add a comment to a published map
 */
export async function addComment(mapId: string, content: string) {
  const supabase = await createClient();
  
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw createError.authRequired('You must be signed in to comment');
  }

  // Check rate limit
  const rateLimit = await checkRateLimit(
    user.id,
    'comment',
    RATE_LIMITS.COMMENTS_PER_MINUTE,
    60 * 1000 // 1 minute window
  );
  if (!rateLimit.allowed) {
    throw createError.rateLimitExceeded(
      `Rate limit exceeded. Please try again in ${rateLimit.retryAfter} seconds.`
    );
  }

  // Normalize and sanitize comment content
  const normalizedContent = normalizeComment(content);
  const sanitizedContent = sanitizeText(normalizedContent);
  
  // Validate comment content
  if (sanitizedContent.length < COMMENT_MIN_LENGTH) {
    throw createError.validationError('Comment cannot be empty');
  }
  if (sanitizedContent.length > COMMENT_MAX_LENGTH) {
    throw createError.validationError(
      `Comment must be ${COMMENT_MAX_LENGTH} characters or less`
    );
  }

  // Verify map is published
  const { data: map, error: mapError } = await supabase
    .from('maps')
    .select('is_published')
    .eq('id', mapId)
    .single();

  if (mapError) {
    logger.error('Failed to verify map for comment:', { error: mapError, mapId });
    throw createError.databaseError(`Failed to verify map: ${mapError.message}`);
  }

  if (!(map as any)?.is_published) {
    throw createError.permissionDenied('Can only comment on published maps');
  }

  const { error } = await supabase
    .from('comments')
    .insert({
      user_id: user.id,
      map_id: mapId,
      content: sanitizedContent,
    } as any);

  if (error) {
    logger.error('Failed to add comment:', { error, mapId, userId: user.id });
    throw createError.databaseError(`Failed to add comment: ${error.message}`);
  }

  logger.info('Comment added successfully', { mapId, userId: user.id });
  revalidatePath(`/map/${mapId}`);
}

/**
 * Get all comments for a map
 */
export async function getComments(mapId: string): Promise<Comment[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('comments')
    .select(`
      *,
      profiles!comments_user_id_profiles_fkey (
        username,
        display_name,
        avatar_url
      )
    `)
    .eq('map_id', mapId)
    .order('created_at', { ascending: true });

  if (error) {
    logger.error('Failed to fetch comments:', { error, mapId });
    throw createError.databaseError(`Failed to fetch comments: ${error.message}`);
  }

  return (data || []).map((comment: any) => ({
    id: comment.id,
    user_id: comment.user_id,
    map_id: comment.map_id,
    content: comment.content,
    created_at: comment.created_at,
    updated_at: comment.updated_at,
    profile: comment.profiles ? {
      username: comment.profiles.username,
      display_name: comment.profiles.display_name,
      avatar_url: comment.profiles.avatar_url,
    } : undefined,
  }));
}

/**
 * Delete a comment (only by the author)
 */
export async function deleteComment(commentId: string) {
  const supabase = await createClient();
  
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw createError.authRequired('You must be signed in to delete comments');
  }

  // Get comment to find map_id for revalidation
  const { data: comment } = await supabase
    .from('comments')
    .select('map_id')
    .eq('id', commentId)
    .eq('user_id', user.id)
    .single();

  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', commentId)
    .eq('user_id', user.id); // RLS will handle this, but double-check

  if (error) {
    logger.error('Failed to delete comment:', { error, commentId, userId: user.id });
    throw createError.databaseError(`Failed to delete comment: ${error.message}`);
  }

  if (comment) {
    logger.info('Comment deleted successfully', { commentId, mapId: (comment as any).map_id, userId: user.id });
    revalidatePath(`/map/${(comment as any).map_id}`);
  }
}

