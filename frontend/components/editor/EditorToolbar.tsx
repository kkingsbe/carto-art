'use client';

import {
    Undo2,
    Redo2,
    RotateCcw,
    Download,
    Save,
    Copy
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SaveButton } from '@/components/controls/SaveButton';
import { SaveCopyButton } from '@/components/controls/SaveCopyButton';
import { ExportButton } from '@/components/controls/ExportButton';
import type { PosterConfig } from '@/types/poster';

interface EditorToolbarProps {
    onUndo: () => void;
    onRedo: () => void;
    canUndo: boolean;
    canRedo: boolean;
    onReset: () => void;
    onSave: (name: string) => Promise<void>;
    onSaveCopy: (name: string) => Promise<void>;
    onExport: (resolution?: any) => Promise<void>;
    isExporting: boolean;
    currentMapName: string | null;
    hasUnsavedChanges?: boolean;
    isAuthenticated: boolean;
    format: PosterConfig['format'];
    currentMapId: string | null;
    showDonationModal: boolean;
    onDonationModalChange: (show: boolean) => void;
    onBuyPrint?: () => void;
}

export function EditorToolbar({
    onUndo,
    onRedo,
    canUndo,
    canRedo,
    onReset,
    onSave,
    onSaveCopy,
    onExport,
    isExporting,
    currentMapName,
    hasUnsavedChanges,
    isAuthenticated,
    format,
    currentMapId,
    showDonationModal,
    onDonationModalChange,
    onBuyPrint
}: EditorToolbarProps) {
    return (
        <div className="absolute top-6 right-8 z-50 pointer-events-auto flex items-center gap-3">
            {/* History Controls */}
            <div className="flex items-center p-1 gap-1 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-xl border border-white/20 dark:border-white/10 shadow-lg ring-1 ring-black/5">
                <button
                    onClick={onUndo}
                    disabled={!canUndo}
                    className={cn(
                        "p-2.5 rounded-lg transition-all",
                        canUndo
                            ? "text-gray-700 hover:text-gray-900 hover:bg-white/50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700/50"
                            : "text-gray-300 dark:text-gray-600 cursor-not-allowed"
                    )}
                    title="Undo (Ctrl+Z)"
                >
                    <Undo2 className="w-4 h-4" />
                </button>
                <button
                    onClick={onRedo}
                    disabled={!canRedo}
                    className={cn(
                        "p-2.5 rounded-lg transition-all",
                        canRedo
                            ? "text-gray-700 hover:text-gray-900 hover:bg-white/50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700/50"
                            : "text-gray-300 dark:text-gray-600 cursor-not-allowed"
                    )}
                    title="Redo (Ctrl+Shift+Z)"
                >
                    <Redo2 className="w-4 h-4" />
                </button>
                <div className="w-px h-4 bg-gray-200 dark:bg-gray-700 mx-1" />
                <button
                    onClick={onReset}
                    className="p-2.5 rounded-lg transition-all text-gray-700 hover:text-red-600 hover:bg-red-50 dark:text-gray-300 dark:hover:text-red-400 dark:hover:bg-red-900/30"
                    title={currentMapId ? "Exit saved map" : "Reset to default"}
                >
                    <RotateCcw className="w-4 h-4" />
                </button>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
                <SaveButton
                    onSave={onSave}
                    currentMapName={currentMapName}
                    hasUnsavedChanges={hasUnsavedChanges}
                    isAuthenticated={isAuthenticated}
                    disabled={isExporting}
                    className="shadow-lg backdrop-blur-md"
                />
                <SaveCopyButton
                    onSave={onSaveCopy}
                    currentMapName={currentMapName}
                    isAuthenticated={isAuthenticated}
                    disabled={isExporting}
                    className="shadow-lg backdrop-blur-md"
                />
                <ExportButton
                    onExport={onExport}
                    isExporting={isExporting}
                    format={format}
                    className="shadow-lg backdrop-blur-md"
                    showDonationModal={showDonationModal}
                    onDonationModalChange={onDonationModalChange}
                    onBuyPrint={onBuyPrint}
                    onSave={onSave}
                    isAuthenticated={isAuthenticated}
                    currentMapName={currentMapName}
                    hasUnsavedChanges={hasUnsavedChanges}
                />
            </div>
        </div>
    );
}
