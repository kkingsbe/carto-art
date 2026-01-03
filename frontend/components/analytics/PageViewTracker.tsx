'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { trackEventAction } from '@/lib/actions/events';

export function PageViewTracker() {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    useEffect(() => {
        const url = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;

        trackEventAction({
            eventType: 'page_view',
            pageUrl: url,
        });
    }, [pathname, searchParams]);

    return null;
}
