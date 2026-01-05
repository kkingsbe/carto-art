'use client';

import { useState } from 'react';
import { MessageSquarePlus } from 'lucide-react';
import { FeedbackModal } from './FeedbackModal';
import { useFeedback } from './useFeedback';
import { cn } from '@/lib/utils';
import { Tooltip } from '@/components/ui/tooltip';

export function FeedbackWidget() {
    const [isOpen, setIsOpen] = useState(false);

    const {
        isSubmitting,
        submitFeedback,
        dismissFeedback,
    } = useFeedback({
        triggerType: 'voluntary',
    });

    return (
        <>
            <Tooltip content="Help us improve!" side="left">
                <button
                    onClick={() => setIsOpen(true)}
                    className={cn(
                        "group flex items-center justify-center",
                        "w-10 h-10 rounded-full",
                        "bg-white dark:bg-gray-800",
                        "border border-gray-200 dark:border-gray-700",
                        "shadow-lg hover:shadow-xl",
                        "text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400",
                        "transition-all duration-300 hover:scale-110",
                        "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    )}
                    aria-label="Give Feedback"
                >
                    <MessageSquarePlus className="w-5 h-5 transition-transform group-hover:rotate-12" />
                </button>
            </Tooltip>

            <FeedbackModal
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                onSubmit={submitFeedback}
                isSubmitting={isSubmitting}
                onDismiss={(optOut) => {
                    setIsOpen(false);
                    if (optOut) dismissFeedback(true);
                }}
            />
        </>
    );
}
