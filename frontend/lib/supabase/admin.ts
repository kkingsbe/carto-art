import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';
import { getRequiredEnv } from '@/lib/utils/env';

export function createAdminClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || getRequiredEnv('NEXT_PUBLIC_SUPABASE_URL');
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || getRequiredEnv('SUPABASE_SERVICE_ROLE_KEY');

    return createClient<Database>(url, key, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });
}
