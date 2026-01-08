'use client';

import { useEffect, useRef } from 'react';
import { trackEventAction } from '@/lib/actions/events';
import { getSessionId } from '@/lib/utils';

const HEARTBEAT_INTERVAL = 60000; // 60 seconds

/**
 * Sends periodic heartbeat events while the user is active on the page.
 * Used to track session duration and engagement.
 */
export function SessionHeartbeat() {
    const startTimeRef = useRef(Date.now());
    const heartbeatCountRef = useRef(0);

    useEffect(() => {
        const sessionId = getSessionId();

        const sendHeartbeat = () => {
            heartbeatCountRef.current += 1;
            const sessionDuration = Math.round((Date.now() - startTimeRef.current) / 1000);

            trackEventAction({
                eventType: 'session_heartbeat',
                eventName: 'heartbeat',
                sessionId,
                metadata: {
                    heartbeat_number: heartbeatCountRef.current,
                    session_duration_seconds: sessionDuration,
                    page_visible: document.visibilityState === 'visible',
                    page_url: window.location.pathname
                }
            });
        };

        // Send first heartbeat at interval (not immediately - page_view covers initial load)
        const intervalId = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);

        // Cleanup on unmount
        return () => {
            clearInterval(intervalId);
        };
    }, []);

    return null;
}
