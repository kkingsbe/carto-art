'use server';

import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

/**
 * Increment view count for a map
 * Using RPC to ensure atomic updates and avoid RLS issues with direct updates
 */
export async function incrementMapView(mapId: string) {
    try {
        const supabase = await createClient();

        // We don't await this to keep the UI snappy
        const { error } = await supabase.rpc('increment_map_view', {
            map_id: mapId
        } as any);

        if (error) {
            logger.error('Failed to increment map view:', error);
        }
    } catch (err) {
        logger.error('Error in incrementMapView:', err);
    }
}

/**
 * Increment view count for a profile
 * Using RPC to ensure atomic updates
 */
export async function incrementProfileView(profileId: string) {
    try {
        const supabase = await createClient();

        // We don't await this to keep the UI snappy
        const { error } = await supabase.rpc('increment_profile_view', {
            profile_id: profileId
        } as any);

        if (error) {
            logger.error('Failed to increment profile view:', error);
        }
    } catch (err) {
        logger.error('Error in incrementProfileView:', err);
    }
}

/**
 * Track a profile view and trigger notification if applicable
 * Rules:
 * - Don't track own profile views
 * - Only notify once every 24 hours per viewer -> profile pair
 */
interface TrackProfileViewResult {
    success: boolean;
    notified: boolean;
}

export async function trackProfileView(targetUserId: string): Promise<TrackProfileViewResult> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, notified: false };
    }

    // Don't track self-views
    if (user.id === targetUserId) {
        return { success: false, notified: false };
    }

    try {
        // Check for recent notification (last 24h)
        const { data: recentNotification } = await supabase
            .from('notifications')
            .select('created_at')
            .eq('recipient_id', targetUserId)
            .eq('actor_id', user.id)
            .eq('type', 'PROFILE_VIEW')
            .gt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
            .single();

        if (recentNotification) {
            // Already notified recently
            return { success: true, notified: false };
        }

        // Insert new notification
        const { error } = await supabase.from('notifications').insert({
            recipient_id: targetUserId,
            actor_id: user.id,
            type: 'PROFILE_VIEW'
        } as any); // Type cast as 'PROFILE_VIEW' might not be in generated types yet

        if (error) {
            logger.error('Failed to create profile view notification:', error);
            return { success: false, notified: false };
        }

        return { success: true, notified: true };
    } catch (error) {
        logger.error('Error tracking profile view:', error);
        return { success: false, notified: false };
    }
}
