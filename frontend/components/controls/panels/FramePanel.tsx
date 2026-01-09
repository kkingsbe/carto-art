'use client';

import { FormatControls } from '@/components/controls/FormatControls';
import type { PosterConfig } from '@/types/poster';

interface FramePanelProps {
    config: PosterConfig;
    updateFormat: (format: Partial<PosterConfig['format']>) => void;
}

export function FramePanel({ config, updateFormat }: FramePanelProps) {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-500">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Frame & Layout</h3>
            </div>
            <FormatControls
                format={config.format}
                onFormatChange={updateFormat}
            />
        </div>
    );
}
