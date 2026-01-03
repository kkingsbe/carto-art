'use client';

import { useState } from 'react';
import { FeedbackModal } from './FeedbackModal';
import type { FeedbackFormData } from './FeedbackModal';
import type { FeedbackSubmission, TriggerType } from '@/types/feedback';

interface FeedbackTriggerProps {
    label?: string;
    className?: string;
}

/**
 * A button/link that opens the feedback modal for voluntary feedback
 */
export function FeedbackTrigger({
    label = 'Give Feedback',
    className = ''
}: FeedbackTriggerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (data: FeedbackFormData): Promise<boolean> => {
        setIsSubmitting(true);
        try {
            const submission: FeedbackSubmission = {
                ...data,
                trigger_type: 'voluntary' as TriggerType,
                trigger_context: {
                    page_url: window.location.href,
                },
            };

            const response = await fetch('/api/feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(submission),
            });

            return response.ok;
        } catch (error) {
            console.error('Error submitting feedback:', error);
            return false;
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDismiss = () => {
        setIsOpen(false);
    };

    return (
        <>
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                className={`
          inline-flex items-center gap-2
          text-gray-600 dark:text-gray-400
          hover:text-gray-900 dark:hover:text-gray-100
          transition-colors
          ${className}
        `}
            >
                <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                </svg>
                {label}
            </button>

            <FeedbackModal
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
                onDismiss={handleDismiss}
            />
        </>
    );
}
