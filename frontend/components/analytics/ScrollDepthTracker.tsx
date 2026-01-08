'use client';

import { useEffect, useRef } from 'react';
import { trackEventAction } from '@/lib/actions/events';
import { getSessionId } from '@/lib/utils';

interface ScrollDepthTrackerProps {
    /** Thresholds at which to track scroll depth (default: [25, 50, 75, 100]) */
    thresholds?: number[];
}

/**
 * Tracks scroll depth milestones (25%, 50%, 75%, 100%) on scrollable pages.
 * Only tracks each threshold once per page load.
 */
export function ScrollDepthTracker({ thresholds = [25, 50, 75, 100] }: ScrollDepthTrackerProps) {
    const trackedThresholdsRef = useRef<Set<number>>(new Set());
    const sessionIdRef = useRef<string | null>(null);

    useEffect(() => {
        sessionIdRef.current = getSessionId();

        const handleScroll = () => {
            const scrollTop = window.scrollY;
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;

            if (docHeight <= 0) return; // No scrolling possible

            const scrollPercent = Math.round((scrollTop / docHeight) * 100);

            for (const threshold of thresholds) {
                if (scrollPercent >= threshold && !trackedThresholdsRef.current.has(threshold)) {
                    trackedThresholdsRef.current.add(threshold);

                    trackEventAction({
                        eventType: 'scroll_depth',
                        eventName: `scroll_${threshold}_percent`,
                        sessionId: sessionIdRef.current || undefined,
                        pageUrl: window.location.pathname,
                        metadata: {
                            threshold,
                            actual_percent: scrollPercent,
                            page_height: document.documentElement.scrollHeight
                        }
                    });
                }
            }
        };

        // Throttle scroll handler
        let ticking = false;
        const throttledScroll = () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    handleScroll();
                    ticking = false;
                });
                ticking = true;
            }
        };

        window.addEventListener('scroll', throttledScroll, { passive: true });

        return () => {
            window.removeEventListener('scroll', throttledScroll);
        };
    }, [thresholds]);

    return null;
}
