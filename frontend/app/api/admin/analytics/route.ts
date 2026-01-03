import { ensureAdmin } from '@/lib/admin-auth';
import { getCoreTrafficStats } from '@/lib/analytics';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        await ensureAdmin();

        const stats = await getCoreTrafficStats();
        return NextResponse.json(stats);
    } catch (error: any) {
        console.error('GA4 API Error:', error);

        // Return a structured error so the UI can show a setup guide if needed
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
