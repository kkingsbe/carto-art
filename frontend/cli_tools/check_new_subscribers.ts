
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

export async function checkNewSubscribers() {
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const startTime = twentyFourHoursAgo.toISOString();

    console.log(`Checking new subscribers since ${startTime}...`);

    // Fetch subscription_upgrade events
    const { data: events, error } = await supabase
        .from('page_events')
        .select('*')
        .eq('event_type', 'subscription_upgrade')
        .gte('created_at', startTime);

    if (error) {
        console.error('Error fetching subscription events:', error);
        return;
    }

    const uniqueUsers = new Set(events?.map(e => e.user_id).filter(Boolean));

    console.log('\n--- New Subscribers (Last 24h) ---');
    console.log(`Total 'subscription_upgrade' events: ${events?.length || 0}`);
    console.log(`Unique New Subscribers: ${uniqueUsers.size}`);

    if (events && events.length > 0) {
        console.log('\nDetails:');

        for (const e of events) {
            console.log(`- ${e.created_at}: User ${e.user_id} (${e.event_name})`);

            // Deep dive into this user
            if (e.user_id) {
                console.log(`  Checking history for User ${e.user_id}...`);

                // Get all events for this user to find session_ids
                const { data: userEvents } = await supabase
                    .from('page_events')
                    .select('session_id, event_type, created_at')
                    .eq('user_id', e.user_id)
                    .order('created_at', { ascending: false });

                const sessionIds = new Set(userEvents?.map(ue => ue.session_id).filter(Boolean));

                // Check if any of these session_ids hit a wall (even if user_id was null at the time)
                if (sessionIds.size > 0) {
                    const { data: wallHits } = await supabase
                        .from('page_events')
                        .select('*')
                        .in('session_id', Array.from(sessionIds))
                        .in('event_type', ['paywall_shown', 'login_wall_shown']);

                    if (wallHits && wallHits.length > 0) {
                        console.log(`  -> FOUND WALL HITS! This user hit the wall ${wallHits.length} times before/during converting.`);
                        wallHits.forEach(wh => console.log(`     ${wh.created_at}: ${wh.event_type} (Session: ${wh.session_id})`));
                    } else {
                        console.log('  -> No wall hits found for this user\'s sessions.');
                    }
                }
            }
        }
    }
}
