import { createClient } from '@/lib/supabase/server';

export type EventType =
    | 'signup'
    | 'map_create'
    | 'map_publish'
    | 'poster_export'
    | 'key_generate'
    | 'page_view'
    | 'click'
    | 'api_call'
    | 'search_location'
    | 'style_change'
    | 'layer_toggle'
    | 'interaction'
    | 'format_change'
    | 'palette_change'
    // Retention & Funnel Events
    | 'editor_open'
    | 'editor_abandon'
    | 'export_start'
    | 'export_fail'
    | 'export_abandon'
    | 'paywall_shown'
    | 'session_heartbeat'
    | 'scroll_depth'
    | 'return_visit'
    | 'notification_click';

/**
 * Tracks a user event in the database for admin analytics.
 * This can be used in Server Actions or API routes.
 */
export async function trackEvent(params: {
    eventType: EventType;
    eventName?: string;
    userId?: string;
    sessionId?: string;
    pageUrl?: string;
    metadata?: any;
}) {
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
