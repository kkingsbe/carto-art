import { createClient } from '@/lib/supabase/server';
import { isAdmin } from '@/lib/admin-auth';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';



export async function GET() {
    try {
        const isUserAdmin = await isAdmin();
        if (!isUserAdmin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = await createClient();

        // 30 day window
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const startTime = thirtyDaysAgo.toISOString();

        // Fetch session_ids for each step to calculate unique sessions
        // using separate queries for parallelism
        const [
            { data: landingEvents },
            { data: editorEvents },
            { data: checkoutEvents },
            { data: purchaseEvents }
        ] = await Promise.all([
            // Landing: any page view on the root path
            supabase
                .from('page_events')
                .select('session_id')
                .eq('event_type', 'page_view')
                .ilike('page_url', '%/') // Simple heuristic for home page: ends in /
                .gte('created_at', startTime),

            // Editor Opened
            supabase
                .from('page_events')
                .select('session_id')
                .eq('event_type', 'editor_open')
                .gte('created_at', startTime),

            // Checkout Started
            supabase
                .from('page_events')
                .select('session_id')
                .eq('event_type', 'checkout_start')
                .gte('created_at', startTime),

            // Purchase Complete
            supabase
                .from('page_events')
                .select('session_id')
                .eq('event_type', 'purchase_complete')
                .gte('created_at', startTime)
        ]);

        // Helper to count unique sessions
        const countUnique = (data: { session_id: string | null }[] | null) => {
            if (!data) return 0;
            const unique = new Set(data.map(d => d.session_id).filter(Boolean));
            return unique.size;
        };

        const landingCount = countUnique(landingEvents);
        const editorCount = countUnique(editorEvents);
        const checkoutCount = countUnique(checkoutEvents);
        const purchaseCount = countUnique(purchaseEvents);

        // Ensure strictly decreasing funnel for visualization sanity? 
        // Real data might be messy (e.g. session started checkout without editor open if using deep link),
        // but generally we display the raw unique counts for each stage.
        // Funnel charts usually handle varying sizes, but visually it's nice if they shrink. 
        // We will trust the data.

        const safeTotal = landingCount || 1;

        const funnelData = [
            {
                step: 'Landing Page',
                count: landingCount,
                percentage: 100,
                dropOff: 0,
                // Avg time not easily calculated with this aggregation method without more complex queries
                avgTimeNext: 0
            },
            {
                step: 'Editor',
                count: editorCount,
                percentage: Math.round((editorCount / safeTotal) * 100),
                dropOff: Math.round(((landingCount - editorCount) / landingCount) * 100),
                avgTimeNext: 0
            },
            {
                step: 'Checkout',
                count: checkoutCount,
                percentage: Math.round((checkoutCount / safeTotal) * 100),
                dropOff: Math.round((editorCount > 0 ? ((editorCount - checkoutCount) / editorCount) : 0) * 100),
                avgTimeNext: 0
            },
            {
                step: 'Purchase',
                count: purchaseCount,
                percentage: Math.round((purchaseCount / safeTotal) * 100),
                dropOff: Math.round((checkoutCount > 0 ? ((checkoutCount - purchaseCount) / checkoutCount) : 0) * 100),
                avgTimeNext: 0
            }
        ];

        return NextResponse.json(funnelData);

    } catch (error) {
        console.error('Funnel stats error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
