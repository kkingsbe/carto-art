'use server';

import { createClient } from '@/lib/supabase/server';
import { TrackEventParams } from './types';

/**
 * Tracks a user event in the database for admin analytics.
 * This can be used in Server Actions or API routes.
 */
export async function trackEventInternal(params: TrackEventParams) {
    try {
        const supabase = await createClient();

        // If userId is not provided, try to get it from the current session
        let finalUserId = params.userId;
        if (!finalUserId) {
            const { data: { user } } = await supabase.auth.getUser();
            finalUserId = user?.id;
        }

        const { error } = await (supabase as any)
            .from('page_events')
            .insert([{
                user_id: finalUserId,
                session_id: params.sessionId,
                event_type: params.eventType,
                event_name: params.eventName,
                page_url: params.pageUrl,
                metadata: params.metadata || {}
            }]);

        if (error) {
            console.error('Failed to track event:', error);
        }
    } catch (error) {
        console.error('Error tracking event:', error);
    }
}
