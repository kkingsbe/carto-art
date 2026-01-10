'use client';

import { useEffect } from 'react';
import { trackEventAction } from '@/lib/actions/events';
import { getSessionId } from '@/lib/utils';

interface StorePageTrackerProps {
    productCount: number;
    hasDesign: boolean;
}

export function StorePageTracker({ productCount, hasDesign }: StorePageTrackerProps) {
    useEffect(() => {
        trackEventAction({
            eventType: 'store_view',
            eventName: 'store_page_loaded',
            sessionId: getSessionId(),
            metadata: {
                product_count: productCount,
                has_design: hasDesign
            }
        });
    }, [productCount, hasDesign]);

    return null;
}
