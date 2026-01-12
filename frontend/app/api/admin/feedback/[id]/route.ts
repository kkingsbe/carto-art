import { createClient } from '@/lib/supabase/server';
import { ensureAdmin } from '@/lib/admin-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        await ensureAdmin();
        const { id } = await context.params;
        const supabase = await createClient();
        const body = await request.json();

        // Only allow updating management fields
        const { status, admin_category, admin_notes } = body;

        const updateData: any = {};
        if (status !== undefined) updateData.status = status;
        if (admin_category !== undefined) updateData.admin_category = admin_category;
        if (admin_notes !== undefined) updateData.admin_notes = admin_notes;

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ error: 'No valid fields provided' }, { status: 400 });
        }

        const { data, error } = await (supabase as any)
            .from('feedback')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json(data);
    } catch (error: any) {
        console.error('Error updating feedback:', error);
        return NextResponse.json({ error: error.message }, { status: 403 });
    }
}
