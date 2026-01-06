import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { ensureAdmin } from '@/lib/admin-auth';
import { NextResponse } from 'next/server';

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await ensureAdmin();
        const { id } = await params;
        const { is_admin } = await req.json();

        const supabase = createServiceRoleClient();
        const { data: user, error } = await (supabase as any)
            .from('profiles')
            .update({ is_admin })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return NextResponse.json({ user });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 403 });
    }
}
