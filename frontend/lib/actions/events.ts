'use server';

import { trackEventInternal } from '@/lib/events/server';
import { EventType, TrackEventParams } from '@/lib/events/types';

/**
 * Server action to track events from client components.
 */
export async function trackEventAction(params: TrackEventParams) {
    return await trackEventInternal(params);
}

