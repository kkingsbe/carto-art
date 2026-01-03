import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

/**
 * Checks if the current user is an admin.
 * Can be used in Server Components and API routes.
 */
export async function isAdmin(): Promise<boolean> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return false;

    const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();

    return !!profile?.is_admin;
}

/**
 * Protects a server action or API route by ensuring the user is an admin.
 * Throws an error or redirects if not authorized.
 */
export async function ensureAdmin() {
    const isUserAdmin = await isAdmin();
    if (!isUserAdmin) {
        throw new Error('Unauthorized: Admin access required');
    }
}

/**
 * Redirects to the login or home page if the user is not an admin.
 * Primarily for use in Server Components (Pages).
 */
export async function protectAdminPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/auth/login?next=/admin');
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();

    if (!profile?.is_admin) {
        redirect('/');
    }
}
