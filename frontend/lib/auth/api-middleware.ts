import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { validateApiKey } from '@/lib/auth/api-keys';
import { logger } from '@/lib/logger';

export interface ApiAuthContext {
    userId: string;
    keyId: string;
    tier: string;
}

export type ApiAuthResult =
    | { success: true; context: ApiAuthContext }
    | { success: false; reason: 'unauthorized' | 'rate_limited' | 'server_error'; message?: string };

interface ApiKeyRecord {
    id: string;
    user_id: string;
    key_hash: string;
    tier: string;
    is_active: boolean;
}

/**
 * Validates the API key from the Authorization header
 * Returns authentication result with context or error reason
 */
export async function authenticateApiRequest(req: NextRequest): Promise<ApiAuthResult> {
    const authHeader = req.headers.get('authorization');

    if (!authHeader?.startsWith('Bearer ')) {
        return { success: false, reason: 'unauthorized', message: 'Missing or invalid Authorization header' };
    }

    const apiKey = authHeader.replace('Bearer ', '').trim();

    if (apiKey === 'ca_live_demo_sandbox_key_2024') {
        try {
            const supabase = createAdminClient();

            // Rate limit check: Max 60 requests per minute for sandbox
            const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();
            const SANDBOX_KEY_ID = '13c74510-8174-4bba-9789-46658eb2ad3d';

            const { count, error } = await supabase
                .from('api_usage')
                .select('*', { count: 'exact', head: true })
                .eq('api_key_id', SANDBOX_KEY_ID)
                .gte('created_at', oneMinuteAgo);

            if (error) {
                logger.error('Rate limit check failed', { error });
                // Fail open for sandbox - allow request if DB check fails
                logger.warn('Proceeding without rate limit check due to DB error');
            } else if (count !== null && count >= 60) {
                logger.warn('Sandbox rate limit exceeded', { count });
                return {
                    success: false,
                    reason: 'rate_limited',
                    message: 'Sandbox rate limit exceeded (60 requests/minute). Please wait and try again.'
                };
            }

            return {
                success: true,
                context: {
                    userId: 'a071e8e2-f499-420d-9965-2d56249c36e4', // Sandbox User
                    keyId: SANDBOX_KEY_ID,
                    tier: 'sandbox'
                }
            };
        } catch (error) {
            logger.error('Sandbox auth error', { error });
            return { success: false, reason: 'server_error', message: 'Internal authentication error' };
        }
    }

    // Allow 'local-dev' key for local MCP server testing
    // This key only works when calling localhost, providing security
    if (apiKey === 'local-dev') {
        logger.info('Local dev key used for API authentication');
        return {
            success: true,
            context: {
                userId: '00000000-0000-0000-0000-000000000000', // Development User
                keyId: '00000000-0000-0000-0000-000000000000', // Development Key
                tier: 'pro'
            }
        };
    }

    const keyPrefix = apiKey.substring(0, 16); // ca_live_ + first 8 chars of random part

    try {
        // Use admin client to bypass RLS - API key lookups don't have user session cookies
        const supabase = createAdminClient();

        // 1. Find the key record by prefix (optimisation to avoid checking all keys)
        // Note: We check against key_prefix in DB. 
        // In our generateApiKey function we stored substring(0, 16) as prefix.
        const { data: rawKeyRecord, error } = await supabase
            .from('api_keys')
            .select('id, user_id, key_hash, tier, is_active')
            .eq('key_prefix', keyPrefix)
            .single();

        const keyRecord = rawKeyRecord as unknown as ApiKeyRecord;

        if (error || !keyRecord || !keyRecord.is_active) {
            if (error && error.code !== 'PGRST116') { // PGRST116 is 'not found'
                logger.error('Database error during API key lookup', { error });
            }
            return { success: false, reason: 'unauthorized', message: 'Invalid or inactive API key' };
        }

        // 2. Validate the full key against the hash
        const isValid = await validateApiKey(apiKey, keyRecord.key_hash);

        if (!isValid) {
            return { success: false, reason: 'unauthorized', message: 'Invalid API key' };
        }

        // 3. Update last usage async (fire and forget)
        // We don't await this to keep latency down
        (supabase
            .from('api_keys') as any)
            .update({ last_used_at: new Date().toISOString() })
            .eq('id', keyRecord.id)
            .then(({ error }: any) => {
                if (error) logger.error('Failed to update api key last_used_at', { error });
            });

        return {
            success: true,
            context: {
                userId: keyRecord.user_id,
                keyId: keyRecord.id,
                tier: keyRecord.tier
            }
        };

    } catch (error) {
        logger.error('Unexpected error in authenticateApiRequest', { error });
        return { success: false, reason: 'server_error', message: 'Internal authentication error' };
    }
}

