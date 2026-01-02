'use server';

import { createClient } from '@/lib/supabase/server';
import { createError } from '@/lib/errors/ServerActionError';
import { logger } from '@/lib/logger';
import { revalidatePath } from 'next/cache';
import type { Database } from '@/types/database';

export interface UserProfile {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
    featured_map_ids: string[] | null;
    created_at: string;
}

export interface ProfileStats {
    followers: number;
    following: number;
    total_views: number;
    total_likes: number;
    is_following: boolean; // Relative to current user
}

/**
 * Get public profile by username
 */
export async function getProfileByUsername(username: string): Promise<UserProfile | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .single();

    if (error) {
        if (error.code === 'PGRST116') return null;
        logger.error('Failed to fetch profile:', error);
        throw createError.databaseError('Failed to fetch profile');
    }

    return data as UserProfile;
}

/**
 * Get profile stats and social info
 */
export async function getProfileStats(targetUserId: string): Promise<ProfileStats> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Parallelize queries for performance
    const [
        followersCount,
        followingCount,
        isFollowing,
        mapsStats
    ] = await Promise.all([
        // Count followers
        supabase.from('follows').select('follower_id', { count: 'exact', head: true }).eq('following_id', targetUserId),
        // Count following
        supabase.from('follows').select('following_id', { count: 'exact', head: true }).eq('follower_id', targetUserId),
        // Check if current user is following target (if logged in)
        user ? supabase.from('follows').select('follower_id').eq('follower_id', user.id).eq('following_id', targetUserId).single() : Promise.resolve({ data: null, error: null }),
        // Sum views and votes (likes)
        supabase.from('maps').select('view_count, vote_score').eq('user_id', targetUserId).eq('is_published', true)
    ]);

    const totalViews = mapsStats.data?.reduce((acc, map) => acc + (map.view_count || 0), 0) || 0;
    const totalLikes = mapsStats.data?.reduce((acc, map) => acc + (map.vote_score || 0), 0) || 0;

    return {
        followers: followersCount.count || 0,
        following: followingCount.count || 0,
        is_following: !!isFollowing.data,
        total_views: totalViews,
        total_likes: totalLikes,
    };
}

/**
 * Follow a user
 */
export async function followUser(targetUserId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw createError.authRequired('You must be logged in to follow users');
    }

    if (user.id === targetUserId) {
        throw createError.validationError('You cannot follow yourself');
    }

    const { error } = await supabase
        .from('follows')
        .insert({
            follower_id: user.id,
            following_id: targetUserId
        });

    if (error) {
        // Unique violation means already following, which is fine to ignore or handle
        if (error.code === '23505') return;
        logger.error('Failed to follow user:', error);
        throw createError.databaseError('Failed to follow user');
    }

    revalidatePath('/user/[username]');
    revalidatePath('/profile');
}

/**
 * Unfollow a user
 */
export async function unfollowUser(targetUserId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw createError.authRequired('You must be logged in to unfollow users');
    }

    const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', targetUserId);

    if (error) {
        logger.error('Failed to unfollow user:', error);
        throw createError.databaseError('Failed to unfollow user');
    }

    revalidatePath('/user/[username]');
    revalidatePath('/profile');
}

/**
 * Update featured maps
 */
export async function updateFeaturedMaps(mapIds: string[]) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw createError.authRequired('You must be logged in to update profile');
    }

    // Verify ownership of all maps
    if (mapIds.length > 0) {
        const { count, error } = await supabase
            .from('maps')
            .select('id', { count: 'exact', head: true })
            .in('id', mapIds)
            .eq('user_id', user.id);

        if (error || count !== mapIds.length) {
            throw createError.validationError('One or more selected maps do not belong to you');
        }
    }

    const { error } = await supabase
        .from('profiles')
        .update({ featured_map_ids: mapIds } as any) // Type might not be fully updated yet in codebase
        .eq('id', user.id);

    if (error) {
        logger.error('Failed to update featured maps:', error);
        throw createError.databaseError('Failed to update highlighted maps');
    }

    revalidatePath('/profile');
    revalidatePath('/user/[username]');
}
