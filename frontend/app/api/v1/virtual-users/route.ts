import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiRequest } from '@/lib/auth/api-middleware';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const CreateVirtualUserSchema = z.object({
    username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain alphanumeric characters, underscores and hyphens'),
    display_name: z.string().min(1).max(50).optional(),
    avatar_url: z.string().url().optional(),
});

export async function GET(req: NextRequest) {
    try {
        const authResult = await authenticateApiRequest(req);
        if (!authResult.success) {
            return NextResponse.json(
                { error: authResult.reason === 'rate_limited' ? 'Too Many Requests' : 'Unauthorized', message: authResult.message },
                { status: authResult.reason === 'rate_limited' ? 429 : 401 }
            );
        }

        const { userId, keyId } = authResult.context;
        const supabase = createServiceRoleClient();

        const { data, error } = await (supabase
            .from('profiles') as any)
            .select('id, username, display_name, avatar_url, created_at')
            .eq('owner_id', userId)
            .eq('api_key_id', keyId)
            .eq('is_virtual', true);

        if (error) {
            logger.error('Failed to list virtual users', { error, userId });
            return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
        }

        return NextResponse.json({ users: data });
    } catch (error) {
        logger.error('Unexpected error in GET /api/v1/virtual-users', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const authResult = await authenticateApiRequest(req);
        if (!authResult.success) {
            return NextResponse.json(
                { error: authResult.reason === 'rate_limited' ? 'Too Many Requests' : 'Unauthorized', message: authResult.message },
                { status: authResult.reason === 'rate_limited' ? 429 : 401 }
            );
        }

        const { userId, keyId } = authResult.context;

        let body;
        try {
            body = await req.json();
        } catch {
            return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
        }

        const validation = CreateVirtualUserSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json({ error: 'Invalid request', details: validation.error.flatten() }, { status: 400 });
        }

        const { username, display_name, avatar_url } = validation.data;
        const supabase = createServiceRoleClient();

        // Check if username is taken
        const { data: existing, error: checkError } = await (supabase
            .from('profiles') as any)
            .select('id')
            .eq('username', username)
            .single();

        if (existing) {
            return NextResponse.json({ error: 'Conflict', message: 'Username is already taken' }, { status: 409 });
        }

        // Create virtual profile
        const { data, error } = await (supabase
            .from('profiles') as any)
            .insert({
                id: crypto.randomUUID(), // Virtual users get a direct UUID since they aren't in auth.users
                username,
                display_name: display_name || username,
                avatar_url,
                is_virtual: true,
                owner_id: userId,
                api_key_id: keyId
            })
            .select()
            .single();

        if (error) {
            logger.error('Failed to create virtual user', { error, userId });
            return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
        }

        return NextResponse.json({ user: data }, { status: 201 });
    } catch (error) {
        logger.error('Unexpected error in POST /api/v1/virtual-users', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
