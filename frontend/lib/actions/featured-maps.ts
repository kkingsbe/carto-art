'use server';

import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { isAdmin } from '@/lib/admin-auth';
import { revalidatePath } from 'next/cache';

export interface FeaturedMap {
    id: string;
    title: string;
    description: string | null;
    image_url: string;
    link_url: string;
    display_order: number;
    is_active: boolean;
    created_at: string;
}

export type FeaturedMapInput = Omit<FeaturedMap, 'id' | 'created_at'>;

/**
 * Fetches all featured maps (for admin).
 */
export async function getAllFeaturedMaps() {
    if (!(await isAdmin())) throw new Error('Unauthorized');
    const supabase = createServiceRoleClient();
    // Cast to any to bypass missing type definition for new table
    const { data, error } = await (supabase.from('featured_maps') as any)
        .select('*')
        .order('display_order', { ascending: true });

    if (error) throw new Error(error.message);
    return data as FeaturedMap[];
}

/**
 * Fetches active featured maps (for landing page).
 */
export async function getActiveFeaturedMaps() {
    const supabase = await createClient();
    const { data, error } = await (supabase.from('featured_maps') as any)
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

    if (error) throw new Error(error.message);
    return data as FeaturedMap[];
}

/**
 * Creates a new featured map.
 */
export async function createFeaturedMap(map: FeaturedMapInput) {
    if (!(await isAdmin())) throw new Error('Unauthorized');
    const supabase = createServiceRoleClient();
    const { data, error } = await (supabase.from('featured_maps') as any)
        .insert([map])
        .select()
        .single();

    if (error) {
        console.error('Error creating featured map:', error);
        throw new Error(error.message);
    }
    revalidatePath('/');
    revalidatePath('/admin/featured');
    return data;
}

/**
 * Updates an existing featured map.
 */
export async function updateFeaturedMap(id: string, updates: Partial<FeaturedMapInput>) {
    if (!(await isAdmin())) throw new Error('Unauthorized');
    const supabase = createServiceRoleClient();
    const { data, error } = await (supabase.from('featured_maps') as any)
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw new Error(error.message);
    revalidatePath('/');
    revalidatePath('/admin/featured');
    return data;
}

/**
 * Deletes a featured map.
 */
export async function deleteFeaturedMap(id: string) {
    if (!(await isAdmin())) throw new Error('Unauthorized');
    const supabase = createServiceRoleClient();
    const { error } = await (supabase.from('featured_maps') as any)
        .delete()
        .eq('id', id);

    if (error) throw new Error(error.message);
    revalidatePath('/');
    revalidatePath('/admin/featured');
}

/**
 * Reorders featured maps.
 */
export async function reorderFeaturedMaps(items: { id: string; display_order: number }[]) {
    if (!(await isAdmin())) throw new Error('Unauthorized');
    const supabase = createServiceRoleClient();

    // Cast to any to bypass missing type definition for new table
    const updates = items.map(item =>
        (supabase.from('featured_maps') as any)
            .update({ display_order: item.display_order })
            .eq('id', item.id)
    );

    await Promise.all(updates);
    revalidatePath('/');
    revalidatePath('/admin/featured');
}

/**
 * Searches published maps for the admin selector.
 */
export async function searchPublishedMaps(query: string) {
    const supabase = await createClient();

    let dbQuery = supabase
        .from('maps')
        .select(`
            id,
            title,
            subtitle,
            thumbnail_url,
            vote_score,
            view_count,
            published_at,
            created_at,
            profiles!left (
                username,
                display_name,
                avatar_url
            )
        `)
        .eq('is_published', true)
        .not('published_at', 'is', null)
        .order('published_at', { ascending: false })
        .limit(20);

    if (query.trim()) {
        dbQuery = dbQuery.ilike('title', `%${query}%`);
    }

    const { data, error } = await dbQuery;

    if (error) throw new Error(error.message);

    // Transform to FeedMap shape generally used by MapCard
    // Note: We're doing a simplified transform here matching FeedMap interface
    return data.map((map: any) => ({
        id: map.id,
        title: map.title,
        subtitle: map.subtitle,
        thumbnail_url: map.thumbnail_url,
        vote_score: map.vote_score,
        view_count: map.view_count,
        published_at: map.published_at,
        created_at: map.created_at,
        author: map.profiles ? {
            username: map.profiles.username,
            display_name: map.profiles.display_name,
            avatar_url: map.profiles.avatar_url
        } : {
            username: 'unknown',
            display_name: null,
            avatar_url: null
        }
    }));
}
