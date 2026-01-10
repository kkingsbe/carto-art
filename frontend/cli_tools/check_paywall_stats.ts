
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

export async function checkPaywallStats() {
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const startTime = twentyFourHoursAgo.toISOString();

    console.log(`Checking paywall stats since ${startTime}...`);

    // 1. Fetch paywall_shown events
    const { data: paywallData, error: paywallError } = await supabase
        .from('page_events')
        .select('session_id, user_id, event_type, created_at')
        .in('event_type', ['paywall_shown', 'login_wall_shown'])
        .gte('created_at', startTime);

    if (paywallError) {
        console.error('Error fetching paywall events:', paywallError);
        return;
    }

    const paywallHits = paywallData?.filter(e => e.event_type === 'paywall_shown') || [];
    const loginWallHits = paywallData?.filter(e => e.event_type === 'login_wall_shown') || [];

    const uniquePaywallUsers = new Set(paywallHits.map(e => e.user_id || e.session_id).filter(Boolean));
    const uniqueLoginWallUsers = new Set(loginWallHits.map(e => e.session_id).filter(Boolean));

    console.log('\n--- Paywall Stats (Last 24h) ---');
    console.log(`Total 'paywall_shown' events: ${paywallHits.length}`);
    console.log(`Unique Users (paywall): ${uniquePaywallUsers.size}`);

    console.log(`\nTotal 'login_wall_shown' events: ${loginWallHits.length}`);
    console.log(`Unique Sessions (login wall): ${uniqueLoginWallUsers.size}`);

    const totalUnique = new Set([
        ...uniquePaywallUsers,
        ...uniqueLoginWallUsers
    ]);
    console.log(`\nTotal Unique Users hit any wall: ${totalUnique.size}`);

    if (paywallHits.length > 0) {
        console.log('\n--- Paywall User Details ---');
        paywallHits.forEach(e => {
            console.log(`- ${e.created_at}: User ${e.user_id}`);
        });
    }
}
