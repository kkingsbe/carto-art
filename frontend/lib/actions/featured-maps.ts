'use server';

import { createClient } from '@/lib/supabase/server';
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
    const supabase = await createClient();
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
    const supabase = await createClient();
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
    const supabase = await createClient();
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
    const supabase = await createClient();
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
    const supabase = await createClient();

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
