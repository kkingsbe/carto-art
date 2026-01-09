import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { isAdmin } from '@/lib/admin-auth';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';



export async function GET() {
    try {
        const isUserAdmin = await isAdmin();
        if (!isUserAdmin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Use service role client to bypass RLS and see all user events for analytics
        const supabase = createServiceRoleClient();

        // 30 day window
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const startTime = thirtyDaysAgo.toISOString();

        // Fetch session_ids for each step to calculate unique sessions
        // using separate queries for parallelism
        const [
            { data: landingEvents },
            { data: editorEvents },
            { data: exportEvents },
            { data: clickPurchaseEvents },
            { data: storeEvents },
            { data: productEvents },
            { data: checkoutEvents },
            { data: purchaseEvents }
        ] = await Promise.all([
            // Landing: any page view on the root path
            supabase
                .from('page_events')
                .select('session_id')
                .eq('event_type', 'page_view')
                .ilike('page_url', '%/')
                .gte('created_at', startTime)
                .not('session_id', 'is', null)
                .limit(50000),

            // Editor Opened
            supabase
                .from('page_events')
                .select('session_id')
                .eq('event_type', 'editor_open')
                .gte('created_at', startTime)
                .not('session_id', 'is', null)
                .limit(50000),

            // Export Success
            supabase
                .from('page_events')
                .select('session_id')
                .eq('event_type', 'poster_export')
                .gte('created_at', startTime)
                .not('session_id', 'is', null)
                .limit(50000),

            // Clicking "Purchase Print" from Export Modal
            supabase
                .from('page_events')
                .select('session_id')
                .eq('event_type', 'shop_transition_start')
                .gte('created_at', startTime)
                .not('session_id', 'is', null)
                .limit(50000),

            // Store (Product Selection)
            supabase
                .from('page_events')
                .select('session_id')
                .eq('event_type', 'store_view')
                .gte('created_at', startTime)
                .not('session_id', 'is', null)
                .limit(50000),

            // Product Detail View
            supabase
                .from('page_events')
                .select('session_id')
                .eq('event_type', 'product_view')
                .gte('created_at', startTime)
                .not('session_id', 'is', null)
                .limit(50000),

            // Checkout Started
            supabase
                .from('page_events')
                .select('session_id')
                .eq('event_type', 'checkout_start')
                .gte('created_at', startTime)
                .not('session_id', 'is', null)
                .limit(50000),

            // Purchase Complete
            supabase
                .from('page_events')
                .select('session_id')
                .eq('event_type', 'purchase_complete')
                .gte('created_at', startTime)
                .not('session_id', 'is', null)
                .order('created_at', { ascending: false })
                .limit(1000)
        ]);

        // Helper to count unique sessions
        const countUnique = (data: { session_id: string | null }[] | null) => {
            if (!data) return 0;
            const unique = new Set(data.map(d => d.session_id).filter(Boolean));
            return unique.size;
        };

        const landingCount = countUnique(landingEvents);
        const editorCount = countUnique(editorEvents);
        const exportCount = countUnique(exportEvents);
        const clickPurchaseCount = countUnique(clickPurchaseEvents);
        const storeCount = countUnique(storeEvents);
        const productCount = countUnique(productEvents);
        const checkoutCount = countUnique(checkoutEvents);
        const purchaseCount = countUnique(purchaseEvents);

        const safeTotal = landingCount || 1;

        const funnelData = [
            {
                step: 'Landing Page',
                count: landingCount,
                percentage: 100,
                dropOff: 0,
                avgTimeNext: 0
            },
            {
                step: 'Editor',
                count: editorCount,
                percentage: Math.round((editorCount / safeTotal) * 100),
                dropOff: Math.round(((landingCount - editorCount) / safeTotal) * 100),
                avgTimeNext: 0
            },
            {
                step: 'Exported',
                count: exportCount,
                percentage: Math.round((exportCount / safeTotal) * 100),
                dropOff: Math.round((editorCount > 0 ? ((editorCount - exportCount) / editorCount) : 0) * 100),
                avgTimeNext: 0
            },
            {
                step: 'Click Purchase',
                count: clickPurchaseCount,
                percentage: Math.round((clickPurchaseCount / safeTotal) * 100),
                dropOff: Math.round((exportCount > 0 ? ((exportCount - clickPurchaseCount) / exportCount) : 0) * 100),
                avgTimeNext: 0
            },
            {
                step: 'View Store',
                count: storeCount,
                percentage: Math.round((storeCount / safeTotal) * 100),
                dropOff: Math.round((clickPurchaseCount > 0 ? ((clickPurchaseCount - storeCount) / clickPurchaseCount) : 0) * 100),
                avgTimeNext: 0
            },
            {
                step: 'View Product',
                count: productCount,
                percentage: Math.round((productCount / safeTotal) * 100),
                dropOff: Math.round((storeCount > 0 ? ((storeCount - productCount) / storeCount) : 0) * 100),
                avgTimeNext: 0
            },
            {
                step: 'Checkout',
                count: checkoutCount,
                percentage: Math.round((checkoutCount / safeTotal) * 100),
                dropOff: Math.round((productCount > 0 ? ((productCount - checkoutCount) / productCount) : 0) * 100),
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
