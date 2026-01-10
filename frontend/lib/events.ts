import { TrackEventParams } from './events/types';
import { trackEventAction } from './actions/events';

export * from './events/types';

/**
 * Tracks a user event in the database for admin analytics.
 * This handles both client-side and server-side calls.
 */
export async function trackEvent(params: TrackEventParams) {
    if (typeof window === 'undefined') {
        // Server-side: Dynamically import to avoid bundling server code in client
        const { trackEventInternal } = await import('./events/server');
        return trackEventInternal(params);
    } else {
        // Client-side: Use the server action
        return trackEventAction(params);
    }
}
