import { createClient } from '@/lib/supabase/server';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { NextResponse } from 'next/server';

export async function GET(
    req: Request,
    { params }: { params: { key: string } }
) {
    try {
        const { key } = params;
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        // We might want to pass session ID too for anonymous rollouts
        const enabled = await isFeatureEnabled(key, user?.id);

        return NextResponse.json({ enabled });
    } catch (error: any) {
        return NextResponse.json({ enabled: false, error: error.message }, { status: 500 });
    }
}
