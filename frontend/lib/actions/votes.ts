'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

/**
 * Vote on a map (+1 or -1)
 */
export async function voteOnMap(mapId: string, value: 1 | -1) {
  const supabase = await createClient();
  
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('You must be signed in to vote');
  }

  // Upsert vote (insert or update)
  const { error } = await (supabase as any)
    .from('votes')
    .upsert(
      {
        user_id: user.id,
        map_id: mapId,
        value,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_id,map_id',
      }
    );

  if (error) {
    throw new Error(`Failed to vote: ${error.message}`);
  }

  revalidatePath(`/map/${mapId}`);
  revalidatePath('/feed');
}

/**
 * Get the current user's vote on a map
 */
export async function getUserVote(mapId: string): Promise<number | null> {
  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data, error } = await (supabase as any)
    .from('votes')
    .select('value')
    .eq('user_id', user.id)
    .eq('map_id', mapId)
    .single();

  if (error || !data) {
    return null;
  }

  return (data as any).value;
}

/**
 * Remove the user's vote from a map
 */
export async function removeVote(mapId: string) {
  const supabase = await createClient();
  
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('You must be signed in to remove votes');
  }

  const { error } = await (supabase as any)
    .from('votes')
    .delete()
    .eq('user_id', user.id)
    .eq('map_id', mapId);

  if (error) {
    throw new Error(`Failed to remove vote: ${error.message}`);
  }

  revalidatePath(`/map/${mapId}`);
  revalidatePath('/feed');
}

