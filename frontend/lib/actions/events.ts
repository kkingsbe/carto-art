'use server';

import { trackEvent as trackEventInternal, EventType } from '@/lib/events';

interface TrackEventParams {
    eventType: EventType;
    eventName?: string;
    userId?: string;
    sessionId?: string;
    pageUrl?: string;
    metadata?: any;
}

/**
 * Server action to track events from client components.
 */
export async function trackEventAction(params: TrackEventParams) {
    return await trackEventInternal(params);
}
