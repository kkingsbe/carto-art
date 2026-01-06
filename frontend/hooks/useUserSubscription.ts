'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getUserProfile } from '@/lib/actions/user';
import type { UserProfile } from '@/lib/actions/user';

export function useUserSubscription() {
    const [subscriptionTier, setSubscriptionTier] = useState<'free' | 'carto_plus'>('free');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchSubscription = async () => {
            try {
                const supabase = createClient();
                const { data: { user } } = await supabase.auth.getUser();

                if (user) {
                    const profile = await getUserProfile(user.id);
                    if (profile) {
                        // Default to free if undefined, but it should be typed correctly now
                        setSubscriptionTier(profile.subscription_tier || 'free');
                    }
                }
            } catch (error) {
                console.error('Failed to fetch subscription status', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSubscription();
    }, []);

    return { subscriptionTier, isLoading };
}
