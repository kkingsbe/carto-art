
import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiRequest } from '@/lib/auth/api-middleware';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import { normalizeComment, sanitizeText } from '@/lib/utils/sanitize';
import { COMMENT_MIN_LENGTH, COMMENT_MAX_LENGTH } from '@/lib/constants/limits';

const CommentSchema = z.object({
    content: z.string().min(1).max(1000)
});

export async function GET(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const { id: mapId } = await context.params;

    try {
        // GET comments might be public, but let's require auth for now as per plan context (automated users)
        // or allow public read? The plan says "Expose social features via REST API for SDK consumption".
        // Usually read is public, but let's just stick to authenticated SDK access for now.
        const authResult = await authenticateApiRequest(req);
        if (!authResult.success) {
            return NextResponse.json(
                { error: authResult.reason === 'rate_limited' ? 'Too Many Requests' : 'Unauthorized', message: authResult.message },
                { status: authResult.reason === 'rate_limited' ? 429 : 401 }
            );
        }

        const supabase = createServiceRoleClient();

        const { data, error } = await supabase
            .from('comments')
            .select(`
                id,
                content,
                created_at,
                updated_at,
                user_id,
                profile:profiles!comments_user_id_profiles_fkey (
                    username,
                    display_name,
                    avatar_url
                )
            `)
            .eq('map_id', mapId)
            .order('created_at', { ascending: true });

        if (error) {
            logger.error('API Get Comments Error', { error, mapId });
            return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
        }

        return NextResponse.json({ comments: data }, { status: 200 });

    } catch (error) {
        logger.error('Unexpected error in GET /maps/[id]/comments', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

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

        const validation = CommentSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json({ error: 'Invalid request', details: validation.error.flatten() }, { status: 400 });
        }

        const { content } = validation.data;

        // Sanitize
        const normalizedContent = normalizeComment(content);
        const sanitizedContent = sanitizeText(normalizedContent);

        if (sanitizedContent.length < COMMENT_MIN_LENGTH || sanitizedContent.length > COMMENT_MAX_LENGTH) {
            return NextResponse.json({ error: `Comment length must be between ${COMMENT_MIN_LENGTH} and ${COMMENT_MAX_LENGTH}` }, { status: 400 });
        }

        const supabase = createServiceRoleClient();

        // Check map exists/published
        const { data: map } = await (supabase.from('maps') as any).select('is_published').eq('id', mapId).single();
        if (!map) return NextResponse.json({ error: 'Map not found' }, { status: 404 });
        if (!map.is_published) return NextResponse.json({ error: 'Map is not published' }, { status: 403 });

        const { data: newComment, error } = await (supabase
            .from('comments') as any)
            .insert({
                user_id: userId,
                map_id: mapId,
                content: sanitizedContent
            })
            .select()
            .single();

        if (error) {
            logger.error('API Add Comment Error', { error, userId, mapId });
            return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
        }

        return NextResponse.json({ comment: newComment }, { status: 201 });

    } catch (error) {
        logger.error('Unexpected error in POST /maps/[id]/comments', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
