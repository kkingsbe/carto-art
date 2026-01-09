'use client';

import { AutomationControls } from '@/components/controls/AutomationControls';
import type { AnimationType } from '@/hooks/useMapAnimation';

interface AnimationPanelProps {
    onAnimationStart: (type: AnimationType) => void;
    onAnimationStop: () => void;
    isPlaying: boolean;
    activeAnimation: AnimationType | null;
}

export function AnimationPanel({
    onAnimationStart,
    onAnimationStop,
    isPlaying,
    activeAnimation
}: AnimationPanelProps) {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-500">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Animation</h3>
            </div>
            <AutomationControls
                onAnimationStart={onAnimationStart}
                onAnimationStop={onAnimationStop}
                isPlaying={isPlaying}
                activeAnimation={activeAnimation}
            />
        </div>
    );
}
