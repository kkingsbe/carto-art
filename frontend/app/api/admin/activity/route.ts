import { createClient } from '@/lib/supabase/server';
import { ensureAdmin } from '@/lib/admin-auth';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
    try {
        await ensureAdmin();
        const { searchParams } = new URL(req.url);
        const limit = parseInt(searchParams.get('limit') || '50');
        const offset = parseInt(searchParams.get('offset') || '0');

        const supabase = await createClient();
        const { data: events, error, count } = await supabase
            .from('page_events')
            .select(`
                *,
                profiles:user_id (
                    username,
                    display_name,
                    avatar_url
                )
            `, { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) throw error;
        return NextResponse.json({ events, count });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 403 });
    }
}
