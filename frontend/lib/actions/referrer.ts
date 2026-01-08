'use server';

import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

interface SaveReferrerParams {
    referrer: string;
    utmSource?: string | null;
    utmMedium?: string | null;
    utmCampaign?: string | null;
}

/**
 * Save referrer data to the current user's profile.
 * Should be called once after auth callback when referrer data is available.
 */
export async function saveReferrerToProfile(params: SaveReferrerParams): Promise<{ success: boolean; error?: string }> {
    try {
        const supabase = await createClient();

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return { success: false, error: 'Not authenticated' };
        }

        // Check if user already has referrer data (don't overwrite)
        // Using 'as any' because referrer_source column is added via migration
        const { data: profile } = await (supabase as any)
            .from('profiles')
            .select('referrer_source')
            .eq('id', user.id)
            .single();

        if (profile?.referrer_source) {
            // Already has referrer, skip
            return { success: true };
        }

        // Update profile with referrer data
        // Using 'as any' because columns are added via migration
        const { error } = await (supabase as any)
            .from('profiles')
            .update({
                referrer_source: params.referrer || 'Direct',
                utm_source: params.utmSource || null,
                utm_medium: params.utmMedium || null,
                utm_campaign: params.utmCampaign || null,
            })
            .eq('id', user.id);

        if (error) {
            logger.error('Failed to save referrer to profile:', error);
            return { success: false, error: error.message };
        }

        logger.info(`Saved referrer data for user ${user.id}: ${params.referrer}`);
        return { success: true };
    } catch (error) {
        logger.error('Error in saveReferrerToProfile:', error);
        return { success: false, error: 'Internal error' };
    }
}
