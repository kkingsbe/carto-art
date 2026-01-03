import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import type { FeedbackDismissal } from '@/types/feedback';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        const {
            data: { user },
        } = await supabase.auth.getUser();

        const body: FeedbackDismissal = await request.json();

        if (!body.trigger_type) {
            return NextResponse.json(
                { error: 'trigger_type is required' },
                { status: 400 }
            );
        }

        const sessionId = request.cookies.get('feedback_session')?.value;

        if (user) {
            // Update tracking for authenticated user - try insert first, then update on conflict
            const insertData = {
                user_id: user.id,
                last_prompt_at: new Date().toISOString(),
                dismiss_count: 1,
                opted_out: body.opted_out || false,
            };

            // Note: This will use the feedback_tracking table once the migration is applied
            const { error } = await (supabase as any)
                .from('feedback_tracking')
                .upsert(insertData, { onConflict: 'user_id' });

            if (error) {
                // Fallback: try just updating if upsert failed
                await (supabase as any)
                    .from('feedback_tracking')
                    .update({
                        last_prompt_at: new Date().toISOString(),
                        opted_out: body.opted_out || false,
                    })
                    .eq('user_id', user.id);
            }
        } else if (sessionId) {
            // Update tracking for anonymous session
            const insertData = {
                session_id: sessionId,
                last_prompt_at: new Date().toISOString(),
                dismiss_count: 1,
                opted_out: body.opted_out || false,
            };

            await (supabase as any)
                .from('feedback_tracking')
                .upsert(insertData, { onConflict: 'session_id' });
        }

        logger.info('Feedback dismissed', {
            userId: user?.id,
            sessionId: sessionId || null,
            triggerType: body.trigger_type,
            optedOut: body.opted_out || false,
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        logger.error('Error processing feedback dismissal', { error });
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
