'use client';

import { useEffect } from 'react';
import { trackProfileView } from '@/lib/actions/analytics';

interface ProfileViewTrackerProps {
    targetUserId: string;
}

export function ProfileViewTracker({ targetUserId }: ProfileViewTrackerProps) {
    useEffect(() => {
        // Fire and forget
        trackProfileView(targetUserId);
    }, [targetUserId]);

    return null; // Render nothing
}
