import { createServerClient } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database';
import { SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, getRequiredEnv } from '@/lib/utils/env';

export async function createClient() {
  const cookieStore = await cookies();

  // Validate env vars when client is created, not at module load time
  const url = SUPABASE_URL || getRequiredEnv('NEXT_PUBLIC_SUPABASE_URL');
  const key = SUPABASE_ANON_KEY || getRequiredEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');

  return createServerClient<Database>(
    url,
    key,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}

/**
 * Create an anonymous Supabase client without cookies
 * Use this for cached functions or queries that don't require authentication
 * This avoids the "cookies() inside unstable_cache()" error
 */
export function createAnonymousClient() {
  // Validate env vars when client is created, not at module load time
  const url = SUPABASE_URL || getRequiredEnv('NEXT_PUBLIC_SUPABASE_URL');
  const key = SUPABASE_ANON_KEY || getRequiredEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');

  return createSupabaseClient<Database>(url, key);
}

/**
 * Create a Supabase client with the SERVICE_ROLE key
 * Use this ONLY for server-side admin tasks that need to bypass RLS
 * NEVER expose this client or the key to the client-side
 */
export function createServiceRoleClient() {
  const url = SUPABASE_URL || getRequiredEnv('NEXT_PUBLIC_SUPABASE_URL');
  const key = SUPABASE_SERVICE_ROLE_KEY || getRequiredEnv('SUPABASE_SERVICE_ROLE_KEY');

  return createSupabaseClient<Database>(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

