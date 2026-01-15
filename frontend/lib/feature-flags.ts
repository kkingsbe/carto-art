import { createAnonymousClient } from '@/lib/supabase/server';
import { cache } from 'react';
import type { Database } from '@/types/database';

/**
 * Fetches all enabled feature flags.
 * Uses React cache to avoid redundant hits in a single request.
 */
export const getFeatureFlags = cache(async () => {
    // Use anonymous client to avoid accessing cookies which breaks static generation
    const supabase = createAnonymousClient();
    const { data: flags } = await supabase
        .from('feature_flags')
        .select('*')
        .eq(process.env.NODE_ENV === 'development' ? 'enabled_development' : 'enabled_production', true);

    return flags || [];
});

/**
 * Checks if a specific feature flag is enabled for the current user.
 * Supports:
 * - Global enable/disable
 * - User-specific whitelist
 * - Percentage rollouts (deterministic based on user ID or session)
 */
export async function isFeatureEnabled(key: string, userId?: string, sessionId?: string): Promise<boolean> {
    // Use anonymous client to avoid accessing cookies which breaks static generation
    const supabase = createAnonymousClient();

    // We select * so we get all columns. 
    // We can't easily filter by dynamic column in the query if we want to support 
    // both old and new schema without complex logic. 
    // Ideally we filter in memory or update query after migration.
    // For now, let's fetch all and filter in JS to be safe, or just filter by 'enabled' if using old schema.
    // BUT 'getFeatureFlags' is likely used for client bootstrapping.

    const { data: flags } = await supabase
        .from('feature_flags')
        .select('*');

    // Filter in-memory to handle environment logic
    const isDev = process.env.NODE_ENV === 'development';
    const activeFlags: Database['public']['Tables']['feature_flags']['Row'][] = (flags || []).filter((flag: any) => {
        return isDev
            ? (flag.enabled_development ?? flag.enabled ?? false)
            : (flag.enabled_production ?? flag.enabled ?? false);
    });

    // Find the specific flag by key from the active flags
    const flag = activeFlags.find(f => f.key === key);

    if (!flag) return false;

    // Type assertion to help TypeScript understand the type
    const typedFlag: Database['public']['Tables']['feature_flags']['Row'] = flag;

    // Check environment-specific flags first, fallback to global enabled
    // This handles the transition period where DB might not have new columns yet
    // or if we decide to fallback.
    // Note: TypeScript assumes columns exist based on types, but runtime might vary.
    // We cast to any to safely access potentially missing properties during migration.
    const row = typedFlag as any;
    const isEnvEnabled = isDev
        ? (row.enabled_development ?? row.enabled ?? false)
        : (row.enabled_production ?? row.enabled ?? false);

    if (!isEnvEnabled) return false;

    // Check targeted users
    if (userId && typedFlag.enabled_for_users?.includes(userId)) {
        return true;
    }

    // Check percentage rollout
    if (typedFlag.enabled_percentage && typedFlag.enabled_percentage > 0) {
        if (typedFlag.enabled_percentage === 100) return true;

        const identifier = userId || sessionId || 'anonymous';
        const hash = getSimpleHash(identifier + key);
        return (hash % 100) < typedFlag.enabled_percentage;
    }

    return true; // Global enabled and no other restrictions
}

/**
 * Simple hash function for deterministic rollouts
 */
function getSimpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0; // Convert to 32bit integer
    }
    return Math.abs(hash);
}
