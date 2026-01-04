'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { trackEventAction } from '@/lib/actions/events';

export function PageViewTracker() {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    useEffect(() => {
        // Simple session ID generation and persistence
        let sessionId = localStorage.getItem('carto_session_id');
        if (!sessionId) {
            sessionId = crypto.randomUUID();
            localStorage.setItem('carto_session_id', sessionId);
        }

        const url = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;

        trackEventAction({
            eventType: 'page_view',
            pageUrl: url,
            sessionId: sessionId,
        });
    }, [pathname, searchParams]);

    return null;
}
