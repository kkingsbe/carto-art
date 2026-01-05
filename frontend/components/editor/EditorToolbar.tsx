'use client';

import {
    Undo2,
    Redo2,
    RotateCcw,
    Download,
    Save,
    Copy,
    Shuffle,
    Search
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
    onRandomize?: () => void;
    onSave: (name: string) => Promise<void>;
    onSaveCopy: (name: string) => Promise<void>;
    onExport: (resolution?: any) => Promise<void>;
    isExporting: boolean;
    exportProgress: { stage: string; percent: number } | null;
    gifProgress: number;
    currentMapName: string | null;
    hasUnsavedChanges?: boolean;
    isAuthenticated: boolean;
    format: PosterConfig['format'];
    currentMapId: string | null;
    showDonationModal: boolean;
    onDonationModalChange: (show: boolean) => void;
    onOpenCommandMenu: () => void;
    onBuyPrint?: () => void;
}

export function EditorToolbar({
    onUndo,
    onRedo,
    canUndo,
    canRedo,
    onReset,
    onRandomize,
    onSave,
    onSaveCopy,
    onExport,
    isExporting,
    exportProgress,
    gifProgress,
    currentMapName,
    hasUnsavedChanges,
    isAuthenticated,
    format,
    currentMapId,
    showDonationModal,
    onDonationModalChange,
    onOpenCommandMenu,
    onBuyPrint
}: EditorToolbarProps) {
    return (
        <div className="absolute top-2 right-2 md:top-6 md:right-8 z-45 pointer-events-auto flex items-center gap-2 md:gap-3 flex-wrap justify-end max-w-[calc(100vw-4rem)]">
            {/* History Controls */}
            <div className="flex items-center p-1 gap-1 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-xl border border-white/20 dark:border-white/10 shadow-lg ring-1 ring-black/5">
                <button
                    onClick={onUndo}
                    disabled={!canUndo}
                    className={cn(
                        "p-3 md:p-2.5 rounded-lg transition-all",
                        canUndo
                            ? "text-gray-700 hover:text-gray-900 hover:bg-white/50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700/50"
                            : "text-gray-300 dark:text-gray-600 cursor-not-allowed"
                    )}
                    title="Undo (Ctrl+Z)"
                >
                    <Undo2 className="w-5 h-5 md:w-4 md:h-4" />
                </button>
                <button
                    onClick={onRedo}
                    disabled={!canRedo}
                    className={cn(
                        "p-3 md:p-2.5 rounded-lg transition-all",
                        canRedo
                            ? "text-gray-700 hover:text-gray-900 hover:bg-white/50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700/50"
                            : "text-gray-300 dark:text-gray-600 cursor-not-allowed"
                    )}
                    title="Redo (Ctrl+Shift+Z)"
                >
                    <Redo2 className="w-5 h-5 md:w-4 md:h-4" />
                </button>
                <div className="w-px h-4 bg-gray-200 dark:bg-gray-700 mx-1" />
                {onRandomize && (
                    <div id="walkthrough-randomize">
                        <button
                            onClick={onRandomize}
                            className="p-3 md:p-2.5 rounded-lg transition-all text-gray-700 hover:text-blue-600 hover:bg-blue-50 dark:text-gray-300 dark:hover:text-blue-400 dark:hover:bg-blue-900/30"
                            title="Randomize Theme & Location"
                        >
                            <Shuffle className="w-5 h-5 md:w-4 md:h-4" />
                        </button>
                    </div>
                )}
                <button
                    onClick={onReset}
                    className="p-3 md:p-2.5 rounded-lg transition-all text-gray-700 hover:text-red-600 hover:bg-red-50 dark:text-gray-300 dark:hover:text-red-400 dark:hover:bg-red-900/30"
                    title={currentMapId ? "Exit saved map" : "Reset to default"}
                >
                    <RotateCcw className="w-5 h-5 md:w-4 md:h-4" />
                </button>
                <div className="w-px h-4 bg-gray-200 dark:bg-gray-700 mx-1" />
                <button
                    onClick={onOpenCommandMenu}
                    className="flex items-center gap-2 p-1.5 md:p-1 pr-3 md:pr-2 rounded-lg transition-all text-gray-700 hover:text-blue-600 hover:bg-blue-50 dark:text-gray-300 dark:hover:text-blue-400 dark:hover:bg-blue-900/30 group"
                    title="Open Command Palette (Ctrl+K)"
                >
                    <div className="p-1.5 md:p-1.5 rounded-md bg-gray-100 dark:bg-gray-700 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 transition-colors">
                        <Search className="w-5 h-5 md:w-4 md:h-4" />
                    </div>
                    <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-1.5 font-mono text-[10px] font-medium text-gray-400 dark:text-gray-500 opacity-100 shadow-sm">
                        <span className="text-[10px]">⌘</span>
                        <span className="text-[10px]">K</span>
                    </kbd>
                </button>
            </div>

            {/* Action Buttons - Hidden on mobile, moved to bottom bar */}
            <div className="hidden md:flex items-center gap-2">
                <div id="walkthrough-save">
                    <SaveButton
                        onSave={onSave}
                        currentMapName={currentMapName}
                        hasUnsavedChanges={hasUnsavedChanges}
                        isAuthenticated={isAuthenticated}
                        disabled={isExporting}
                        className="shadow-lg backdrop-blur-md"
                    />
                </div>
                <SaveCopyButton
                    onSave={onSaveCopy}
                    currentMapName={currentMapName}
                    isAuthenticated={isAuthenticated}
                    disabled={isExporting}
                    className="shadow-lg backdrop-blur-md"
                />
                <div id="walkthrough-export">
                    <ExportButton
                        onExport={onExport}
                        isExporting={isExporting}
                        exportProgress={exportProgress}
                        gifProgress={gifProgress}
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
        </div>
    );
}
