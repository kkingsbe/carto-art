'use client';

import React, { useState, useEffect } from 'react';
import Joyride, { Step, CallBackProps, STATUS, ACTIONS, EVENTS } from 'react-joyride';
import { useTheme } from 'next-themes';

interface WalkthroughProps {
    steps: Step[];
    run: boolean;
    onFinish?: () => void;
    onSkip?: () => void;
}

export function Walkthrough({ steps, run, onFinish, onSkip }: WalkthroughProps) {
    const { theme } = useTheme();
    const [stepIndex, setStepIndex] = useState(0);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const handleJoyrideCallback = (data: CallBackProps) => {
        const { status, type, action } = data;

        if (([STATUS.FINISHED, STATUS.SKIPPED] as string[]).includes(status)) {
            if (status === STATUS.FINISHED && onFinish) onFinish();
            if (status === STATUS.SKIPPED && onSkip) onSkip();
        }

        if (type === EVENTS.STEP_AFTER || type === EVENTS.TARGET_NOT_FOUND) {
            setStepIndex(data.index + (action === ACTIONS.PREV ? -1 : 1));
        }
    };

    if (!isMounted) return null;

    return (
        <Joyride
            steps={steps}
            run={run}
            stepIndex={stepIndex}
            continuous
            showProgress
            showSkipButton
            scrollOffset={100}
            disableScrollParentFix={true}
            callback={handleJoyrideCallback}
            styles={{
                options: {
                    arrowColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                    backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                    overlayColor: 'rgba(0, 0, 0, 0.5)',
                    primaryColor: '#3b82f6', // blue-500
                    textColor: theme === 'dark' ? '#f3f4f6' : '#1f2937',
                    zIndex: 10000,
                },
                buttonNext: {
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    padding: '8px 16px',
                },
                buttonBack: {
                    marginRight: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: theme === 'dark' ? '#9ca3af' : '#6b7280',
                },
                buttonSkip: {
                    fontSize: '14px',
                    fontWeight: '500',
                    color: theme === 'dark' ? '#9ca3af' : '#6b7280',
                },
                tooltip: {
                    borderRadius: '16px',
                    padding: '12px',
                },
                tooltipContainer: {
                    textAlign: 'left'
                },
                tooltipTitle: {
                    fontSize: '18px',
                    fontWeight: '700',
                    marginBottom: '8px'
                },
                tooltipContent: {
                    fontSize: '14px',
                    lineHeight: '1.5',
                    color: theme === 'dark' ? '#d1d5db' : '#4b5563'
                }
            }}
            floaterProps={{
                disableAnimation: true,
            }}
        />
    );
}
