'use client';

import { useEffect, useRef } from 'react';
import { incrementMapView, incrementProfileView } from '@/lib/actions/analytics';

interface ViewTrackerProps {
    type: 'map' | 'profile';
    id: string;
}

export function ViewTracker({ type, id }: ViewTrackerProps) {
    const tracked = useRef(false);

    useEffect(() => {
        if (tracked.current) return;

        // Prevent double tracking in strict mode or re-renders
        tracked.current = true;

        // Use session storage to tracking within a session
        const storageKey = `viewed_${type}_${id}`;
        if (sessionStorage.getItem(storageKey)) {
            return;
        }

        sessionStorage.setItem(storageKey, 'true');

        if (type === 'map') {
            incrementMapView(id);
        } else {
            incrementProfileView(id);
        }
    }, [type, id]);

    return null;
}
