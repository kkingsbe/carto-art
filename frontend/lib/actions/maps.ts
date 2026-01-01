'use server';

import { createClient } from '@/lib/supabase/server';
import { serializeMapConfig, deserializeMapConfig } from '@/lib/supabase/maps';
import type { PosterConfig } from '@/types/poster';
import type { Database } from '@/types/database';
import { revalidatePath } from 'next/cache';

export interface SavedMap {
  id: string;
  title: string;
  subtitle: string | null;
  config: PosterConfig;
  is_published: boolean;
  thumbnail_url: string | null;
  vote_score: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
}

// Alias for backward compatibility
export type MapConfig = any; // JSONB representation of PosterConfig

/**
 * Save a new map to the database
 */
export async function saveMap(config: PosterConfig, title: string) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('You must be signed in to save maps');
  }

  const serializedConfig = serializeMapConfig(config);

  const insertData: Database['public']['Tables']['maps']['Insert'] = {
    user_id: user.id,
    title,
    config: serializedConfig,
    is_published: false,
  };

  const { data, error } = await (supabase as any)
    .from('maps')
    .insert(insertData)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to save map: ${error.message}`);
  }

  revalidatePath('/profile');
  return data as SavedMap;
}

/**
 * Save a new map with a thumbnail
 */
export async function saveMapWithThumbnail(
  config: PosterConfig,
  title: string,
  thumbnailUrl: string
) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('You must be signed in to save maps');
  }

  const serializedConfig = serializeMapConfig(config);

  const insertData: Database['public']['Tables']['maps']['Insert'] = {
    user_id: user.id,
    title,
    config: serializedConfig,
    is_published: false,
    thumbnail_url: thumbnailUrl,
  };

  const { data, error } = await (supabase as any)
    .from('maps')
    .insert(insertData)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to save map: ${error.message}`);
  }

  revalidatePath('/profile');
  return data as SavedMap;
}

/**
 * Update an existing map
 */
export async function updateMap(
  id: string,
  config: PosterConfig,
  title?: string
) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('You must be signed in to update maps');
  }

  const serializedConfig = serializeMapConfig(config);
  const updateData: Database['public']['Tables']['maps']['Update'] = {
    config: serializedConfig,
    updated_at: new Date().toISOString(),
  };

  if (title !== undefined) {
    updateData.title = title;
  }

  const { data, error } = await (supabase as any)
    .from('maps')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', user.id) // Ensure user owns the map
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update map: ${error.message}`);
  }

  revalidatePath('/profile');
  revalidatePath(`/map/${id}`);
  return data as SavedMap;
}

/**
 * Update map's thumbnail URL
 */
export async function updateMapThumbnail(
  id: string,
  thumbnailUrl: string
) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('You must be signed in to update maps');
  }

  const updateData: Database['public']['Tables']['maps']['Update'] = {
    thumbnail_url: thumbnailUrl,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await (supabase as any)
    .from('maps')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', user.id) // Ensure user owns the map
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update thumbnail: ${error.message}`);
  }

  revalidatePath('/profile');
  revalidatePath(`/map/${id}`);
  return data as SavedMap;
}

/**
 * Delete a map
 */
export async function deleteMap(id: string) {
  const supabase = await createClient();
  
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('You must be signed in to delete maps');
  }

  const { error } = await supabase
    .from('maps')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id); // Ensure user owns the map

  if (error) {
    throw new Error(`Failed to delete map: ${error.message}`);
  }

  revalidatePath('/profile');
}

/**
 * Publish a map (make it visible to everyone)
 */
export async function publishMap(id: string, subtitle?: string) {
  const supabase = await createClient();
  
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('You must be signed in to publish maps');
  }

  const updateData: Database['public']['Tables']['maps']['Update'] = {
    is_published: true,
    published_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (subtitle !== undefined) {
    updateData.subtitle = subtitle;
  }

  const { data, error } = await (supabase as any)
    .from('maps')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', user.id) // Ensure user owns the map
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to publish map: ${error.message}`);
  }

  revalidatePath('/profile');
  revalidatePath('/feed');
  revalidatePath(`/map/${id}`);
  return data as SavedMap;
}

/**
 * Unpublish a map
 */
export async function unpublishMap(id: string) {
  const supabase = await createClient();
  
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('You must be signed in to unpublish maps');
  }

  const updateData: Database['public']['Tables']['maps']['Update'] = {
    is_published: false,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await (supabase as any)
    .from('maps')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', user.id) // Ensure user owns the map
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to unpublish map: ${error.message}`);
  }

  revalidatePath('/profile');
  revalidatePath('/feed');
  revalidatePath(`/map/${id}`);
  return data as SavedMap;
}

/**
 * Get all maps for the current user
 */
export async function getUserMaps(): Promise<SavedMap[]> {
  const supabase = await createClient();
  
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return [];
  }

  const { data, error } = await (supabase as any)
    .from('maps')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch maps: ${error.message}`);
  }

  return ((data || []) as any[]).map((map: any) => ({
    ...map,
    config: deserializeMapConfig(map.config),
  })) as SavedMap[];
}

/**
 * Get a single map by ID (checks permissions)
 */
export async function getMapById(id: string): Promise<SavedMap | null> {
  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await (supabase as any)
    .from('maps')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    throw new Error(`Failed to fetch map: ${error.message}`);
  }

  const mapData = data as any;

  // Check if user has access (owner or published)
  if (mapData.user_id !== user?.id && !mapData.is_published) {
    return null; // Not accessible
  }

  return {
    ...mapData,
    config: deserializeMapConfig(mapData.config),
  } as SavedMap;
}

