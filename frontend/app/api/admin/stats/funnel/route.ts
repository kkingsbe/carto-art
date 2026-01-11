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

        // RPC Call: Fetch all analytics in one generic pass
        const { data, error } = await supabase.rpc('get_period_analytics', {
            start_time: startTime
        } as any);

        if (error) {
            console.error('Funnel RPC error:', error);
            throw error;
        }

        const analytics = data as {
            landing_count: number;
            event_counts: { event_type: string; event_name: string | null; count: number }[];
        };

        const landingCount = analytics.landing_count || 0;

        // Helper to find count for specific event parameters
        const getCount = (type: string, name?: string) => {
            const match = analytics.event_counts.find(e =>
                e.event_type === type && (name ? e.event_name === name : true)
            );
            return match ? match.count : 0;
        };

        // Extract counts using the helper
        const editorCount = getCount('editor_open');
        const exportCount = getCount('poster_export');

        // Granular export metrics
        const modalViewCount = getCount('export_modal_view');
        const donateCount = getCount('export_modal_donate_click');
        const shareCount = getCount('export_modal_share_click');

        const clickPurchaseCount = getCount('shop_transition_start');
        const storeCount = getCount('store_view');
        const productCount = getCount('product_view');
        const productErrorCount = getCount('product_view_error');

        // Checkout steps
        const sizeSelectedCount = getCount('checkout_step_complete', 'size_selected');
        const shippingEnteredCount = getCount('checkout_step_complete', 'shipping_entered');

        const checkoutCount = getCount('checkout_start');
        const purchaseCount = getCount('purchase_complete');

        const transitionSuccessCount = getCount('shop_transition_success');
        const transitionErrorCount = getCount('shop_transition_error');

        const safeTotal = landingCount || 1;

        // Base funnel logic: We want to see flow through the export modal.
        // Flow: Export -> Modal View -> (Split: Donate, Share, Purchase)
        // Since Donate/Share/Purchase are parallel options, drop-off is tricky.
        // We will treat "Modal View" as the parent of "Click Purchase" for calculations.

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
                step: 'Viewed Modal',
                count: modalViewCount,
                percentage: Math.round((modalViewCount / safeTotal) * 100),
                dropOff: Math.round((exportCount > 0 ? ((exportCount - modalViewCount) / exportCount) : 0) * 100),
                avgTimeNext: 0
            },
            // Parallel Actions (Not linear) - we can list them to see counts
            {
                step: 'Clicked Donate',
                count: donateCount,
                percentage: Math.round((donateCount / safeTotal) * 100),
                dropOff: 0, // Parallel, irrelevant
                avgTimeNext: 0
            },
            {
                step: 'Clicked Share',
                count: shareCount,
                percentage: Math.round((shareCount / safeTotal) * 100),
                dropOff: 0, // Parallel, irrelevant
                avgTimeNext: 0
            },
            {
                step: 'Click Purchase',
                count: clickPurchaseCount,
                percentage: Math.round((clickPurchaseCount / safeTotal) * 100),
                // Drop-off relative to Modal View is the key metric
                dropOff: Math.round((modalViewCount > 0 ? ((modalViewCount - clickPurchaseCount) / modalViewCount) : 0) * 100),
                avgTimeNext: 0
            },
            {
                step: 'Transition Success',
                count: transitionSuccessCount,
                percentage: Math.round((transitionSuccessCount / safeTotal) * 100),
                dropOff: Math.round((clickPurchaseCount > 0 ? ((clickPurchaseCount - transitionSuccessCount) / clickPurchaseCount) : 0) * 100),
                avgTimeNext: 0
            },
            {
                step: 'Transition Error',
                count: transitionErrorCount,
                percentage: Math.round((transitionErrorCount / safeTotal) * 100),
                dropOff: 0,
                avgTimeNext: 0
            },
            {
                step: 'View Store',
                count: storeCount,
                percentage: Math.round((storeCount / safeTotal) * 100),
                dropOff: Math.round((transitionSuccessCount > 0 ? ((transitionSuccessCount - storeCount) / transitionSuccessCount) : 0) * 100),
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
                step: 'Size Selected',
                count: sizeSelectedCount,
                percentage: Math.round((sizeSelectedCount / safeTotal) * 100),
                dropOff: Math.round((productCount > 0 ? ((productCount - sizeSelectedCount) / productCount) : 0) * 100),
                avgTimeNext: 0
            },
            {
                step: 'Shipping Ent.',
                count: shippingEnteredCount,
                percentage: Math.round((shippingEnteredCount / safeTotal) * 100),
                dropOff: Math.round((sizeSelectedCount > 0 ? ((sizeSelectedCount - shippingEnteredCount) / sizeSelectedCount) : 0) * 100),
                avgTimeNext: 0
            },
            {
                step: 'Checkout',
                count: checkoutCount,
                percentage: Math.round((checkoutCount / safeTotal) * 100),
                dropOff: Math.round((shippingEnteredCount > 0 ? ((shippingEnteredCount - checkoutCount) / shippingEnteredCount) : 0) * 100),
                avgTimeNext: 0
            },
            {
                step: 'Purchase',
                count: purchaseCount,
                percentage: Math.round((purchaseCount / safeTotal) * 100),
                dropOff: Math.round((checkoutCount > 0 ? ((checkoutCount - purchaseCount) / checkoutCount) : 0) * 100),
                avgTimeNext: 0
            },
            {
                step: 'No Design Error',
                count: productErrorCount,
                percentage: Math.round((productErrorCount / safeTotal) * 100),
                dropOff: 0,
                avgTimeNext: 0
            }
        ];

        return NextResponse.json(funnelData);

    } catch (error) {
        console.error('Funnel stats error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
