import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/admin-auth';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
    // Verify admin access
    const adminCheck = await isAdmin();
    if (!adminCheck) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query params for time range
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30', 10);

    try {
        const supabase = await createClient();
        
        const { data, error } = await (supabase as any).rpc('get_referrer_leaderboard', {
            days_back: days
        });

        if (error) {
            console.error('Failed to fetch referrer leaderboard:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Error in referrer leaderboard API:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
