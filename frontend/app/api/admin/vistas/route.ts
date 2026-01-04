import { createClient } from '@/lib/supabase/server';
import { ensureAdmin } from '@/lib/admin-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
    try {
        await ensureAdmin();
        const supabase = await createClient();
        const { data: vistas, error } = await supabase
            .from('vistas')
            .select('*')
            .order('display_order', { ascending: true });

        if (error) throw error;
        return NextResponse.json({ vistas });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 403 });
    }
}

export async function POST(req: NextRequest) {
    try {
        await ensureAdmin();
        const body = await req.json();
        const supabase = await createClient();

        // Get the max display_order to put new vista at end
        const { data: maxOrder } = await supabase
            .from('vistas')
            .select('display_order')
            .order('display_order', { ascending: false })
            .limit(1)
            .single();

        const { data: vista, error } = await supabase
            .from('vistas')
            .insert([{
                name: body.name,
                description: body.description ?? null,
                location: body.location,
                enabled: body.enabled ?? true,
                display_order: (maxOrder?.display_order ?? -1) + 1,
                thumbnail_url: body.thumbnail_url ?? null
            }])
            .select()
            .single();

        if (error) throw error;
        return NextResponse.json({ vista });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}

export async function PATCH(req: NextRequest) {
    try {
        await ensureAdmin();
        const body = await req.json();
        const { id, ...updates } = body;
        const supabase = await createClient();

        const { data: vista, error } = await supabase
            .from('vistas')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return NextResponse.json({ vista });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        await ensureAdmin();
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Vista ID required' }, { status: 400 });
        }

        const supabase = await createClient();
        const { error } = await supabase
            .from('vistas')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
