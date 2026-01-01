'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

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
    throw new Error('You must be signed in to comment');
  }

  // Verify map is published
  const { data: map, error: mapError } = await supabase
    .from('maps')
    .select('is_published')
    .eq('id', mapId)
    .single();

  if (mapError || !(map as any)?.is_published) {
    throw new Error('Can only comment on published maps');
  }

  const { error } = await supabase
    .from('comments')
    .insert({
      user_id: user.id,
      map_id: mapId,
      content: content.trim(),
    } as any);

  if (error) {
    throw new Error(`Failed to add comment: ${error.message}`);
  }

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
    throw new Error(`Failed to fetch comments: ${error.message}`);
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
    throw new Error('You must be signed in to delete comments');
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
    throw new Error(`Failed to delete comment: ${error.message}`);
  }

  if (comment) {
    revalidatePath(`/map/${(comment as any).map_id}`);
  }
}

