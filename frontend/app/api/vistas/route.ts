import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const supabase = await createClient();
        const { data: vistas, error } = await supabase
            .from('vistas')
            .select('id, name, description, location')
            .eq('enabled', true)
            .order('display_order', { ascending: true });

        if (error) throw error;
        return NextResponse.json({ vistas });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
