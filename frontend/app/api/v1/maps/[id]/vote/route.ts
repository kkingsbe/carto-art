
import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiRequest } from '@/lib/auth/api-middleware';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const VoteSchema = z.object({
    value: z.number().refine(val => val === 1 || val === -1, {
        message: "Value must be 1 or -1"
    })
});

export async function POST(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const { id: mapId } = await context.params;

    try {
        const authResult = await authenticateApiRequest(req);
        if (!authResult.success) {
            return NextResponse.json(
                { error: authResult.reason === 'rate_limited' ? 'Too Many Requests' : 'Unauthorized', message: authResult.message },
                { status: authResult.reason === 'rate_limited' ? 429 : 401 }
            );
        }
        const { userId } = authResult.context;

        let body;
        try {
            const rawBody = await req.text();
            body = rawBody ? JSON.parse(rawBody) : {};
        } catch (e) {
            return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
        }

        const validation = VoteSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json({ error: 'Invalid request', details: validation.error.flatten() }, { status: 400 });
        }

        const { value } = validation.data;
        const supabase = createServiceRoleClient();

        // Check if map exists and is published (optional but good practice)
        // For efficiency we might skip this if the foreign key constraint handles it,
        // but checking is_published is important business logic.
        const { data: map } = await (supabase.from('maps') as any).select('is_published').eq('id', mapId).single();
        if (!map) {
            return NextResponse.json({ error: 'Map not found' }, { status: 404 });
        }
        if (!map.is_published) {
            return NextResponse.json({ error: 'Map is not published' }, { status: 403 });
        }

        const { error } = await (supabase
            .from('votes') as any)
            .upsert({
                user_id: userId,
                map_id: mapId,
                value,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'user_id,map_id'
            });

        if (error) {
            logger.error('API Vote Error', { error, userId, mapId });
            return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
        }

        return NextResponse.json({ message: 'Vote recorded' }, { status: 200 });

    } catch (error) {
        logger.error('Unexpected error in POST /maps/[id]/vote', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const { id: mapId } = await context.params;

    try {
        const authResult = await authenticateApiRequest(req);
        if (!authResult.success) {
            return NextResponse.json(
                { error: authResult.reason === 'rate_limited' ? 'Too Many Requests' : 'Unauthorized', message: authResult.message },
                { status: authResult.reason === 'rate_limited' ? 429 : 401 }
            );
        }
        const { userId } = authResult.context;

        const supabase = createServiceRoleClient();

        const { error } = await supabase
            .from('votes')
            .delete()
            .eq('user_id', userId)
            .eq('map_id', mapId);

        if (error) {
            logger.error('API Unvote Error', { error, userId, mapId });
            return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
        }

        return NextResponse.json({ message: 'Vote removed' }, { status: 200 });

    } catch (error) {
        logger.error('Unexpected error in DELETE /maps/[id]/vote', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
