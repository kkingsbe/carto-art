import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { ShouldShowFeedbackResponse, TriggerType } from '@/types/feedback';

// How often to prompt for feedback (every Nth export)
const EXPORT_PROMPT_FREQUENCY = 3;
// Minimum hours between prompts
const MIN_HOURS_BETWEEN_PROMPTS = 24;
// Maximum dismissals before we stop asking
const MAX_DISMISSALS = 3;

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();

        const {
            data: { user },
        } = await supabase.auth.getUser();

        const sessionId = request.cookies.get('feedback_session')?.value;

        // Get trigger type and context from query params
        const { searchParams } = new URL(request.url);
        const triggerType = searchParams.get('trigger') as TriggerType | null;
        const exportCount = parseInt(searchParams.get('export_count') || '0', 10);

        // Default response: don't show
        const defaultResponse: ShouldShowFeedbackResponse = {
            should_show: false,
        };

        // If no trigger type specified, don't show
        if (!triggerType) {
            return NextResponse.json(defaultResponse);
        }

        // Check tracking data
        // Note: Uses feedback_tracking table once migration is applied
        let tracking: any = null;

        if (user) {
            const { data } = await (supabase as any)
                .from('feedback_tracking')
                .select('*')
                .eq('user_id', user.id)
                .single();
            tracking = data;
        } else if (sessionId) {
            const { data } = await (supabase as any)
                .from('feedback_tracking')
                .select('*')
                .eq('session_id', sessionId)
                .single();
            tracking = data;
        }

        // Check if opted out
        if (tracking?.opted_out) {
            return NextResponse.json(defaultResponse);
        }

        // Check if too many dismissals
        if (tracking && tracking.dismiss_count >= MAX_DISMISSALS) {
            return NextResponse.json(defaultResponse);
        }

        // Check if recently prompted
        if (tracking?.last_prompt_at) {
            const lastPrompt = new Date(tracking.last_prompt_at);
            const hoursSinceLastPrompt = (Date.now() - lastPrompt.getTime()) / (1000 * 60 * 60);

            if (hoursSinceLastPrompt < MIN_HOURS_BETWEEN_PROMPTS) {
                return NextResponse.json(defaultResponse);
            }
        }

        // Check if already submitted feedback recently (within 30 days)
        if (tracking?.last_submitted_at) {
            const lastSubmit = new Date(tracking.last_submitted_at);
            const daysSinceSubmit = (Date.now() - lastSubmit.getTime()) / (1000 * 60 * 60 * 24);

            if (daysSinceSubmit < 30) {
                return NextResponse.json(defaultResponse);
            }
        }

        // Trigger-specific logic
        let shouldShow = false;
        let delayMs = 1500; // Default delay

        switch (triggerType) {
            case 'post_export':
                // Show on first export, then every Nth export
                shouldShow = exportCount === 1 || (exportCount > 0 && exportCount % EXPORT_PROMPT_FREQUENCY === 0);
                delayMs = 2000; // Wait for export to complete visually
                break;

            case 'voluntary':
                // Always show for voluntary triggers
                shouldShow = true;
                delayMs = 0;
                break;

            case 'gallery_browse':
                // Only show if no recent feedback and no active prompt
                shouldShow = !tracking?.last_prompt_at;
                delayMs = 3000;
                break;

            case 'return_visit':
                // Show on 3rd session if no feedback yet
                shouldShow = !tracking?.last_submitted_at;
                delayMs = 5000; // Give user time to orient
                break;

            default:
                shouldShow = false;
        }

        if (shouldShow) {
            // Update prompt tracking
            if (user) {
                const insertData = {
                    user_id: user.id,
                    last_prompt_at: new Date().toISOString(),
                    prompt_count: (tracking?.prompt_count || 0) + 1,
                };
                await (supabase as any)
                    .from('feedback_tracking')
                    .upsert(insertData, { onConflict: 'user_id' });
            } else if (sessionId) {
                const insertData = {
                    session_id: sessionId,
                    last_prompt_at: new Date().toISOString(),
                    prompt_count: (tracking?.prompt_count || 0) + 1,
                };
                await (supabase as any)
                    .from('feedback_tracking')
                    .upsert(insertData, { onConflict: 'session_id' });
            }
        }

        const response: ShouldShowFeedbackResponse = {
            should_show: shouldShow,
            trigger_type: shouldShow ? triggerType : undefined,
            delay_ms: shouldShow ? delayMs : undefined,
        };

        return NextResponse.json(response);
    } catch (error: any) {
        // On error, default to not showing feedback
        return NextResponse.json({ should_show: false });
    }
}
