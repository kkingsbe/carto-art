'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { getUserProfile } from '@/lib/actions/user';

export function useUserSubscription() {
    const [subscriptionTier, setSubscriptionTier] = useState<'free' | 'carto_plus'>('free');
    const [user, setUser] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const searchParams = useSearchParams();



    useEffect(() => {
        let isMounted = true;
        const checkSuccessParam = searchParams?.get('success') === 'true';
        let attempts = 0;
        // If coming back from success, poll more aggressively (e.g., 10 times over 20 seconds or so)
        // Otherwise just fetch once.
        const maxAttempts = checkSuccessParam ? 10 : 1;

        const fetchSubscription = async () => {
            try {
                const supabase = createClient();
                const { data: { user } } = await supabase.auth.getUser();

                if (isMounted) {
                    setUser(user);
                }

                if (user) {
                    const poll = async () => {
                        if (!isMounted) return;

                        // If we've exceeded max attempts, we stop polling and leave it as is (or final check)
                        if (attempts >= maxAttempts) {
                            if (isMounted) setIsLoading(false);
                            return;
                        }

                        attempts++;

                        try {
                            const profile = await getUserProfile(user.id);

                            // If we found the upgrade, or if we are not looking for an upgrade (normal load), we can stop.
                            // Normal load: maxAttempts = 1. We get profile, set it, done.
                            // Success load: maxAttempts = 10. We look for 'carto_plus'. 
                            // If we find 'carto_plus', we set it and done.
                            // If we find 'free' AND we are in success mode, we wait and retry.

                            if (profile) {
                                const tier = profile.subscription_tier || 'free';

                                if (tier === 'carto_plus') {
                                    if (isMounted) {
                                        setSubscriptionTier('carto_plus');
                                        setIsLoading(false);
                                    }
                                    return; // Success!
                                }

                                // If we are here, it means tier is likely 'free'.
                                // If we are not in success mode, that's just the state.
                                if (!checkSuccessParam) {
                                    if (isMounted) {
                                        setSubscriptionTier('free');
                                        setIsLoading(false);
                                    }
                                    return;
                                }

                                // If we ARE in success mode and still free, retry.
                                setTimeout(poll, 2000); // Retry every 2 seconds
                            } else {
                                // Profile fetch failed or returned null?
                                // If null, maybe user not fully created? Retry if strict?
                                // For now, treat as free/error and stop unless we want to be very robust.
                                // Assuming profile should exist if user exists.
                                if (isMounted) setIsLoading(false);
                            }
                        } catch (err) {
                            console.error('Error fetching profile during poll', err);
                            // If error, maybe retry if polling?
                            if (checkSuccessParam && attempts < maxAttempts) {
                                setTimeout(poll, 2000);
                            } else {
                                if (isMounted) setIsLoading(false);
                            }
                        }
                    };

                    await poll();
                } else {
                    if (isMounted) setIsLoading(false);
                }
            } catch (error) {
                console.error('Failed to fetch subscription status', error);
                if (isMounted) setIsLoading(false);
            }
        };

        fetchSubscription();

        return () => {
            isMounted = false;
        };
    }, [searchParams]);

    return { subscriptionTier, isLoading, user, isAuthenticated: !!user };
}
