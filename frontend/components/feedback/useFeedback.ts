'use client';

import { useState, useCallback, useEffect } from 'react';
import type {
    FeedbackSubmission,
    FeedbackDismissal,
    ShouldShowFeedbackResponse,
    TriggerType
} from '@/types/feedback';

interface UseFeedbackOptions {
    triggerType: TriggerType;
    exportCount?: number;
    mapId?: string;
}

interface UseFeedbackReturn {
    shouldShow: boolean;
    isLoading: boolean;
    isSubmitting: boolean;
    delayMs: number;
    showFeedback: () => void;
    hideFeedback: () => void;
    submitFeedback: (data: Omit<FeedbackSubmission, 'trigger_type' | 'trigger_context'>) => Promise<boolean>;
    dismissFeedback: (optOut?: boolean) => Promise<void>;
}

export function useFeedback({
    triggerType,
    exportCount = 0,
    mapId
}: UseFeedbackOptions): UseFeedbackReturn {
    const [shouldShow, setShouldShow] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [delayMs, setDelayMs] = useState(0);

    // Check if we should show feedback
    const checkShouldShow = useCallback(async () => {
        if (triggerType === 'voluntary') {
            setShouldShow(true);
            setDelayMs(0);
            return;
        }

        setIsLoading(true);
        try {
            const params = new URLSearchParams({
                trigger: triggerType,
                export_count: exportCount.toString(),
            });

            const response = await fetch(`/api/feedback/should-show?${params}`);
            const data: ShouldShowFeedbackResponse = await response.json();

            if (data.should_show && data.delay_ms !== undefined) {
                setDelayMs(data.delay_ms);
                // Apply delay before showing
                setTimeout(() => {
                    setShouldShow(true);
                }, data.delay_ms);
            }
        } catch (error) {
            console.error('Error checking feedback status:', error);
        } finally {
            setIsLoading(false);
        }
    }, [triggerType, exportCount]);

    // Manual show (for voluntary triggers)
    const showFeedback = useCallback(() => {
        setShouldShow(true);
    }, []);

    // Hide feedback modal
    const hideFeedback = useCallback(() => {
        setShouldShow(false);
    }, []);

    // Submit feedback
    const submitFeedback = useCallback(async (
        data: Omit<FeedbackSubmission, 'trigger_type' | 'trigger_context'>
    ): Promise<boolean> => {
        setIsSubmitting(true);
        try {
            const submission: FeedbackSubmission = {
                ...data,
                trigger_type: triggerType,
                trigger_context: {
                    export_count: exportCount,
                    map_id: mapId,
                    page_url: window.location.href,
                },
            };

            const response = await fetch('/api/feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(submission),
            });

            if (!response.ok) {
                throw new Error('Failed to submit feedback');
            }

            setShouldShow(false);
            return true;
        } catch (error) {
            console.error('Error submitting feedback:', error);
            return false;
        } finally {
            setIsSubmitting(false);
        }
    }, [triggerType, exportCount, mapId]);

    // Dismiss feedback
    const dismissFeedback = useCallback(async (optOut = false) => {
        try {
            const dismissal: FeedbackDismissal = {
                trigger_type: triggerType,
                opted_out: optOut,
            };

            await fetch('/api/feedback/dismiss', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dismissal),
            });
        } catch (error) {
            console.error('Error dismissing feedback:', error);
        } finally {
            setShouldShow(false);
        }
    }, [triggerType]);

    // Auto-check on mount for non-voluntary triggers
    useEffect(() => {
        if (triggerType !== 'voluntary' && exportCount > 0) {
            checkShouldShow();
        }
    }, [triggerType, exportCount, checkShouldShow]);

    return {
        shouldShow,
        isLoading,
        isSubmitting,
        delayMs,
        showFeedback,
        hideFeedback,
        submitFeedback,
        dismissFeedback,
    };
}
