import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import type { FeedbackSubmission } from '@/types/feedback';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Get current user (optional - allow anonymous feedback)
        const {
            data: { user },
        } = await supabase.auth.getUser();

        const body: FeedbackSubmission = await request.json();

        // Validate required fields
        if (!body.trigger_type || !body.overall_rating) {
            return NextResponse.json(
                { error: 'trigger_type and overall_rating are required' },
                { status: 400 }
            );
        }

        // Validate overall_rating range
        if (body.overall_rating < 1 || body.overall_rating > 5) {
            return NextResponse.json(
                { error: 'overall_rating must be between 1 and 5' },
                { status: 400 }
            );
        }

        // Validate nps_score range if provided
        if (body.nps_score !== undefined && (body.nps_score < 0 || body.nps_score > 10)) {
            return NextResponse.json(
                { error: 'nps_score must be between 0 and 10' },
                { status: 400 }
            );
        }

        // Get session ID from cookie or generate one for anonymous users
        const sessionId = request.cookies.get('feedback_session')?.value ||
            `anon_${Date.now()}_${Math.random().toString(36).substring(7)}`;

        // Insert feedback
        // Note: Uses feedback table once migration is applied
        const feedbackData = {
            user_id: user?.id || null,
            session_id: user ? null : sessionId,
            trigger_type: body.trigger_type,
            trigger_context: body.trigger_context || null,
            overall_rating: body.overall_rating,
            nps_score: body.nps_score || null,
            use_cases: body.use_cases || null,
            pain_points: body.pain_points || null,
            feature_ratings: body.feature_ratings || null,
            open_feedback: body.open_feedback || null,
            allow_followup: body.allow_followup || false,
            user_agent: request.headers.get('user-agent'),
            page_url: body.trigger_context?.page_url || null,
        };

        const { data, error } = await (supabase as any)
            .from('feedback')
            .insert(feedbackData)
            .select()
            .single();

        if (error) {
            logger.error('Failed to insert feedback', { error, userId: user?.id });
            return NextResponse.json(
                { error: 'Failed to submit feedback' },
                { status: 500 }
            );
        }

        // Update feedback tracking
        if (user) {
            const trackingData = {
                user_id: user.id,
                last_submitted_at: new Date().toISOString(),
                prompt_count: 0, // Reset on submit
            };
            await (supabase as any)
                .from('feedback_tracking')
                .upsert(trackingData, { onConflict: 'user_id' });
        }

        logger.info('Feedback submitted successfully', {
            feedbackId: data.id,
            userId: user?.id,
            triggerType: body.trigger_type,
            overallRating: body.overall_rating,
            npsScore: body.nps_score,
        });

        const response = NextResponse.json({ success: true, id: data.id }, { status: 201 });

        // Set session cookie for anonymous users
        if (!user) {
            response.cookies.set('feedback_session', sessionId, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 60 * 60 * 24 * 365, // 1 year
            });
        }

        return response;
    } catch (error: any) {
        logger.error('Error processing feedback submission', { error });
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
