
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectExports() {
    console.log('Fetching last 20 poster_export events...');
    const { data: events, error } = await supabase
        .from('page_events')
        .select('*')
        .eq('event_type', 'export_modal_view')
        .order('created_at', { ascending: false })
        .limit(20);

    if (error) {
        console.error('Error fetching events:', error);
        return;
    }

    console.log(`Found ${events.length} modal view events:`);
    console.table(events.map(e => ({
        created_at: new Date(e.created_at).toLocaleString(),
        user_id: e.user_id ? `${e.user_id.substring(0, 8)}...` : 'NULL',
        session_id: e.session_id ? `${e.session_id.substring(0, 8)}...` : 'NULL',
        metadata: JSON.stringify(e.metadata || {}).substring(0, 50),
        event_name: e.event_name
    })));

    // Count null session IDs
    const nullSessions = events.filter(e => !e.session_id).length;
    console.log(`\nEvents with NULL session_id: ${nullSessions}/${events.length}`);
}

inspectExports();
