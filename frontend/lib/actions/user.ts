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
    view_count: number;
}

export interface ProfileStats {
    followers: number;
    following: number;
    total_views: number;
    total_likes: number;
    is_following: boolean; // Relative to current user
    profile_views: number;
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
        mapsStats,
        profileStats
    ] = await Promise.all([
        // Count followers
        supabase.from('follows').select('follower_id', { count: 'exact', head: true }).eq('following_id', targetUserId),
        // Count following
        supabase.from('follows').select('following_id', { count: 'exact', head: true }).eq('follower_id', targetUserId),
        // Check if current user is following target (if logged in)
        user ? supabase.from('follows').select('follower_id').eq('follower_id', user.id).eq('following_id', targetUserId).single() : Promise.resolve({ data: null, error: null }),
        // Sum views and votes (likes)
        supabase.from('maps').select('view_count, vote_score').eq('user_id', targetUserId).eq('is_published', true),
        // Get profile views
        supabase.from('profiles').select('view_count').eq('id', targetUserId).single()
    ]);

    type MapStats = Pick<Database['public']['Tables']['maps']['Row'], 'view_count' | 'vote_score'>;
    const mapsData = (mapsStats.data || []) as MapStats[];

    // Sum of views on all maps
    const totalMapViews = mapsData.reduce((acc, map) => acc + (map.view_count || 0), 0);
    const totalLikes = mapsData.reduce((acc, map) => acc + (map.vote_score || 0), 0);
    const profileViews = (profileStats.data as any)?.view_count || 0;

    return {
        followers: followersCount.count || 0,
        following: followingCount.count || 0,
        is_following: !!isFollowing.data,
        total_views: totalMapViews,
        total_likes: totalLikes,
        profile_views: profileViews
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
        } as any);

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

    const updateData: Database['public']['Tables']['profiles']['Update'] = {
        featured_map_ids: mapIds,
    };

    const { error } = await (supabase as any)
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

    if (error) {
        logger.error('Failed to update featured maps:', error);
        throw createError.databaseError('Failed to update highlighted maps');
    }

    revalidatePath('/profile');
    revalidatePath('/user/[username]');
}

export interface SocialProfile {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
    is_following: boolean; // Context of current user
}

/**
 * Get users following a specific user
 */
export async function getFollowers(userId: string, page = 0, limit = 20): Promise<SocialProfile[]> {
    const supabase = await createClient();
    const { data: { user: currentUser } } = await supabase.auth.getUser();

    const { data, error } = await supabase
        .from('follows')
        .select(`
            follower:profiles!follows_follower_id_fkey (
                id,
                username,
                display_name,
                avatar_url
            ),
            created_at
        `)
        .eq('following_id', userId)
        .range(page * limit, (page + 1) * limit - 1)
        .order('created_at', { ascending: false });

    if (error) {
        logger.error('Failed to fetch followers:', error);
        throw createError.databaseError('Failed to fetch followers');
    }

    const profiles = data.map((d: any) => d.follower);

    // If logged in, check which of these profiles the current user is following
    if (currentUser && profiles.length > 0) {
        const profileIds = profiles.map((p: any) => p.id);
        const { data: followingData } = await supabase
            .from('follows')
            .select('following_id')
            .eq('follower_id', currentUser.id)
            .in('following_id', profileIds);

        const followingSet = new Set(followingData?.map((f: any) => f.following_id) || []);

        return profiles.map((p: any) => ({
            ...p,
            is_following: followingSet.has(p.id)
        }));
    }

    return profiles.map((p: any) => ({
        ...p,
        is_following: false
    }));
}

/**
 * Get users a specific user is following
 */
export async function getFollowing(userId: string, page = 0, limit = 20): Promise<SocialProfile[]> {
    const supabase = await createClient();
    const { data: { user: currentUser } } = await supabase.auth.getUser();

    const { data, error } = await supabase
        .from('follows')
        .select(`
            following:profiles!follows_following_id_fkey (
                id,
                username,
                display_name,
                avatar_url
            ),
            created_at
        `)
        .eq('follower_id', userId)
        .range(page * limit, (page + 1) * limit - 1)
        .order('created_at', { ascending: false });

    if (error) {
        logger.error('Failed to fetch following:', error);
        throw createError.databaseError('Failed to fetch following users');
    }

    const profiles = data.map((d: any) => d.following);

    // If logged in, check which of these profiles the current user is following
    if (currentUser && profiles.length > 0) {
        const profileIds = profiles.map((p: any) => p.id);
        const { data: followingData } = await supabase
            .from('follows')
            .select('following_id')
            .eq('follower_id', currentUser.id)
            .in('following_id', profileIds);

        const followingSet = new Set(followingData?.map((f: any) => f.following_id) || []);

        return profiles.map((p: any) => ({
            ...p,
            is_following: followingSet.has(p.id)
        }));
    }

    return profiles.map((p: any) => ({
        ...p,
        is_following: false
    }));
}
