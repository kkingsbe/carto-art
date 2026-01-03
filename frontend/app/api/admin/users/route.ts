import { createClient } from '@/lib/supabase/server';
import { ensureAdmin } from '@/lib/admin-auth';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        await ensureAdmin();
        const supabase = await createClient();
        const { data: users, error } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return NextResponse.json({ users });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 403 });
    }
}
