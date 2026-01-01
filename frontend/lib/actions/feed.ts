'use server';

import { createClient } from '@/lib/supabase/server';
import { createError } from '@/lib/errors/ServerActionError';
import { logger } from '@/lib/logger';
import { FEED_PAGE_SIZE, FEED_MAX_PAGE } from '@/lib/constants/limits';
import { checkRateLimit } from '@/lib/middleware/rateLimit';
import { RATE_LIMITS } from '@/lib/constants/limits';

export interface FeedMap {
  id: string;
  title: string;
  subtitle: string | null;
  thumbnail_url: string | null;
  vote_score: number;
  published_at: string;
  created_at: string;
  author: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
}

/**
 * Get feed of published maps
 * Uses JOIN to fetch maps and profiles in a single query
 */
export async function getFeed(
  sort: 'fresh' | 'top' = 'fresh',
  page: number = 0,
  limit: number = FEED_PAGE_SIZE
): Promise<FeedMap[]> {
  const supabase = await createClient();
  
  // Validate and clamp pagination parameters
  page = Math.max(0, Math.min(page, FEED_MAX_PAGE));
  limit = Math.max(1, Math.min(limit, 100)); // Max 100 per page
  
  // Check rate limit (use anonymous user ID if not authenticated)
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id || 'anonymous';
  const rateLimit = await checkRateLimit(
    userId,
    'feed',
    RATE_LIMITS.FEED_PER_MINUTE,
    60 * 1000 // 1 minute window
  );
  if (!rateLimit.allowed) {
    throw createError.rateLimitExceeded(
      `Rate limit exceeded. Please try again in ${rateLimit.retryAfter} seconds.`
    );
  }

  // Try JOIN query first, fallback to two-query approach if foreign key is missing
  try {
    // Build query with JOIN to profiles
    let query = supabase
      .from('maps')
      .select(`
        id,
        title,
        subtitle,
        thumbnail_url,
        vote_score,
        published_at,
        created_at,
        profiles!left (
          username,
          display_name,
          avatar_url
        )
      `)
      .eq('is_published', true)
      .not('published_at', 'is', null);

    // Apply sorting
    if (sort === 'fresh') {
      query = query.order('published_at', { ascending: false });
    } else {
      query = query.order('vote_score', { ascending: false }).order('published_at', { ascending: false });
    }

    // Apply pagination
    query = query.range(page * limit, (page + 1) * limit - 1);

    const { data: maps, error } = await query;

    if (error) {
      // Check if error is due to missing foreign key
      if (error.message?.includes('foreign key') || error.code === 'PGRST116' || error.message?.includes('relation')) {
        logger.warn('JOIN query failed, falling back to two-query approach', { error, sort, page, limit });
        return getFeedFallback(supabase, sort, page, limit);
      }
      logger.error('Failed to fetch feed:', { error, sort, page, limit });
      throw createError.databaseError(`Failed to fetch feed: ${error.message}`);
    }

    if (!maps || maps.length === 0) {
      return [];
    }

    // Transform the data to match FeedMap interface
    return maps.map((map: any) => {
      const profile = map.profiles;
      return {
        id: map.id,
        title: map.title,
        subtitle: map.subtitle,
        thumbnail_url: map.thumbnail_url,
        vote_score: map.vote_score,
        published_at: map.published_at,
        created_at: map.created_at,
        author: profile ? {
          username: profile.username,
          display_name: profile.display_name,
          avatar_url: profile.avatar_url,
        } : {
          username: 'unknown',
          display_name: null,
          avatar_url: null,
        },
      };
    });
  } catch (error: any) {
    // If it's a foreign key error, try fallback
    if (error.message?.includes('foreign key') || error.code === 'PGRST116') {
      logger.warn('JOIN query failed, falling back to two-query approach', { error, sort, page, limit });
      return getFeedFallback(supabase, sort, page, limit);
    }
    throw error;
  }
}

/**
 * Fallback feed query using two separate queries
 * Used when foreign key relationship is not available
 */
async function getFeedFallback(
  supabase: Awaited<ReturnType<typeof createClient>>,
  sort: 'fresh' | 'top',
  page: number,
  limit: number
): Promise<FeedMap[]> {
  // First, fetch the maps
  let query = supabase
    .from('maps')
    .select('id, title, subtitle, thumbnail_url, vote_score, published_at, created_at, user_id')
    .eq('is_published', true)
    .not('published_at', 'is', null);

  if (sort === 'fresh') {
    query = query.order('published_at', { ascending: false });
  } else {
    query = query.order('vote_score', { ascending: false }).order('published_at', { ascending: false });
  }

  query = query.range(page * limit, (page + 1) * limit - 1);

  const { data: maps, error: mapsError } = await query;

  if (mapsError) {
    logger.error('Failed to fetch maps in fallback:', { error: mapsError, sort, page, limit });
    throw createError.databaseError(`Failed to fetch feed: ${mapsError.message}`);
  }

  if (!maps || maps.length === 0) {
    return [];
  }

  // Extract unique user IDs
  const userIds = [...new Set((maps as any[]).map(map => map.user_id))];

  // Fetch profiles for all users
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url')
    .in('id', userIds);

  if (profilesError) {
    logger.error('Failed to fetch profiles in fallback:', { error: profilesError });
    throw createError.databaseError(`Failed to fetch profiles: ${profilesError.message}`);
  }

  // Create a map of user_id -> profile for quick lookup
  const profileMap = new Map<string, any>(
    (profiles || []).map((profile: any) => [profile.id, profile])
  );

  // Combine maps with profiles
  return (maps as any[]).map((map) => {
    const profile = profileMap.get(map.user_id);
    return {
      id: map.id,
      title: map.title,
      subtitle: map.subtitle,
      thumbnail_url: map.thumbnail_url,
      vote_score: map.vote_score,
      published_at: map.published_at,
      created_at: map.created_at,
      author: profile ? {
        username: profile.username,
        display_name: profile.display_name,
        avatar_url: profile.avatar_url,
      } : {
        username: 'unknown',
        display_name: null,
        avatar_url: null,
      },
    };
  });
}

