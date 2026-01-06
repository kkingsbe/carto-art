'use server';

import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { CONFIG_KEYS, type ExportUsageResult, type ProjectUsageResult } from './usage.types';
export { CONFIG_KEYS, type ExportUsageResult, type ProjectUsageResult };

/**
 * Default values if config is not in database
 */
const DEFAULT_CONFIG: Record<string, number> = {
    [CONFIG_KEYS.FREE_TIER_DAILY_EXPORT_LIMIT]: 5,
    [CONFIG_KEYS.FREE_TIER_PROJECT_LIMIT]: 3,
    [CONFIG_KEYS.ANON_DAILY_EXPORT_LIMIT]: 2,
};

/**
 * Get a site configuration value
 */
export async function getSiteConfig(key: string): Promise<number> {
    const supabase = await createClient();

    const { data, error } = await (supabase as any)
        .from('site_config')
        .select('value')
        .eq('key', key)
        .single();

    if (error || !data) {
        logger.warn(`Config key "${key}" not found, using default`);
        return DEFAULT_CONFIG[key] ?? 0;
    }

    // Value is stored as JSONB, parse it
    const value = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
    return typeof value === 'number' ? value : parseInt(value, 10);
}

/**
 * Get exports in the last 24 hours for a user
 * Returns the count and the timestamp of the oldest export (for countdown)
 */
export async function getDailyExportCount(userId: string): Promise<{
    count: number;
    oldestExportAt: string | null;
}> {
    const supabase = await createClient();
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await (supabase as any)
        .from('page_events')
        .select('created_at')
        .eq('user_id', userId)
        .eq('event_type', 'poster_export')
        .gte('created_at', twentyFourHoursAgo)
        .order('created_at', { ascending: true });

    if (error) {
        logger.error('Failed to fetch export count:', error);
        return { count: 0, oldestExportAt: null };
    }

    return {
        count: data?.length ?? 0,
        oldestExportAt: data?.[0]?.created_at ?? null,
    };
}

/**
 * Get total project count for a user
 */
export async function getProjectCount(userId: string): Promise<number> {
    const supabase = await createClient();

    const { count, error } = await supabase
        .from('maps')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

    if (error) {
        logger.error('Failed to fetch project count:', error);
        return 0;
    }

    return count ?? 0;
}

/**
 * Check if user can export based on their subscription tier
 * Returns usage info including countdown for next available export
 */
export async function checkExportLimit(
    userId: string | null,
    subscriptionTier: 'free' | 'carto_plus'
): Promise<ExportUsageResult> {
    // Carto Plus users have unlimited exports
    if (subscriptionTier === 'carto_plus') {
        return {
            allowed: true,
            used: 0,
            limit: Infinity,
            remaining: Infinity,
            nextAvailableAt: null,
        };
    }

    // Anonymous users - allow limited exports (tracked client-side)
    if (!userId) {
        const limit = await getSiteConfig(CONFIG_KEYS.ANON_DAILY_EXPORT_LIMIT);
        return {
            allowed: true, // This is just initial state, effective check happens in UI with local storage
            used: 0,
            limit,
            remaining: limit,
            nextAvailableAt: null,
        };
    }

    const [{ count, oldestExportAt }, limit] = await Promise.all([
        getDailyExportCount(userId),
        getSiteConfig(CONFIG_KEYS.FREE_TIER_DAILY_EXPORT_LIMIT),
    ]);

    const remaining = Math.max(0, limit - count);
    const allowed = count < limit;

    // Calculate when the oldest export will "expire" (24hrs after it was made)
    let nextAvailableAt: string | null = null;
    if (!allowed && oldestExportAt) {
        const expiresAt = new Date(new Date(oldestExportAt).getTime() + 24 * 60 * 60 * 1000);
        nextAvailableAt = expiresAt.toISOString();
    }

    return {
        allowed,
        used: count,
        limit,
        remaining,
        nextAvailableAt,
    };
}

/**
 * Check if user can create a new project based on their subscription tier
 */
export async function checkProjectLimit(
    userId: string | null,
    subscriptionTier: 'free' | 'carto_plus'
): Promise<ProjectUsageResult> {
    // Carto Plus users have unlimited projects
    if (subscriptionTier === 'carto_plus') {
        return {
            allowed: true,
            used: 0,
            limit: Infinity,
            remaining: Infinity,
        };
    }

    // Anonymous users use local storage, no server-side limit
    if (!userId) {
        return {
            allowed: true,
            used: 0,
            limit: 3,
            remaining: 3,
        };
    }

    const [count, limit] = await Promise.all([
        getProjectCount(userId),
        getSiteConfig(CONFIG_KEYS.FREE_TIER_PROJECT_LIMIT),
    ]);

    const remaining = Math.max(0, limit - count);

    return {
        allowed: count < limit,
        used: count,
        limit,
        remaining,
    };
}
