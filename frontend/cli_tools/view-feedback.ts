
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function viewFeedback() {
    console.log('\n--- User Feedback ---');

    const { data: feedback, error } = await supabase
        .from('feedback')
        .select(`
            *,
            profiles:user_id (username, display_name)
        `)
        .order('created_at', { ascending: false })
        .limit(20);

    if (error) {
        console.error('Error fetching feedback:', error);
        return;
    }

    if (!feedback || feedback.length === 0) {
        console.log('No feedback found.');
        return;
    }

    feedback.forEach((item: any, index: number) => {
        const date = new Date(item.created_at).toLocaleString();
        const profile = item.profiles;
        const user = profile ? (profile.display_name || profile.username) : (item.session_id ? `Session: ${item.session_id.substring(0, 8)}...` : 'Anonymous');

        console.log(`\n[${index + 1}] ${date} - User: ${user}`);
        console.log(`Rating: ${'★'.repeat(item.overall_rating)}${'☆'.repeat(5 - item.overall_rating)} (NPS: ${item.nps_score ?? 'N/A'})`);
        console.log(`Trigger: ${item.trigger_type}`);

        if (item.use_cases && item.use_cases.length > 0) {
            console.log(`Use Cases: ${item.use_cases.join(', ')}`);
        }

        if (item.pain_points && item.pain_points.length > 0) {
            console.log(`Pain Points: ${item.pain_points.join(', ')}`);
        }

        if (item.open_feedback) {
            console.log(`Feedback: "${item.open_feedback}"`);
        }

        console.log('-'.repeat(40));
    });
}

viewFeedback().catch(console.error);
