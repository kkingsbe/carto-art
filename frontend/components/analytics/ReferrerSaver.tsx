'use client';

import { useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getStoredReferrer } from './PageViewTracker';
import { saveReferrerToProfile } from '@/lib/actions/referrer';

/**
 * Component that saves referrer data to the user's profile after authentication.
 * Should be placed in the app layout so it runs on all pages.
 */
export function ReferrerSaver() {
    const savedRef = useRef(false);
    const supabase = createClient();

    useEffect(() => {
        // Only run once per session
        if (savedRef.current) return;

        const checkAndSave = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const referrerData = getStoredReferrer();
            if (!referrerData) return;

            // Mark as attempted to avoid duplicate calls
            savedRef.current = true;

            // Save referrer to profile
            await saveReferrerToProfile({
                referrer: referrerData.referrer,
                utmSource: referrerData.utmSource,
                utmMedium: referrerData.utmMedium,
                utmCampaign: referrerData.utmCampaign,
            });
        };

        checkAndSave();
    }, [supabase.auth]);

    return null;
}

