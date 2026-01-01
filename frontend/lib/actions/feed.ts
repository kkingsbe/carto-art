'use server';

import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/types/database';

type MapsRow = Database['public']['Tables']['maps']['Row'];
type ProfilesRow = Database['public']['Tables']['profiles']['Row'];

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
 */
export async function getFeed(
  sort: 'fresh' | 'top' = 'fresh',
  page: number = 0,
  limit: number = 20
): Promise<FeedMap[]> {
  const supabase = await createClient();

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
    throw new Error(`Failed to fetch feed: ${mapsError.message}`);
  }

  if (!maps || maps.length === 0) {
    return [];
  }

  // Extract unique user IDs
  const userIds = [...new Set((maps as MapsRow[]).map(map => map.user_id))];

  // Fetch profiles for all users
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url')
    .in('id', userIds);

  if (profilesError) {
    throw new Error(`Failed to fetch profiles: ${profilesError.message}`);
  }

  // Create a map of user_id -> profile for quick lookup
  const profilesArray = (profiles || []) as ProfilesRow[];
  const profileMap = new Map<string, ProfilesRow>(
    profilesArray.map(profile => [profile.id, profile])
  );

  // Combine maps with profiles
  return (maps as MapsRow[]).map((map) => {
    const profile = profileMap.get(map.user_id);
    return {
      id: map.id,
      title: map.title,
      subtitle: map.subtitle,
      thumbnail_url: map.thumbnail_url,
      vote_score: map.vote_score,
      published_at: map.published_at!,
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

