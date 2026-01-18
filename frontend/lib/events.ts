// Events tracking stub - no-op for stripped version

export interface TrackEventParams {
  eventType: string;
  eventName?: string;
  metadata?: Record<string, any>;
}

export function trackEvent(params: TrackEventParams | string, properties?: any) {
  // Support both old string-based and new object-based calls
  if (typeof params === 'string') {
    // Legacy string-based call
    console.log('[Events]', params, properties);
  } else {
    // New object-based call
    console.log('[Events]', params.eventType, params);
  }
}
