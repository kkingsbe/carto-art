import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database';
import { SUPABASE_URL, SUPABASE_ANON_KEY, getRequiredEnv } from '@/lib/utils/env';

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

