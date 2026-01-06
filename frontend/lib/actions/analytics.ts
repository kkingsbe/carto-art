'use server';

import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { headers } from 'next/headers';
import crypto from 'crypto';

function getVisitorHash(ip: string, userAgent: string): string {
    return crypto.createHash('sha256').update(`${ip}-${userAgent}`).digest('hex');
}

/**
 * Increment view count for a map
 * Includes:
 * - Self-view exclusion
 * - 24h deduplication (by User ID or IP/UserAgent hash)
 * - Detailed tracking in map_views table
 */
export async function incrementMapView(mapId: string) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        // 1. Get Visitor Identity
        const headersList = headers();
        const forwardedFor = headersList.get('x-forwarded-for');
        const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : 'unknown';
        const userAgent = headersList.get('user-agent') || 'unknown';
        const visitorHash = getVisitorHash(ip, userAgent);

        // 2. Check Map Owner
        const { data: map, error: mapError } = await supabase
            .from('maps')
            .select('user_id')
            .eq('id', mapId)
            .single();

        if (mapError || !map) {
            // Map not found, can't track
            return;
        }

        // Don't count owner's views
        if (user && map.user_id === user.id) {
            return;
        }

        // 3. Check for recent views (deduplication)
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

        // Build query to find recent views by this visitor
        let query = supabase.from('map_views')
            .select('id')
            .eq('map_id', mapId)
            .gt('created_at', twentyFourHoursAgo);

        if (user) {
            query = query.eq('viewer_id', user.id);
        } else {
            query = query.eq('ip_hash', visitorHash);
        }

        const { data: existingView } = await query.single();

        if (existingView) {
            // Already viewed recently
            return;
        }

        // 4. Record new view
        const { error: insertError } = await supabase.from('map_views').insert({
            map_id: mapId,
            viewer_id: user?.id || null,
            ip_hash: user ? null : visitorHash
        });

        if (insertError) {
            logger.error('Failed to log map view:', insertError);
            return;
        }

        // 5. Increment counter
        const { error } = await supabase.rpc('increment_map_view', {
            map_id: mapId
        } as any);

        if (error) {
            logger.error('Failed to increment map view counter:', error);
        }
    } catch (err) {
        logger.error('Error in incrementMapView:', err);
    }
}

/**
 * Increment view count for a profile
 * Includes:
 * - Self-view exclusion
 * - 24h deduplication
 * - Detailed tracking in profile_views table
 */
export async function incrementProfileView(profileId: string) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        // 1. Get Visitor Identity
        const headersList = headers();
        const forwardedFor = headersList.get('x-forwarded-for');
        const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : 'unknown';
        const userAgent = headersList.get('user-agent') || 'unknown';
        const visitorHash = getVisitorHash(ip, userAgent);

        // 2. Check Self View
        if (user && user.id === profileId) {
            return;
        }

        // 3. Check for recent views
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

        let query = supabase.from('profile_views')
            .select('id')
            .eq('profile_id', profileId)
            .gt('created_at', twentyFourHoursAgo);

        if (user) {
            query = query.eq('viewer_id', user.id);
        } else {
            query = query.eq('ip_hash', visitorHash);
        }

        const { data: existingView } = await query.single();

        if (existingView) {
            return;
        }

        // 4. Record new view
        const { error: insertError } = await supabase.from('profile_views').insert({
            profile_id: profileId,
            viewer_id: user?.id || null,
            ip_hash: user ? null : visitorHash
        });

        if (insertError) {
            logger.error('Failed to log profile view:', insertError);
            return;
        }

        // 5. Increment counter
        const { error } = await supabase.rpc('increment_profile_view', {
            profile_id: profileId
        } as any);

        if (error) {
            logger.error('Failed to increment profile view counter:', error);
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
        } as any);

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
