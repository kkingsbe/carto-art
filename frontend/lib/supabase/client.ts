import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database';
import { SUPABASE_URL, SUPABASE_ANON_KEY, getRequiredEnv } from '@/lib/utils/env';

export function createClient() {
  // Validate env vars when client is created, not at module load time
  const url = SUPABASE_URL || getRequiredEnv('NEXT_PUBLIC_SUPABASE_URL');
  const key = SUPABASE_ANON_KEY || getRequiredEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  
  return createBrowserClient<Database>(url, key);
}

