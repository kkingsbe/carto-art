'use client';

import { useState, useEffect } from 'react';

/**
 * Hook to check if a feature flag is enabled on the client side.
 * Note: For better performance/UX, consider passing flag state 
 * from Server Components via props or context.
 */
export function useFeatureFlag(key: string): boolean {
    const [enabled, setEnabled] = useState(false);

    useEffect(() => {
        // We call a public API or check a context
        // For now, let's assume we have a public-ish endpoint for flags
        // or we just fetch it once.
        async function checkFlag() {
            try {
                const res = await fetch(`/api/feature-flags/${key}`);
                if (res.ok) {
                    const data = await res.json();
                    setEnabled(data.enabled);
                }
            } catch (err) {
                console.error(`Error checking feature flag ${key}:`, err);
            }
        }

        checkFlag();
    }, [key]);

    return enabled;
}
