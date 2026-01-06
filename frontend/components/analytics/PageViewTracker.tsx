'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { trackEventAction } from '@/lib/actions/events';
import { getSessionId } from '@/lib/utils';

export function PageViewTracker() {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    useEffect(() => {
        const sessionId = getSessionId();
        const url = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;

        trackEventAction({
            eventType: 'page_view',
            pageUrl: url,
            sessionId: sessionId,
        });
    }, [pathname, searchParams]);

    return null;
}
