'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { trackEventAction } from '@/lib/actions/events';
import { getSessionId } from '@/lib/utils';

// Storage key for initial referrer data
const REFERRER_STORAGE_KEY = 'carto_initial_referrer';

export interface ReferrerData {
    referrer: string;
    utmSource: string | null;
    utmMedium: string | null;
    utmCampaign: string | null;
    capturedAt: string;
}

/**
 * Gets the stored initial referrer data, if any.
 */
export function getStoredReferrer(): ReferrerData | null {
    if (typeof window === 'undefined') return null;
    const stored = sessionStorage.getItem(REFERRER_STORAGE_KEY);
    if (!stored) return null;
    try {
        return JSON.parse(stored);
    } catch {
        return null;
    }
}

/**
 * Parses the referrer URL to get a clean domain/source name.
 */
function parseReferrerSource(referrer: string): string {
    if (!referrer) return 'Direct';
    try {
        const url = new URL(referrer);
        // Remove www. prefix for cleaner display
        return url.hostname.replace(/^www\./, '');
    } catch {
        return referrer || 'Direct';
    }
}

export function PageViewTracker() {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    useEffect(() => {
        const sessionId = getSessionId();
        const url = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;

        // Capture referrer data on first visit (only once per session)
        if (!sessionStorage.getItem(REFERRER_STORAGE_KEY)) {
            const referrerData: ReferrerData = {
                referrer: parseReferrerSource(document.referrer),
                utmSource: searchParams.get('utm_source'),
                utmMedium: searchParams.get('utm_medium'),
                utmCampaign: searchParams.get('utm_campaign'),
                capturedAt: new Date().toISOString(),
            };
            sessionStorage.setItem(REFERRER_STORAGE_KEY, JSON.stringify(referrerData));
        }

        trackEventAction({
            eventType: 'page_view',
            pageUrl: url,
            sessionId: sessionId,
        });

        // Return visit detection (localStorage persists across sessions)
        const LAST_VISIT_KEY = 'carto_last_visit';
        const RETURN_VISIT_THRESHOLD = 24 * 60 * 60 * 1000; // 24 hours

        const lastVisit = localStorage.getItem(LAST_VISIT_KEY);
        const now = Date.now();

        if (lastVisit) {
            const lastVisitTime = parseInt(lastVisit, 10);
            const timeSinceLastVisit = now - lastVisitTime;

            // If more than 24 hours since last visit, this is a return visit
            if (timeSinceLastVisit > RETURN_VISIT_THRESHOLD) {
                trackEventAction({
                    eventType: 'return_visit',
                    eventName: 'user_returned',
                    sessionId,
                    metadata: {
                        days_since_last_visit: Math.floor(timeSinceLastVisit / (24 * 60 * 60 * 1000)),
                        hours_since_last_visit: Math.floor(timeSinceLastVisit / (60 * 60 * 1000))
                    }
                });
            }
        }

        // Update last visit timestamp
        localStorage.setItem(LAST_VISIT_KEY, now.toString());
    }, [pathname, searchParams]);

    return null;
}

