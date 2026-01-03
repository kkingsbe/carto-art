'use client';

import { useState } from 'react';
import { Download, Loader2, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ExportOptionsModal } from './ExportOptionsModal';
import { KofiTipModal } from './KofiTipModal';
import { FeedbackModal } from '@/components/feedback/FeedbackModal';
import { useFeedback } from '@/components/feedback/useFeedback';
import { Tooltip } from '@/components/ui/tooltip';
import { EXPORT_RESOLUTIONS } from '@/lib/export/constants';
import type { ExportResolution } from '@/lib/export/resolution';
import type { PosterConfig } from '@/types/poster';

interface ExportButtonProps {
  onExport: (resolution: ExportResolution) => void;
  isExporting: boolean;
  format: PosterConfig['format'];
  className?: string;
}

export function ExportButton({ onExport, isExporting, format, className }: ExportButtonProps) {
  const [showKofiModal, setShowKofiModal] = useState(false);
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [localExportCount, setLocalExportCount] = useState(0);

  // Integrate feedback system
  // We track local exports to decide when to trigger the check
  const {
    shouldShow,
    showFeedback,
    isSubmitting: isFeedbackSubmitting,
    submitFeedback,
    dismissFeedback
  } = useFeedback({
    triggerType: 'post_export',
    exportCount: localExportCount,
  });

  const handleExportClick = () => {
    setShowOptionsModal(true);
  };

  const handleStartExport = (resolution: ExportResolution) => {
    setShowOptionsModal(false);
    onExport(resolution);
    setShowKofiModal(true);
    // Increment local export count to potentially trigger feedback check
    setLocalExportCount(prev => prev + 1);
  };

  const handleCloseKofi = () => {
    setShowKofiModal(false);
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <Tooltip
          content="Select resolution and export your poster as a high-quality PNG image."
          side="left"
        >
          <button
            type="button"
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            title="Export format info"
          >
            <Info className="w-4 h-4" />
          </button>
        </Tooltip>
        <button
          type="button"
          onClick={handleExportClick}
          disabled={isExporting}
          className={cn(
            'group relative flex items-center gap-2 px-5 py-2.5 rounded-full font-medium shadow-lg transition-all duration-300',
            'bg-gray-900 text-white dark:bg-white dark:text-gray-900',
            'hover:shadow-xl hover:scale-105 active:scale-95',
            'disabled:opacity-70 disabled:cursor-wait disabled:hover:scale-100 disabled:shadow-lg',
            className
          )}
        >
          <div className={cn(
            "transition-transform duration-300",
            isExporting ? "scale-0 w-0" : "scale-100"
          )}>
            <Download className="h-4 w-4" />
          </div>

          {isExporting && (
            <div className="absolute left-5 top-1/2 -translate-y-1/2">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          )}

          <span className={cn(
            "transition-all duration-300",
            isExporting && "translate-x-4"
          )}>
            {isExporting ? 'Exporting...' : 'Export Poster'}
          </span>
        </button>
      </div>

      <ExportOptionsModal
        isOpen={showOptionsModal}
        onClose={() => setShowOptionsModal(false)}
        onExport={handleStartExport}
        isExporting={isExporting}
        format={format}
      />

      <KofiTipModal
        isOpen={showKofiModal}
        onClose={handleCloseKofi}
      />

      {/* Feedback Modal - Only show if indicated AND donation modal is closed */}
      <FeedbackModal
        isOpen={shouldShow && !showKofiModal}
        onClose={() => dismissFeedback(false)}
        onDismiss={dismissFeedback}
        onSubmit={submitFeedback}
        isSubmitting={isFeedbackSubmitting}
      />
    </>
  );
}

