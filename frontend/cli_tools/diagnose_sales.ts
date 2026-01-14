import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: envPath });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

async function main() {
    const days = parseInt(process.argv[2] || '7', 10);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startTime = startDate.toISOString();

    console.log('\n🔍 SALES FUNNEL DIAGNOSIS');
    console.log(`   Analyzing last ${days} days of data`);
    console.log('═'.repeat(60));

    // 1. Export modal views - who saw the modal?
    const { data: modalViews } = await supabase
        .from('page_events')
        .select('user_id, session_id, metadata, created_at')
        .eq('event_type', 'export_modal_view')
        .gte('created_at', startTime)
        .order('created_at', { ascending: false });

    console.log(`\n📊 EXPORT MODAL VIEWS: ${modalViews?.length || 0} total events`);

    const authenticatedViews = modalViews?.filter(e => e.user_id) || [];
    const anonymousViews = modalViews?.filter(e => !e.user_id) || [];

    const uniqueAuthUsers = new Set(authenticatedViews.map(e => e.user_id).filter(Boolean));
    const uniqueAnonymousSessions = new Set(anonymousViews.map(e => e.session_id).filter(Boolean));

    console.log(`   └─ Auth views: ${authenticatedViews.length} (${uniqueAuthUsers.size} unique users)`);
    console.log(`   └─ Anonymous views: ${anonymousViews.length} (${uniqueAnonymousSessions.size} unique sessions)`);

    // 2. Modal dismissals - how do users close the modal?
    const { data: modalDismiss } = await supabase
        .from('page_events')
        .select('user_id, metadata, created_at')
        .eq('event_type', 'export_modal_dismiss')
        .gte('created_at', startTime);

    console.log(`\n🚪 MODAL DISMISSALS: ${modalDismiss?.length || 0}`);

    const dismissMethods: Record<string, number> = {};
    modalDismiss?.forEach(e => {
        const method = e.metadata?.method || 'unknown';
        dismissMethods[method] = (dismissMethods[method] || 0) + 1;
    });

    Object.entries(dismissMethods).forEach(([method, count]) => {
        console.log(`   └─ ${method}: ${count}`);
    });

    // 3. Shop transition attempts
    const { data: shopStart } = await supabase
        .from('page_events')
        .select('user_id, session_id, metadata, created_at')
        .eq('event_type', 'shop_transition_start')
        .gte('created_at', startTime);

    console.log(`\n🛒 SHOP TRANSITION STARTS: ${shopStart?.length || 0} total events`);

    const uniqueShopUsers = new Set(shopStart?.map(e => e.user_id).filter(Boolean) || []);
    const uniqueShopSessions = new Set(shopStart?.map(e => e.session_id).filter(Boolean) || []);
    console.log(`   └─ Unique attempts: ${(uniqueShopUsers.size || uniqueShopSessions.size)}`);

    // 4. Shop transition success/failures
    const { data: shopSuccess } = await supabase
        .from('page_events')
        .select('*')
        .eq('event_type', 'shop_transition_success')
        .gte('created_at', startTime);

    const { data: shopError } = await supabase
        .from('page_events')
        .select('metadata, created_at')
        .eq('event_type', 'shop_transition_error')
        .gte('created_at', startTime);

    console.log(`   └─ Successful: ${shopSuccess?.length || 0}`);
    console.log(`   └─ Failed: ${shopError?.length || 0}`);

    if (shopError && shopError.length > 0) {
        console.log('\n   ⚠️ TRANSITION ERRORS:');
        shopError.forEach((e, i) => {
            console.log(`      ${i + 1}. ${e.metadata?.error || 'Unknown error'} (${new Date(e.created_at).toLocaleString()})`);
        });
    }

    // 5. Store views
    const { data: storeViews } = await supabase
        .from('page_events')
        .select('user_id, created_at')
        .eq('event_type', 'store_view')
        .gte('created_at', startTime);

    console.log(`\n🏪 STORE PAGE VIEWS: ${storeViews?.length || 0}`);

    // 6. Product views and clicks
    const { data: productViews } = await supabase
        .from('page_events')
        .select('*')
        .eq('event_type', 'product_view')
        .gte('created_at', startTime);

    const { data: productClicks } = await supabase
        .from('page_events')
        .select('*')
        .eq('event_type', 'product_click')
        .gte('created_at', startTime);

    console.log(`\n📦 PRODUCT INTERACTIONS:`);

    const uniqueProductViewUsers = new Set(productViews?.map(e => e.user_id).filter(Boolean) || []);
    console.log(`   └─ Product Views: ${productViews?.length || 0} events (${uniqueProductViewUsers.size} unique users)`);

    const uniqueProductClickUsers = new Set(productClicks?.map(e => e.user_id).filter(Boolean) || []);
    console.log(`   └─ Product Clicks: ${productClicks?.length || 0} events (${uniqueProductClickUsers.size} unique users)`);

    // 7. Product view errors (no design)
    const { data: productErrors } = await supabase
        .from('page_events')
        .select('metadata, created_at')
        .eq('event_type', 'product_view_error')
        .gte('created_at', startTime);

    if (productErrors && productErrors.length > 0) {
        console.log(`\n   ❌ PRODUCT VIEW ERRORS: ${productErrors.length}`);
        productErrors.slice(0, 5).forEach((e, i) => {
            console.log(`      ${i + 1}. ${e.metadata?.error || 'No design found'}`);
        });
    }

    // 8. Checkout funnel
    const { data: checkoutStart } = await supabase
        .from('page_events')
        .select('*')
        .eq('event_type', 'checkout_start')
        .gte('created_at', startTime);

    const { data: sizeSelected } = await supabase
        .from('page_events')
        .select('*')
        .eq('event_type', 'checkout_step_complete')
        .eq('event_name', 'size_selected')
        .gte('created_at', startTime);

    const { data: shippingEntered } = await supabase
        .from('page_events')
        .select('*')
        .eq('event_type', 'checkout_step_complete')
        .eq('event_name', 'shipping_entered')
        .gte('created_at', startTime);

    const { data: paymentView } = await supabase
        .from('page_events')
        .select('*')
        .eq('event_type', 'checkout_payment_view')
        .gte('created_at', startTime);

    const { data: paymentAttempt } = await supabase
        .from('page_events')
        .select('*')
        .eq('event_type', 'payment_attempt')
        .gte('created_at', startTime);

    const { data: paymentFailure } = await supabase
        .from('page_events')
        .select('metadata, created_at')
        .eq('event_type', 'payment_failure')
        .gte('created_at', startTime);

    const { data: purchaseComplete } = await supabase
        .from('page_events')
        .select('*')
        .eq('event_type', 'purchase_complete')
        .gte('created_at', startTime);

    console.log(`\n💳 CHECKOUT FUNNEL:`);

    const uniqueCheckoutUsers = new Set(checkoutStart?.map(e => e.user_id).filter(Boolean) || []);
    console.log(`   └─ Checkout Started: ${checkoutStart?.length || 0} events (${uniqueCheckoutUsers.size} unique users)`);

    const uniqueSizeUsers = new Set(sizeSelected?.map(e => e.user_id).filter(Boolean) || []);
    console.log(`   └─ Size Selected: ${sizeSelected?.length || 0} events (${uniqueSizeUsers.size} unique users)`);

    const uniqueShippingUsers = new Set(shippingEntered?.map(e => e.user_id).filter(Boolean) || []);
    console.log(`   └─ Shipping Entered: ${shippingEntered?.length || 0} events (${uniqueShippingUsers.size} unique users)`);

    const uniquePaymentViewUsers = new Set(paymentView?.map(e => e.user_id).filter(Boolean) || []);
    console.log(`   └─ Payment View: ${paymentView?.length || 0} events (${uniquePaymentViewUsers.size} unique users)`);

    const uniquePaymentAttemptUsers = new Set(paymentAttempt?.map(e => e.user_id).filter(Boolean) || []);
    console.log(`   └─ Payment Attempted: ${paymentAttempt?.length || 0} events (${uniquePaymentAttemptUsers.size} unique users)`);

    console.log(`   └─ Payment Failed: ${paymentFailure?.length || 0}`);

    const uniquePurchaseUsers = new Set(purchaseComplete?.map(e => e.user_id).filter(Boolean) || []);
    console.log(`   └─ Purchase Complete: ${purchaseComplete?.length || 0} events (${uniquePurchaseUsers.size} unique users)`);

    if (paymentFailure && paymentFailure.length > 0) {
        console.log('\n   💔 PAYMENT FAILURES:');
        paymentFailure.forEach((e, i) => {
            console.log(`      ${i + 1}. ${e.metadata?.error || 'Unknown'} (${new Date(e.created_at).toLocaleString()})`);
        });
    }

    // 9. Check orders table
    const { data: orders } = await supabase
        .from('orders')
        .select('id, status, amount_total, created_at, stripe_payment_intent_id')
        .gte('created_at', startTime)
        .order('created_at', { ascending: false });

    console.log(`\n📋 ORDERS IN DATABASE: ${orders?.length || 0}`);
    if (orders && orders.length > 0) {
        orders.forEach((o, i) => {
            console.log(`   ${i + 1}. Status: ${o.status}, Amount: $${((o.amount_total || 0) / 100).toFixed(2)}, Date: ${new Date(o.created_at).toLocaleString()}`);
        });
    }

    // 10. Calculate key metrics
    console.log('\n═'.repeat(60));
    console.log('📈 KEY INSIGHTS');
    console.log('═'.repeat(60));

    const modalViewCount = modalViews?.length || 0;
    const totalUniqueModalUsers = (uniqueAuthUsers.size + uniqueAnonymousSessions.size);
    const shopStartCount = shopStart?.length || 0;
    const purchaseCount = purchaseComplete?.length || 0;

    if (modalViewCount > 0) {
        const modalToShopByEvents = ((shopStartCount / modalViewCount) * 100).toFixed(1);
        const modalToShopByUsers = ((uniqueShopUsers.size / totalUniqueModalUsers) * 100).toFixed(1);
        console.log(`\n1. Modal → Shop Transition:`);
        console.log(`   └─ By Events: ${modalToShopByEvents}% (${shopStartCount}/${modalViewCount})`);
        console.log(`   └─ By Unique Users: ${modalToShopByUsers}% (${uniqueShopUsers.size}/${totalUniqueModalUsers})`);
        if (parseFloat(modalToShopByUsers) < 5) {
            console.log('   ⚠️  CRITICAL: Very low click-through. Users see modal but don\'t click buy.');
            console.log('   🔧 FIX: Improve CTA visibility, reduce friction, test messaging.');
        }
    }

    if (uniqueAnonymousSessions.size > 0 && uniqueAuthUsers.size > 0) {
        const anonymousPercent = ((uniqueAnonymousSessions.size / totalUniqueModalUsers) * 100).toFixed(1);
        console.log(`\n2. Auth Wall Impact:`);
        console.log(`   └─ Anonymous Sessions: ${anonymousPercent}% (${uniqueAnonymousSessions.size}/${totalUniqueModalUsers})`);
        console.log(`   └─ Auth Users: ${((uniqueAuthUsers.size / totalUniqueModalUsers) * 100).toFixed(1)}% (${uniqueAuthUsers.size}/${totalUniqueModalUsers})`);
        if (parseFloat(anonymousPercent) > 50) {
            console.log(`   ⚠️  CRITICAL: ${uniqueAnonymousSessions.size} anonymous sessions blocked from buying!`);
            console.log('   🔧 FIX: "Buy Print" requires auth! Anonymous users get redirected to login.');
            console.log('   🔧 FIX: Allow guest checkout OR prompt login earlier in flow.');
        }
    }

    if (shopStartCount > 0) {
        const successRate = (((shopSuccess?.length || 0) / shopStartCount) * 100).toFixed(1);
        console.log(`\n3. Shop Transition Success Rate: ${successRate}%`);
        if (parseFloat(successRate) < 90) {
            console.log('   ⚠️  ISSUE: Technical problems preventing users from reaching store.');
        }
    }

    const storeViewCount = storeViews?.length || 0;
    const uniqueStoreUsers = new Set(storeViews?.map(e => e.user_id).filter(Boolean) || []);
    const checkoutStartCount = checkoutStart?.length || 0;

    console.log(`\n4. STORE VIEWS BREAKDOWN:`);
    console.log(`   └─ Total Views: ${storeViewCount} events`);
    console.log(`   └─ Unique Users: ${uniqueStoreUsers.size}`);
    if (storeViewCount > 0) {
        const avgViewsPerUser = (storeViewCount / (uniqueStoreUsers.size || 1)).toFixed(1);
        console.log(`   └─ Avg Views/User: ${avgViewsPerUser}x (retention signal)`);

        const storeToCheckoutByEvents = ((checkoutStartCount / storeViewCount) * 100).toFixed(1);
        const storeToCheckoutByUsers = ((uniqueCheckoutUsers.size / uniqueStoreUsers.size) * 100).toFixed(1);
        console.log(`\n   └─ Store → Checkout Conversion:`);
        console.log(`      └─ By Events: ${storeToCheckoutByEvents}% (${checkoutStartCount}/${storeViewCount})`);
        console.log(`      └─ By Unique Users: ${storeToCheckoutByUsers}% (${uniqueCheckoutUsers.size}/${uniqueStoreUsers.size})`);
    }

    console.log('\n═'.repeat(60));
    console.log('🎯 TOP RECOMMENDATIONS');
    console.log('═'.repeat(60));

    console.log(`
1. 🔓 REMOVE AUTH WALL FOR CHECKOUT
   - Currently: Users MUST be logged in to click "Buy Print"
   - Problem: ${anonymousViews.length} anonymous users saw modal, couldn't purchase
   - Fix: Allow guest checkout, require email only for order confirmation

2. 🎯 IMPROVE MODAL CTA
   - Current conversion: ${((shopStartCount / modalViewCount) * 100).toFixed(1)}%
   - Consider: A/B test button text, colors, placement
   - Consider: Auto-scroll to CTA on modal open

3. 📱 CHECK MOBILE EXPERIENCE
   - Is the "Buy Print" button visible on mobile?
   - Test the full flow on mobile devices

4. 🔍 ADD TRACKING FOR AUTH REDIRECTS
   - Currently no tracking when users hit login wall
   - Add event: 'shop_auth_required' to measure lost conversions

5. ⚡ REDUCE FRICTION
   - Current flow: Export → Modal → Login → Upload → Navigate → Store → Product → Checkout
   - Ideal flow: Export → Modal → Product Selection (inline) → Checkout
`);

    console.log('\n');
}

main().catch(console.error);
