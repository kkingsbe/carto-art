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

interface TrafficMetrics {
    totalPageViews: number;
    uniqueSessions: number;
    uniqueUsers: number;
    newSignups: number;
    mapsCreated: number;
    mapsPublished: number;
    posterExports: number;
    purchases: number;
}

interface FunnelStep {
    name: string;
    count: number;
    conversionFromPrevious?: number;
    conversionFromTop?: number;
}

interface ReferrerData {
    source: string;
    count: number;
    signups: number;
    conversions: number;
}

async function getTrafficMetrics(days: number): Promise<TrafficMetrics> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startTime = startDate.toISOString();

    // Get page views
    const { data: pageViews } = await supabase
        .from('page_events')
        .select('session_id, user_id, event_type')
        .eq('event_type', 'page_view')
        .gte('created_at', startTime);

    // Get signups
    const { data: signups } = await supabase
        .from('page_events')
        .select('user_id')
        .eq('event_type', 'signup')
        .gte('created_at', startTime);

    // Get maps created
    const { data: mapsCreated } = await supabase
        .from('page_events')
        .select('user_id')
        .eq('event_type', 'map_create')
        .gte('created_at', startTime);

    // Get maps published
    const { data: mapsPublished } = await supabase
        .from('page_events')
        .select('user_id')
        .eq('event_type', 'map_publish')
        .gte('created_at', startTime);

    // Get poster exports
    const { data: exports } = await supabase
        .from('page_events')
        .select('user_id')
        .eq('event_type', 'poster_export')
        .gte('created_at', startTime);

    // Get purchases
    const { data: purchases } = await supabase
        .from('page_events')
        .select('user_id')
        .eq('event_type', 'purchase_complete')
        .gte('created_at', startTime);

    const uniqueSessions = new Set(pageViews?.map(e => e.session_id).filter(Boolean) || []);
    const uniqueUsers = new Set(pageViews?.map(e => e.user_id).filter(Boolean) || []);

    return {
        totalPageViews: pageViews?.length || 0,
        uniqueSessions: uniqueSessions.size,
        uniqueUsers: uniqueUsers.size,
        newSignups: signups?.length || 0,
        mapsCreated: mapsCreated?.length || 0,
        mapsPublished: mapsPublished?.length || 0,
        posterExports: exports?.length || 0,
        purchases: purchases?.length || 0,
    };
}

async function getFunnelAnalysis(days: number): Promise<FunnelStep[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startTime = startDate.toISOString();

    const funnelEvents = [
        { name: 'Landing Page Views', type: 'page_view' },
        { name: 'Editor Opens', type: 'editor_open' },
        { name: 'Location Searches', type: 'search_location' },
        { name: 'Style Changes', type: 'style_change' },
        { name: 'Export Starts', type: 'export_start' },
        { name: 'Poster Exports', type: 'poster_export' },
        { name: 'Shop Transitions', type: 'shop_transition_start' },
        { name: 'Product Views', type: 'product_view' },
        { name: 'Checkout Starts', type: 'checkout_start' },
        { name: 'Purchases Complete', type: 'purchase_complete' },
    ];

    const funnel: FunnelStep[] = [];

    for (const step of funnelEvents) {
        const { count } = await supabase
            .from('page_events')
            .select('*', { count: 'exact', head: true })
            .eq('event_type', step.type)
            .gte('created_at', startTime);

        const stepCount = count || 0;
        const previousCount = funnel.length > 0 ? funnel[funnel.length - 1].count : stepCount;
        const topCount = funnel.length > 0 ? funnel[0].count : stepCount;

        funnel.push({
            name: step.name,
            count: stepCount,
            conversionFromPrevious: previousCount > 0 ? (stepCount / previousCount) * 100 : 0,
            conversionFromTop: topCount > 0 ? (stepCount / topCount) * 100 : 0,
        });
    }

    return funnel;
}

