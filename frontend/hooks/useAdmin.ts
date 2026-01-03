import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export function useAdmin() {
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        const checkAdmin = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    setIsAdmin(false);
                    setLoading(false);
                    return;
                }

                const { data: profile } = await supabase
                    .from('profiles')
                    .select('is_admin')
                    .eq('id', user.id)
                    .single();

                setIsAdmin(!!profile?.is_admin);
            } catch (error) {
                // console.error('Error checking admin status:', error);
                setIsAdmin(false);
            } finally {
                setLoading(false);
            }
        };

        // Initial check
        checkAdmin();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
            // Re-check verification on auth state change (login/logout)
            checkAdmin();
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [supabase]);

    return { isAdmin, loading };
}
