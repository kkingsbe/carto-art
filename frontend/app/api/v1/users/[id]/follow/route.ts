
import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiRequest } from '@/lib/auth/api-middleware';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

export async function POST(
    req: NextRequest,
    context: { params: Promise<{ id: string }> } // Standard Next.js 13+ route params type
) {
    const { id: targetUserId } = await context.params;

    try {
        const authResult = await authenticateApiRequest(req);
        if (!authResult.success) {
            return NextResponse.json(
                { error: authResult.reason === 'rate_limited' ? 'Too Many Requests' : 'Unauthorized', message: authResult.message },
                { status: authResult.reason === 'rate_limited' ? 429 : 401 }
            );
        }
        const { userId } = authResult.context;

        if (userId === targetUserId) {
            return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 });
        }

        const supabase = createServiceRoleClient();

        // Check if already following to return 200 OK (idempotent)
        const { data: existing } = await supabase
            .from('follows')
            .select('follower_id')
            .eq('follower_id', userId)
            .eq('following_id', targetUserId)
            .single();

        if (existing) {
            return NextResponse.json({ message: 'Already following' }, { status: 200 });
        }

        const { error } = await (supabase
            .from('follows') as any)
            .insert({
                follower_id: userId,
                following_id: targetUserId
            });

        if (error) {
            if (error.code === '23505') { // Unique violation (race condition)
                return NextResponse.json({ message: 'Already following' }, { status: 200 });
            }
            logger.error('API Follow Error', { error, userId, targetUserId });
            return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
        }

        return NextResponse.json({ message: 'Followed successfully' }, { status: 201 });

    } catch (error) {
        logger.error('Unexpected error in POST /users/[id]/follow', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const { id: targetUserId } = await context.params;

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
            .from('follows')
            .delete()
            .eq('follower_id', userId)
            .eq('following_id', targetUserId);

        if (error) {
            logger.error('API Unfollow Error', { error, userId, targetUserId });
            return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
        }

        return NextResponse.json({ message: 'Unfollowed successfully' }, { status: 200 });

    } catch (error) {
        logger.error('Unexpected error in DELETE /users/[id]/follow', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
