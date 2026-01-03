import { createClient } from '@/lib/supabase/server';
import { cache } from 'react';

/**
 * Fetches all enabled feature flags.
 * Uses React cache to avoid redundant hits in a single request.
 */
export const getFeatureFlags = cache(async () => {
    const supabase = await createClient();
    const { data: flags } = await supabase
        .from('feature_flags')
        .select('*')
        .eq('enabled', true);

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
    const supabase = await createClient();

    const { data: flag } = await supabase
        .from('feature_flags')
        .select('*')
        .eq('key', key)
        .single();

    if (!flag) return false;
    if (!flag.enabled) return false;

    // Check targeted users
    if (userId && flag.enabled_for_users?.includes(userId)) {
        return true;
    }

    // Check percentage rollout
    if (flag.enabled_percentage && flag.enabled_percentage > 0) {
        if (flag.enabled_percentage === 100) return true;

        const identifier = userId || sessionId || 'anonymous';
        const hash = getSimpleHash(identifier + key);
        return (hash % 100) < flag.enabled_percentage;
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
