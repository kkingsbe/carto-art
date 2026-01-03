import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateApiKey } from '@/lib/auth/api-keys';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import { trackEvent } from '@/lib/events';

// Schema for key creation
const CreateKeySchema = z.object({
    name: z.string().min(1, 'Name is required').max(50, 'Name is too long'),
});

export async function GET(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: keys, error } = await (supabase as any)
            .from('api_keys')
            .select('id, name, key_prefix, created_at, last_used_at, is_active, tier')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) {
            logger.error('Failed to fetch API keys', { error, userId: user.id });
            return NextResponse.json({ error: 'Failed to fetch API keys' }, { status: 500 });
        }

        return NextResponse.json({ keys });
    } catch (error) {
        logger.error('Unexpected error in GET /api/v1/auth/keys', { error });
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Parse body
        const body = await req.json().catch(() => ({}));
        const validation = CreateKeySchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: 'Invalid request', details: validation.error.flatten() },
                { status: 400 }
            );
        }

        const { name } = validation.data;

        // Generate new key
        const { apiKey, keyHash } = await generateApiKey();

        // Store in DB
        const { data: newKey, error } = await (supabase as any)
            .from('api_keys')
            .insert({
                user_id: user.id,
                name,
                key_hash: keyHash,
                key_prefix: apiKey.substring(0, 16), // Store longer prefix for uniqueness (ca_live_ + 8 chars)
                tier: 'free', // Default tier
            })
            .select('id, name, created_at, tier')
            .single();

        if (error) {
            logger.error('Failed to create API key', { error, userId: user.id });
            return NextResponse.json({ error: 'Failed to create API key' }, { status: 500 });
        }

        // Track activity
        await trackEvent({
            eventType: 'key_generate',
            eventName: 'API Key Generated',
            userId: user.id,
            metadata: { keyId: newKey.id, keyName: newKey.name }
        });

        // Return the full key ONLY ONCE
        return NextResponse.json({
            key: {
                ...newKey,
                token: apiKey // This is the only time the user sees this
            }
        }, { status: 201 });

    } catch (error) {
        logger.error('Unexpected error in POST /api/v1/auth/keys', { error });
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
