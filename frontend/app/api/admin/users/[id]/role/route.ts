import { createClient } from '@/lib/supabase/server';
import { ensureAdmin } from '@/lib/admin-auth';
import { NextResponse } from 'next/server';

export async function PATCH(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        await ensureAdmin();
        const { id } = params;
        const { is_admin } = await req.json();

        const supabase = await createClient();
        const { data: user, error } = await supabase
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
