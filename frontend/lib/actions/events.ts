// Stub file for analytics tracking - no-op for anonymous version

export interface TrackEventParams {
  eventType: string;
  eventName?: string;
  sessionId?: string;
  metadata?: Record<string, any>;
}

export async function trackEventAction(params: TrackEventParams | string, data?: any): Promise<void> {
  // Support both old string-based and new object-based calls
  if (typeof params === 'string') {
    // Legacy string-based call
    console.log('[Analytics]', params, data);
  } else {
    // New object-based call
    console.log('[Analytics]', params.eventType, params);
  }
}
