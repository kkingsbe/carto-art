import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiRequest } from '@/lib/auth/api-middleware';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const UpdateVirtualUserSchema = z.object({
    display_name: z.string().min(1).max(50).optional(),
    avatar_url: z.string().url().optional(),
});

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authResult = await authenticateApiRequest(req);
        if (!authResult.success) {
            return NextResponse.json(
                { error: authResult.reason === 'rate_limited' ? 'Too Many Requests' : 'Unauthorized', message: authResult.message },
                { status: authResult.reason === 'rate_limited' ? 429 : 401 }
            );
        }

        const { userId } = authResult.context;
        const { id: virtualUserId } = await params;

        let body;
        try {
            body = await req.json();
        } catch {
            return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
        }

        const validation = UpdateVirtualUserSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json({ error: 'Invalid request', details: validation.error.flatten() }, { status: 400 });
        }

        const supabase = createServiceRoleClient();

        // Verify ownership and virtual status
        const { data: virtualUser, error: checkError } = await (supabase
            .from('profiles') as any)
            .select('id, owner_id')
            .eq('id', virtualUserId)
            .eq('is_virtual', true)
            .single();

        if (checkError || !virtualUser) {
            return NextResponse.json({ error: 'Not Found', message: 'Virtual user not found' }, { status: 404 });
        }

        if (virtualUser.owner_id !== userId) {
            return NextResponse.json({ error: 'Unauthorized', message: 'You do not own this virtual user' }, { status: 401 });
        }

        // Update
        const { data, error } = await (supabase
            .from('profiles') as any)
            .update(validation.data)
            .eq('id', virtualUserId)
            .select()
            .single();

        if (error) {
            logger.error('Failed to update virtual user', { error, userId, virtualUserId });
            return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
        }

        return NextResponse.json({ user: data });
    } catch (error) {
        logger.error('Unexpected error in PATCH /api/v1/virtual-users/[id]', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authResult = await authenticateApiRequest(req);
        if (!authResult.success) {
            return NextResponse.json(
                { error: authResult.reason === 'rate_limited' ? 'Too Many Requests' : 'Unauthorized', message: authResult.message },
                { status: authResult.reason === 'rate_limited' ? 429 : 401 }
            );
        }

        const { userId } = authResult.context;
        const { id: virtualUserId } = await params;
        const supabase = createServiceRoleClient();

        // Verify ownership and virtual status
        const { data: virtualUser, error: checkError } = await (supabase
            .from('profiles') as any)
            .select('id, owner_id')
            .eq('id', virtualUserId)
            .eq('is_virtual', true)
            .single();

        if (checkError || !virtualUser) {
            return NextResponse.json({ error: 'Not Found', message: 'Virtual user not found' }, { status: 404 });
        }

        if (virtualUser.owner_id !== userId) {
            return NextResponse.json({ error: 'Unauthorized', message: 'You do not own this virtual user' }, { status: 401 });
        }

        // Delete
        const { error } = await supabase
            .from('profiles')
            .delete()
            .eq('id', virtualUserId);

        if (error) {
            logger.error('Failed to delete virtual user', { error, userId, virtualUserId });
            return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
        }

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        logger.error('Unexpected error in DELETE /api/v1/virtual-users/[id]', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
