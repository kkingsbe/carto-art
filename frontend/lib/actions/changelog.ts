'use server';

import { createClient, createAnonymousClient } from '@/lib/supabase/server';
import { revalidatePath, unstable_cache } from 'next/cache';

export interface ChangelogEntry {
    id: string;
    title: string;
    description: string;
    published_at: string;
    is_published: boolean;
    created_at: string;
    updated_at: string;
}

/**
 * Fetches published changelog entries for the public feed
 */
async function fetchPublishedEntries(): Promise<ChangelogEntry[]> {
    const supabase = createAnonymousClient();
    const { data, error } = await (supabase.from('changelog_entries' as any) as any)
        .select('*')
        .eq('is_published', true)
        .lte('published_at', new Date().toISOString())
        .order('published_at', { ascending: false });

    if (error) {
        console.error('Error fetching changelog entries:', error);
        return [];
    }

    return data as ChangelogEntry[];
}

/**
 * Get published changelog entries with caching
 */
export const getPublishedChangelog = unstable_cache(
    async () => fetchPublishedEntries(),
    ['public-changelog'],
    {
        revalidate: 3600, // 1 hour
        tags: ['changelog'],
    }
);

/**
 * Fetches all changelog entries (Admin only)
 */
export async function getAllChangelogEntries(): Promise<ChangelogEntry[]> {
    const supabase = await createClient();
    const { data, error } = await (supabase.from('changelog_entries' as any) as any)
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching all changelog entries:', error);
        throw new Error('Failed to fetch changelog entries');
    }

    return data as ChangelogEntry[];
}

/**
 * Creates a new changelog entry (Admin only)
 */
export async function createChangelogEntry(data: Partial<ChangelogEntry>) {
    const supabase = await createClient();
    const { data: entry, error } = await (supabase.from('changelog_entries' as any) as any)
        .insert([data])
        .select()
        .single();

    if (error) {
        console.error('Error creating changelog entry:', error);
        throw new Error(error.message);
    }

    revalidatePath('/');
    return entry;
}

/**
 * Updates an existing changelog entry (Admin only)
 */
export async function updateChangelogEntry(id: string, data: Partial<ChangelogEntry>) {
    const supabase = await createClient();
    const { data: entry, error } = await (supabase.from('changelog_entries' as any) as any)
        .update(data)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error updating changelog entry:', error);
        throw new Error(error.message);
    }

    revalidatePath('/');
    return entry;
}

/**
 * Deletes a changelog entry (Admin only)
 */
export async function deleteChangelogEntry(id: string) {
    const supabase = await createClient();
    const { error } = await (supabase.from('changelog_entries' as any) as any)
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting changelog entry:', error);
        throw new Error(error.message);
    }

    revalidatePath('/');
    return true;
}