async function getReferrerAnalysis(days: number): Promise<ReferrerData[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startTime = startDate.toISOString();

    // Get referrer data from profiles
    const { data: profiles } = await supabase
        .from('profiles')
        .select('referrer_source, utm_source, utm_medium, utm_campaign, created_at')
        .gte('created_at', startTime);

    // Group by source
    const referrerMap = new Map<string, { count: number; signups: number }>();

    profiles?.forEach(profile => {
        const source = profile.referrer_source || profile.utm_source || 'direct';
        const existing = referrerMap.get(source) || { count: 0, signups: 0 };
        existing.count++;
        existing.signups++;
        referrerMap.set(source, existing);
    });

    // Get all page events with referrer metadata
    const { data: events } = await supabase
        .from('page_events')
        .select('metadata')
        .eq('event_type', 'page_view')
        .gte('created_at', startTime)
        .not('metadata', 'is', null);

    events?.forEach(event => {
        const referrer = event.metadata?.referrer || 'direct';
        const existing = referrerMap.get(referrer) || { count: 0, signups: 0 };
        existing.count++;
        referrerMap.set(referrer, existing);
    });

    return Array.from(referrerMap.entries())
        .map(([source, data]) => ({
            source,
            count: data.count,
            signups: data.signups,
            conversions: 0, // Would need to join with orders
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 15);
}

async function getRetentionMetrics(): Promise<{ day1: number; day7: number; day30: number }> {
    // Get users who signed up 30+ days ago
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    // Get signups from different cohorts
    const { data: oldSignups } = await supabase
        .from('profiles')
        .select('id, last_active_at, created_at')
        .lte('created_at', thirtyDaysAgo.toISOString());

    const { data: weekOldSignups } = await supabase
        .from('profiles')
        .select('id, last_active_at, created_at')
        .lte('created_at', sevenDaysAgo.toISOString())
        .gte('created_at', thirtyDaysAgo.toISOString());

    const { data: dayOldSignups } = await supabase
        .from('profiles')
        .select('id, last_active_at, created_at')
        .lte('created_at', oneDayAgo.toISOString())
        .gte('created_at', sevenDaysAgo.toISOString());

    // Calculate retention
    const day30Retained = oldSignups?.filter(u => {
        if (!u.last_active_at) return false;
        const lastActive = new Date(u.last_active_at);
        return lastActive >= thirtyDaysAgo;
    }).length || 0;

    const day7Retained = weekOldSignups?.filter(u => {
        if (!u.last_active_at) return false;
        const lastActive = new Date(u.last_active_at);
        return lastActive >= sevenDaysAgo;
    }).length || 0;

    const day1Retained = dayOldSignups?.filter(u => {
        if (!u.last_active_at) return false;
        const lastActive = new Date(u.last_active_at);
        return lastActive >= oneDayAgo;
    }).length || 0;

    return {
        day1: dayOldSignups?.length ? (day1Retained / dayOldSignups.length) * 100 : 0,
        day7: weekOldSignups?.length ? (day7Retained / weekOldSignups.length) * 100 : 0,
        day30: oldSignups?.length ? (day30Retained / oldSignups.length) * 100 : 0,
    };
}

async function getDropoffAnalysis(days: number): Promise<{ step: string; dropoff: number; suggestion: string }[]> {
    const funnel = await getFunnelAnalysis(days);
    const dropoffs: { step: string; dropoff: number; suggestion: string }[] = [];

    const suggestions: Record<string, string> = {
        'Editor Opens': 'Improve landing page CTA and value proposition. Add more visual examples.',
        'Location Searches': 'Simplify editor onboarding. Auto-focus search on load. Add popular locations.',
        'Style Changes': 'Show style previews upfront. Reduce friction to try different styles.',
        'Export Starts': 'Add more visible export button. Show export preview earlier.',
        'Poster Exports': 'Optimize export performance. Show progress indicator. Reduce export time.',
        'Shop Transitions': 'Improve post-export upsell. Show print quality preview. Add social proof.',
        'Product Views': 'Improve shop landing. Show product benefits clearly. Add testimonials.',
        'Checkout Starts': 'Simplify product selection. Show clear pricing. Reduce steps to checkout.',
        'Purchases Complete': 'Optimize checkout flow. Add trust signals. Offer multiple payment options.',
    };

    for (let i = 1; i < funnel.length; i++) {
        const dropoff = 100 - (funnel[i].conversionFromPrevious || 0);
        if (dropoff > 50) { // Highlight significant dropoffs
            dropoffs.push({
                step: funnel[i].name,
                dropoff,
                suggestion: suggestions[funnel[i].name] || 'Investigate user behavior at this step.',
            });
        }
    }

    return dropoffs.sort((a, b) => b.dropoff - a.dropoff);
}

async function getTopPages(days: number): Promise<{ page: string; views: number }[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startTime = startDate.toISOString();

    const { data: pageViews } = await supabase
        .from('page_events')
        .select('page_url')
        .eq('event_type', 'page_view')
        .gte('created_at', startTime);

    const pageMap = new Map<string, number>();
    pageViews?.forEach(event => {
        const url = event.page_url || 'unknown';
        // Normalize URL to just the path
        const path = url.replace(/https?:\/\/[^\/]+/, '').split('?')[0];
        pageMap.set(path, (pageMap.get(path) || 0) + 1);
    });

    return Array.from(pageMap.entries())
        .map(([page, views]) => ({ page, views }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 10);
}

async function getRecentOrders(days: number): Promise<{ count: number; revenue: number }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startTime = startDate.toISOString();

    const { data: orders } = await supabase
        .from('orders')
        .select('amount_total, status')
        .gte('created_at', startTime)
        .in('status', ['paid', 'fulfilled', 'processing']);

    const count = orders?.length || 0;
    const revenue = orders?.reduce((sum, o) => sum + (o.amount_total || 0), 0) || 0;

    return { count, revenue: revenue / 100 }; // Convert cents to dollars
}

function printSection(title: string) {
    console.log('\n' + '═'.repeat(60));
    console.log(`  ${title}`);
    console.log('═'.repeat(60));
}

function printBar(value: number, max: number, width: number = 30): string {
    if (max === 0) return '░'.repeat(width);
    const ratio = Math.min(value / max, 1); // Cap at 100%
    const filled = Math.max(0, Math.round(ratio * width));
    return '█'.repeat(filled) + '░'.repeat(width - filled);
}

async function generateRecommendations(
    metrics: TrafficMetrics,
    funnel: FunnelStep[],
    referrers: ReferrerData[],
    retention: { day1: number; day7: number; day30: number },
    dropoffs: { step: string; dropoff: number; suggestion: string }[]
): Promise<string[]> {
    const recommendations: string[] = [];

    // Traffic volume recommendations
    if (metrics.uniqueSessions < 100) {
        recommendations.push('🚨 LOW TRAFFIC: Focus on acquisition channels before optimizing conversion.');
    }

    // Referrer recommendations
    const topReferrer = referrers[0];
    if (topReferrer && topReferrer.source !== 'direct') {
        recommendations.push(`📈 DOUBLE DOWN: "${topReferrer.source}" is your top traffic source. Increase investment here.`);
    }

    // Conversion recommendations
    const exportRate = metrics.uniqueSessions > 0 ? (metrics.posterExports / metrics.uniqueSessions) * 100 : 0;
    if (exportRate < 5) {
        recommendations.push('⚠️ LOW EXPORT RATE: Less than 5% of visitors export. Simplify the export flow.');
    }

    // Signup rate
    const signupRate = metrics.uniqueSessions > 0 ? (metrics.newSignups / metrics.uniqueSessions) * 100 : 0;
    if (signupRate < 2) {
        recommendations.push('👤 LOW SIGNUPS: Consider adding more value to logged-in experience.');
    }

    // Retention recommendations
    if (retention.day7 < 20) {
        recommendations.push('🔄 RETENTION ISSUE: Day-7 retention is low. Add engagement hooks (email, notifications).');
    }

    // Funnel recommendations based on dropoffs
    if (dropoffs.length > 0) {
        const biggestDropoff = dropoffs[0];
        recommendations.push(`🎯 BIGGEST OPPORTUNITY: ${biggestDropoff.step} has ${biggestDropoff.dropoff.toFixed(0)}% dropoff. ${biggestDropoff.suggestion}`);
    }

    // Purchase funnel
    const purchaseRate = metrics.posterExports > 0 ? (metrics.purchases / metrics.posterExports) * 100 : 0;
    if (purchaseRate < 1 && metrics.posterExports > 10) {
        recommendations.push('💰 MONETIZATION GAP: Users export but don\'t buy. Improve post-export shop transition.');
    }

    // Content/SEO
    if (referrers.filter(r => r.source.includes('google') || r.source.includes('search')).length === 0) {
        recommendations.push('🔍 SEO: No organic search traffic detected. Add content marketing strategy.');
    }

    // Social
    if (referrers.filter(r => r.source.includes('twitter') || r.source.includes('facebook') || r.source.includes('instagram')).length === 0) {
        recommendations.push('📱 SOCIAL: No social media traffic. Start sharing user creations on social platforms.');
    }

    return recommendations;
}

async function main() {
    const days = parseInt(process.argv[2] || '30', 10);

    console.log('\n🗺️  CARTO-ART TRAFFIC ANALYSIS');
    console.log(`   Analyzing last ${days} days of data`);
    console.log('   Generated: ' + new Date().toISOString());

    // Fetch all data
    console.log('\n⏳ Fetching data...');

    const [metrics, funnel, referrers, retention, orders, topPages] = await Promise.all([
        getTrafficMetrics(days),
        getFunnelAnalysis(days),
        getReferrerAnalysis(days),
        getRetentionMetrics(),
        getRecentOrders(days),
        getTopPages(days),
    ]);

    const dropoffs = await getDropoffAnalysis(days);

    // Print Traffic Overview
    printSection('📊 TRAFFIC OVERVIEW');
    console.log(`
  Page Views:     ${metrics.totalPageViews.toLocaleString()}
  Unique Sessions: ${metrics.uniqueSessions.toLocaleString()}
  Unique Users:   ${metrics.uniqueUsers.toLocaleString()}
  New Signups:    ${metrics.newSignups.toLocaleString()}
  Maps Created:   ${metrics.mapsCreated.toLocaleString()}
  Maps Published: ${metrics.mapsPublished.toLocaleString()}
  Poster Exports: ${metrics.posterExports.toLocaleString()}
  Purchases:      ${metrics.purchases.toLocaleString()}
  Revenue:        $${orders.revenue.toFixed(2)}
`);

    // Print Key Rates
    printSection('📈 KEY CONVERSION RATES');
    const sessionToSignup = metrics.uniqueSessions > 0 ? (metrics.newSignups / metrics.uniqueSessions) * 100 : 0;
    const sessionToExport = metrics.uniqueSessions > 0 ? (metrics.posterExports / metrics.uniqueSessions) * 100 : 0;
    const exportToPurchase = metrics.posterExports > 0 ? (metrics.purchases / metrics.posterExports) * 100 : 0;
    const signupToMap = metrics.newSignups > 0 ? (metrics.mapsCreated / metrics.newSignups) * 100 : 0;

    console.log(`
  Session → Signup:    ${sessionToSignup.toFixed(1)}%  ${printBar(sessionToSignup, 20, 20)}
  Session → Export:    ${sessionToExport.toFixed(1)}%  ${printBar(sessionToExport, 20, 20)}
  Export → Purchase:   ${exportToPurchase.toFixed(1)}%  ${printBar(exportToPurchase, 20, 20)}
  Signup → Map Create: ${signupToMap.toFixed(1)}%  ${printBar(signupToMap, 100, 20)}
`);

    // Print Funnel
    printSection('🔄 CONVERSION FUNNEL');
    const maxFunnelCount = Math.max(...funnel.map(f => f.count));
    funnel.forEach((step, i) => {
        const bar = printBar(step.count, maxFunnelCount, 25);
        const conv = i > 0 ? `(${step.conversionFromPrevious?.toFixed(0)}% from prev)` : '';
        console.log(`  ${(i + 1).toString().padStart(2)}. ${step.name.padEnd(20)} ${step.count.toString().padStart(6)} ${bar} ${conv}`);
    });

    // Print Top Referrers
    printSection('🔗 TOP TRAFFIC SOURCES');
    if (referrers.length === 0) {
        console.log('  No referrer data available');
    } else {
        const maxRef = Math.max(...referrers.map(r => r.count));
        referrers.slice(0, 10).forEach((ref, i) => {
            const bar = printBar(ref.count, maxRef, 20);
            console.log(`  ${(i + 1).toString().padStart(2)}. ${ref.source.padEnd(25)} ${ref.count.toString().padStart(5)} ${bar}`);
        });
    }

    // Print Top Pages
    printSection('📄 TOP PAGES');
    if (topPages.length === 0) {
        console.log('  No page view data available');
    } else {
        const maxPage = Math.max(...topPages.map(p => p.views));
        topPages.forEach((page, i) => {
            const bar = printBar(page.views, maxPage, 20);
            console.log(`  ${(i + 1).toString().padStart(2)}. ${page.page.padEnd(30).slice(0, 30)} ${page.views.toString().padStart(5)} ${bar}`);
        });
    }

    // Print Retention
    printSection('🔄 RETENTION RATES');
    console.log(`
  Day 1 Retention:  ${retention.day1.toFixed(1)}%  ${printBar(retention.day1, 100, 20)}
  Day 7 Retention:  ${retention.day7.toFixed(1)}%  ${printBar(retention.day7, 100, 20)}
  Day 30 Retention: ${retention.day30.toFixed(1)}%  ${printBar(retention.day30, 100, 20)}
`);

    // Print Dropoff Analysis
    if (dropoffs.length > 0) {
        printSection('⚠️ BIGGEST DROPOFFS');
        dropoffs.forEach((d, i) => {
            console.log(`  ${i + 1}. ${d.step}: ${d.dropoff.toFixed(0)}% dropoff`);
            console.log(`     → ${d.suggestion}`);
        });
    }

    // Print Recommendations
    const recommendations = await generateRecommendations(metrics, funnel, referrers, retention, dropoffs);

    printSection('🎯 ACTIONABLE RECOMMENDATIONS');
    if (recommendations.length === 0) {
        console.log('  ✅ No critical issues detected. Keep monitoring!');
    } else {
        recommendations.forEach((rec, i) => {
            console.log(`  ${i + 1}. ${rec}`);
        });
    }

    // Print quick wins
    printSection('⚡ QUICK WINS FOR TRAFFIC GROWTH');
    console.log(`
  1. CONTENT MARKETING
     • Create "Map of the Week" blog posts featuring interesting locations
     • Share user-created posters on social media (with permission)
     • Write SEO-optimized guides: "Best City Map Posters for [City Name]"

  2. SOCIAL MEDIA
     • Post daily map designs on Twitter/X, Instagram, Pinterest
     • Run "Design your hometown" campaigns
     • Partner with travel/design influencers

  3. SEO OPTIMIZATION
     • Add city-specific landing pages (/maps/new-york, /maps/london, etc.)
     • Optimize meta titles: "Custom [City] Map Poster - Create Your Own"
     • Add schema markup for products

  4. COMMUNITY BUILDING
     • Create a gallery of best user submissions
     • Add "Share to social" one-click buttons after export
     • Implement referral rewards

  5. PAID ACQUISITION
     • Pinterest Ads (high intent for home decor)
     • Google Ads for "custom map poster" keywords
     • Retarget visitors who exported but didn't purchase
`);

    console.log('\n' + '═'.repeat(60));
    console.log('  Analysis complete! Run with different timeframes:');
    console.log('  npx tsx cli_tools/traffic_analysis.ts 7    # Last 7 days');
    console.log('  npx tsx cli_tools/traffic_analysis.ts 90   # Last 90 days');
    console.log('═'.repeat(60) + '\n');
}

main().catch(console.error);
