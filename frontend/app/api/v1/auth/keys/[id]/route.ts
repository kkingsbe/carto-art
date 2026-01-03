import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        if (!id) {
            return NextResponse.json({ error: 'Key ID is required' }, { status: 400 });
        }

        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Delete the key (RLS ensures user owns it)
        const { error } = await (supabase as any)
            .from('api_keys')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id); // Redundant with RLS but good for safety

        if (error) {
            logger.error('Failed to delete API key', { error, userId: user.id, keyId: id });
            return NextResponse.json({ error: 'Failed to delete API key' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        logger.error('Unexpected error in DELETE /api/v1/auth/keys/[id]', { error });
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
