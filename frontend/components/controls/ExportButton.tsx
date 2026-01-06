'use client';

import { useState } from 'react';
import { Download, Loader2, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ExportOptionsModal } from './ExportOptionsModal';
import { ExportSuccessModal } from './ExportSuccessModal';
import { FeedbackModal } from '@/components/feedback/FeedbackModal';
import { useFeedback } from '@/components/feedback/useFeedback';
import { Tooltip } from '@/components/ui/tooltip';
import { EXPORT_RESOLUTIONS } from '@/lib/export/constants';
import type { ExportResolution } from '@/lib/export/resolution';
import type { PosterConfig } from '@/types/poster';
import type { GifExportOptions } from '@/hooks/useGifExport';
import type { VideoExportOptions } from '@/hooks/useVideoExport';

interface ExportButtonProps {
  onExport: (resolution: ExportResolution, gifOptions?: GifExportOptions, videoOptions?: VideoExportOptions) => Promise<void> | void;
  isExporting: boolean;
  exportProgress?: { stage: string; percent: number } | null;
  gifProgress?: number;
  videoProgress?: number;
  format: PosterConfig['format'];
  className?: string;
  showDonationModal: boolean;
  onDonationModalChange: (show: boolean) => void;
  onBuyPrint?: () => void;
  onSave: (name: string) => Promise<void>;
  isAuthenticated: boolean;
  currentMapName?: string | null;
  hasUnsavedChanges?: boolean;
  onFormatChange: (format: Partial<PosterConfig['format']>) => void;
  exportCount?: number;
  subscriptionTier?: 'free' | 'carto_plus';
}

export function ExportButton({
  onExport,
  isExporting,
  exportProgress,
  gifProgress,
  videoProgress,
  format,
  className,
  showDonationModal,
  onDonationModalChange,
  onBuyPrint,
  onSave,
  isAuthenticated,
  currentMapName,
  hasUnsavedChanges,
  onFormatChange,
  exportCount,
  subscriptionTier
}: ExportButtonProps) {
  const [showOptionsModal, setShowOptionsModal] = useState(false);

  const handleExportClick = () => {
    setShowOptionsModal(true);
  };

  const handleStartExport = async (resolution: ExportResolution, gifOptions?: GifExportOptions, videoOptions?: VideoExportOptions) => {
    // Keep modal open to show progress
    try {
      await onExport(resolution, gifOptions, videoOptions);
      // Wait a moment for the "Done!" state to be visible
      setTimeout(() => {
        setShowOptionsModal(false);
        onDonationModalChange(true);
      }, 500);
    } catch (error) {
      // Modal stays open or closes on error? Let's close it so user can retry
      setShowOptionsModal(false);
    }
  };

  const handleCloseSuccess = () => {
    onDonationModalChange(false);
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
            'group relative flex items-center gap-2 px-5 py-2.5 rounded-full font-medium shadow-md transition-all duration-300',
            'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600',
            'hover:shadow-lg hover:bg-gray-50 dark:hover:bg-gray-750 hover:scale-105 active:scale-95',
            'disabled:opacity-70 disabled:cursor-wait disabled:hover:scale-100 disabled:shadow-md',
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
        onClose={() => !isExporting && setShowOptionsModal(false)}
        onExport={handleStartExport}
        isExporting={isExporting}
        exportProgress={exportProgress}
        gifProgress={gifProgress}
        videoProgress={videoProgress}
        format={format}
        onFormatChange={onFormatChange}
      />

      <ExportSuccessModal
        isOpen={showDonationModal}
        onClose={handleCloseSuccess}
        onBuyPrint={onBuyPrint}
        onSave={onSave}
        isAuthenticated={isAuthenticated}
        currentMapName={currentMapName}
        hasUnsavedChanges={hasUnsavedChanges}
        exportCount={exportCount}
      />
    </>
  );
}

