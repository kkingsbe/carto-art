import { NextResponse } from 'next/server';
import { internalSyncOrderStatuses } from '@/lib/actions/ecommerce';
import { createServiceRoleClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        const supabase = createServiceRoleClient();
        const result = await internalSyncOrderStatuses(supabase);
        return NextResponse.json({ success: true, ...result });
    } catch (error: any) {
        console.error('Cron job failed:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
