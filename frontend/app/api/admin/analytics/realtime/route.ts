import { ensureAdmin } from '@/lib/admin-auth';
import { getRealtimeActiveUsers } from '@/lib/analytics';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        await ensureAdmin();

        const stats = await getRealtimeActiveUsers();
        return NextResponse.json(stats);
    } catch (error: any) {
        console.error('GA4 Realtime API Error:', error);

        const isConfigError = error.message.includes('not set') || error.message.includes('not fully configured');

        return NextResponse.json(
            {
                error: error.message,
                needsConfig: isConfigError
            },
            { status: isConfigError ? 400 : 500 }
        );
    }
}
