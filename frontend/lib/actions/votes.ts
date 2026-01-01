'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { createError } from '@/lib/errors/ServerActionError';
import { logger } from '@/lib/logger';
import { checkRateLimit } from '@/lib/middleware/rateLimit';
import { RATE_LIMITS } from '@/lib/constants/limits';

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
    throw createError.authRequired('You must be signed in to vote');
  }

  // Check rate limit
  const rateLimit = await checkRateLimit(
    user.id,
    'vote',
    RATE_LIMITS.VOTES_PER_MINUTE,
    60 * 1000 // 1 minute window
  );
  if (!rateLimit.allowed) {
    throw createError.rateLimitExceeded(
      `Rate limit exceeded. Please try again in ${rateLimit.retryAfter} seconds.`
    );
  }

  // Validate vote value
  if (value !== 1 && value !== -1) {
    throw createError.validationError('Vote value must be 1 or -1');
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
    logger.error('Failed to vote:', { error, mapId, userId: user.id, value });
    throw createError.databaseError(`Failed to vote: ${error.message}`);
  }

  logger.info('Vote recorded successfully', { mapId, userId: user.id, value });
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
    // Not an error - user just hasn't voted yet
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
    throw createError.authRequired('You must be signed in to remove votes');
  }

  const { error } = await (supabase as any)
    .from('votes')
    .delete()
    .eq('user_id', user.id)
    .eq('map_id', mapId);

  if (error) {
    logger.error('Failed to remove vote:', { error, mapId, userId: user.id });
    throw createError.databaseError(`Failed to remove vote: ${error.message}`);
  }

  logger.info('Vote removed successfully', { mapId, userId: user.id });
  revalidatePath(`/map/${mapId}`);
  revalidatePath('/feed');
}

