import { createClient } from '@/lib/supabase/server';
import { ensureAdmin } from '@/lib/admin-auth';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        await ensureAdmin();
        const supabase = await createClient();
        const { data: flags, error } = await supabase
            .from('feature_flags')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return NextResponse.json({ flags });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 403 });
    }
}

export async function POST(req: Request) {
    try {
        await ensureAdmin();
        const body = await req.json();
        const supabase = await createClient();

        const { data: flag, error } = await (supabase as any)
            .from('feature_flags')
            .insert([{
                key: body.key,
                name: body.name,
                description: body.description,
                enabled: body.enabled ?? false,
                enabled_percentage: body.enabled_percentage ?? 0,
                enabled_for_users: body.enabled_for_users ?? []
            }])
            .select()
            .single();

        if (error) throw error;
        return NextResponse.json({ flag });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}

export async function PATCH(req: Request) {
    try {
        await ensureAdmin();
        const body = await req.json();
        const { id, ...updates } = body;
        const supabase = await createClient();

        const { data: flag, error } = await (supabase as any)
            .from('feature_flags')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return NextResponse.json({ flag });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
