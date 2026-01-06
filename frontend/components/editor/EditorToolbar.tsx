'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Undo2,
    Redo2,
    RotateCcw,
    Download,
    Save,
    Copy,
    Shuffle,
    Search,
    Loader2,
    Check,
    MoreHorizontal
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip } from '@/components/ui/tooltip';
import { ExportOptionsModal } from '@/components/controls/ExportOptionsModal';
import { ExportSuccessModal } from '@/components/controls/ExportSuccessModal';
import type { PosterConfig } from '@/types/poster';
import type { ExportUsageResult } from '@/lib/actions/usage.types';
import type { ExportResolution } from '@/lib/export/resolution';
import type { GifExportOptions } from '@/hooks/useGifExport';
import type { VideoExportOptions } from '@/hooks/useVideoExport';

interface EditorToolbarProps {
    onUndo: () => void;
    onRedo: () => void;
    canUndo: boolean;
    canRedo: boolean;
    onReset: () => void;
    onRandomize?: () => void;
    onSave: (name: string) => Promise<void>;
    onSaveCopy: (name: string) => Promise<void>;
    onExport: (resolution?: any, gifOptions?: any, videoOptions?: any) => Promise<void>;
    isExporting: boolean;
    exportProgress: { stage: string; percent: number } | null;
    gifProgress: number;
    videoProgress?: number;
    currentMapName: string | null;
    hasUnsavedChanges?: boolean;
    isAuthenticated: boolean;
    format: PosterConfig['format'];
    currentMapId: string | null;
    showDonationModal: boolean;
    onDonationModalChange: (show: boolean) => void;
    onOpenCommandMenu: () => void;
    onBuyPrint?: () => void;
    onFormatChange: (format: Partial<PosterConfig['format']>) => void;
    onCopyState?: () => void;
    showCopyStateButton?: boolean;
    exportCount?: number;
    subscriptionTier?: 'free' | 'carto_plus';
    exportUsage?: ExportUsageResult | null;
    onExportComplete?: () => void;
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
    videoProgress,
    currentMapName,
    hasUnsavedChanges,
    isAuthenticated,
    format,
    currentMapId,
    showDonationModal,
    onDonationModalChange,
    onOpenCommandMenu,
    onBuyPrint,
    onFormatChange,
    onCopyState,
    showCopyStateButton,
    exportCount,
    subscriptionTier,
    exportUsage,
    onExportComplete
}: EditorToolbarProps) {
    const router = useRouter();

    // Save state
    const [isSaving, setIsSaving] = useState(false);
    const [showSaveSuccess, setShowSaveSuccess] = useState(false);
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [projectName, setProjectName] = useState('');
    const [saveError, setSaveError] = useState<string | null>(null);

    // Save copy state
    const [isSavingCopy, setIsSavingCopy] = useState(false);
    const [showCopySuccess, setShowCopySuccess] = useState(false);
    const [showCopyDialog, setShowCopyDialog] = useState(false);
    const [copyProjectName, setCopyProjectName] = useState('');
    const [copyError, setCopyError] = useState<string | null>(null);

    // Export state
    const [showExportModal, setShowExportModal] = useState(false);

    // Save handlers
    const handleSaveClick = () => {
        if (!isAuthenticated) {
            router.push('/login');
            return;
        }
        if (currentMapName) {
            handleSave(currentMapName);
        } else {
            setProjectName('');
            setSaveError(null);
            setShowSaveDialog(true);
        }
    };

    const handleSave = async (name: string) => {
        if (!name.trim() || isSaving) return;
        setIsSaving(true);
        setSaveError(null);
        try {
            await onSave(name.trim());
            setShowSaveDialog(false);
            setShowSaveSuccess(true);
            setTimeout(() => setShowSaveSuccess(false), 2000);
        } catch (err: any) {
            setSaveError(err.message || 'Failed to save project.');
        } finally {
            setIsSaving(false);
        }
    };

    // Save copy handlers
    const handleSaveCopyClick = () => {
        if (!isAuthenticated) {
            router.push('/login');
            return;
        }
        setCopyProjectName(currentMapName ? `${currentMapName} - Copy` : 'Untitled Map - Copy');
        setCopyError(null);
        setShowCopyDialog(true);
    };

    const handleSaveCopy = async (name: string) => {
        if (!name.trim() || isSavingCopy) return;
        setIsSavingCopy(true);
        setCopyError(null);
        try {
            await onSaveCopy(name.trim());
            setShowCopyDialog(false);
            setShowCopySuccess(true);
            setTimeout(() => setShowCopySuccess(false), 2000);
        } catch (err: any) {
            setCopyError(err.message || 'Failed to save copy.');
        } finally {
            setIsSavingCopy(false);
        }
    };

    // Export handlers
    const handleExportClick = () => {
        setShowExportModal(true);
    };

    const handleStartExport = async (resolution: ExportResolution, gifOptions?: GifExportOptions, videoOptions?: VideoExportOptions) => {
        try {
            await onExport(resolution, gifOptions, videoOptions);
            setTimeout(() => {
                setShowExportModal(false);
                onDonationModalChange(true);
                onExportComplete?.();
            }, 500);
        } catch (error) {
            setShowExportModal(false);
        }
    };

    const iconButtonBase = "p-2.5 rounded-lg transition-all duration-200";
    const iconButtonEnabled = "text-gray-600 hover:text-gray-900 hover:bg-gray-100/80 dark:text-gray-400 dark:hover:text-white dark:hover:bg-white/10";
    const iconButtonDisabled = "text-gray-300 dark:text-gray-600 cursor-not-allowed";

    // Mobile Menu State
    const [showMobileMenu, setShowMobileMenu] = useState(false);

    return (
        <>
            <div className="absolute top-2 right-2 md:top-6 md:right-8 z-45 pointer-events-auto flex items-center gap-2 md:gap-3 flex-wrap justify-end max-w-[calc(100vw-1rem)]">
                {/* Unified Toolbar Container */}
                <div className="flex items-center p-1.5 gap-0.5 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-xl shadow-black/5">

                    {/* Primary History Actions (Always Visible) */}
                    <div className="flex items-center">
                        <Tooltip content="Undo (Ctrl+Z)" side="bottom">
                            <button
                                onClick={onUndo}
                                disabled={!canUndo}
                                className={cn(iconButtonBase, canUndo ? iconButtonEnabled : iconButtonDisabled)}
                            >
                                <Undo2 className="w-[18px] h-[18px]" />
                            </button>
                        </Tooltip>
                        <Tooltip content="Redo (Ctrl+Shift+Z)" side="bottom">
                            <button
                                onClick={onRedo}
                                disabled={!canRedo}
                                className={cn(iconButtonBase, canRedo ? iconButtonEnabled : iconButtonDisabled)}
                            >
                                <Redo2 className="w-[18px] h-[18px]" />
                            </button>
                        </Tooltip>
                    </div>

                    <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1.5" />

                    {/* Secondary Actions - Desktop */}
                    <div className="hidden md:flex items-center gap-0.5">
                        {onRandomize && (
                            <div id="walkthrough-randomize">
                                <Tooltip content="Randomize Style & Location" side="bottom">
                                    <button
                                        onClick={onRandomize}
                                        className={cn(iconButtonBase, "text-gray-600 hover:text-purple-600 hover:bg-purple-50 dark:text-gray-400 dark:hover:text-purple-400 dark:hover:bg-purple-900/30")}
                                    >
                                        <Shuffle className="w-[18px] h-[18px]" />
                                    </button>
                                </Tooltip>
                            </div>
                        )}
                        <Tooltip content={currentMapId ? "Exit saved map" : "Reset to default"} side="bottom">
                            <button
                                onClick={onReset}
                                className={cn(iconButtonBase, "text-gray-600 hover:text-red-600 hover:bg-red-50 dark:text-gray-400 dark:hover:text-red-400 dark:hover:bg-red-900/30")}
                            >
                                <RotateCcw className="w-[18px] h-[18px]" />
                            </button>
                        </Tooltip>

                        {showCopyStateButton && onCopyState && (
                            <Tooltip content="Copy State to JSON" side="bottom">
                                <button
                                    onClick={onCopyState}
                                    className={cn(iconButtonBase, iconButtonEnabled)}
                                >
                                    <Copy className="w-[18px] h-[18px]" />
                                </button>
                            </Tooltip>
                        )}

                        <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1.5" />

                        {/* Search */}
                        <Tooltip content="Command Palette (⌘K)" side="bottom">
                            <button
                                onClick={onOpenCommandMenu}
                                className={cn(iconButtonBase, iconButtonEnabled, "flex items-center gap-1.5")}
                            >
                                <Search className="w-[18px] h-[18px]" />
                                <kbd className="hidden lg:inline-flex h-5 select-none items-center gap-0.5 rounded border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 px-1.5 font-mono text-[10px] font-medium text-gray-500 dark:text-gray-400">
                                    ⌘K
                                </kbd>
                            </button>
                        </Tooltip>
                    </div>

                    {/* Mobile Menu Trigger */}
                    <div className="md:hidden relative">
                        <button
                            onClick={() => setShowMobileMenu(!showMobileMenu)}
                            className={cn(iconButtonBase, iconButtonEnabled, showMobileMenu && "bg-gray-100 dark:bg-gray-800")}
                        >
                            <MoreHorizontal className="w-[18px] h-[18px]" />
                        </button>

                        {/* Mobile Dropdown */}
                        {showMobileMenu && (
                            <>
                                <div
                                    className="fixed inset-0 z-40 bg-transparent"
                                    onClick={() => setShowMobileMenu(false)}
                                />
                                <div className="absolute right-0 top-full mt-2 w-48 py-1 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-xl z-50 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                                    {onRandomize && (
                                        <button
                                            onClick={() => { onRandomize(); setShowMobileMenu(false); }}
                                            className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
                                        >
                                            <Shuffle className="w-4 h-4 text-purple-500" />
                                            Randomize
                                        </button>
                                    )}
                                    <button
                                        onClick={() => { onReset(); setShowMobileMenu(false); }}
                                        className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
                                    >
                                        <RotateCcw className="w-4 h-4 text-red-500" />
                                        Reset Project
                                    </button>
                                    <button
                                        onClick={() => { onOpenCommandMenu(); setShowMobileMenu(false); }}
                                        className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
                                    >
                                        <Search className="w-4 h-4" />
                                        Search Commands
                                    </button>

                                    {showCopyStateButton && onCopyState && (
                                        <button
                                            onClick={() => { onCopyState(); setShowMobileMenu(false); }}
                                            className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
                                        >
                                            <Copy className="w-4 h-4" />
                                            Copy State
                                        </button>
                                    )}
                                </div>
                            </>
                        )}
                    </div>

                    <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1.5" />

                    {/* Main Actions (Save/Export) - Always Visible */}
                    <div className="flex items-center">

                        {/* Save Button */}
                        <div id="walkthrough-save">
                            <Tooltip content={
                                !isAuthenticated
                                    ? "Sign in to save"
                                    : currentMapName
                                        ? `Save "${currentMapName}"`
                                        : "Save as new project"
                            } side="bottom">
                                <button
                                    onClick={handleSaveClick}
                                    disabled={isSaving || isExporting}
                                    className={cn(
                                        iconButtonBase,
                                        "relative",
                                        isAuthenticated
                                            ? "text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/30"
                                            : "text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:text-gray-500 dark:hover:text-gray-400",
                                        (isSaving || isExporting) && "opacity-50 cursor-not-allowed"
                                    )}
                                >
                                    {isSaving ? (
                                        <Loader2 className="w-[18px] h-[18px] animate-spin" />
                                    ) : showSaveSuccess ? (
                                        <Check className="w-[18px] h-[18px] text-green-600" />
                                    ) : (
                                        <Save className="w-[18px] h-[18px]" />
                                    )}
                                    {hasUnsavedChanges && (
                                        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-orange-500 rounded-full ring-2 ring-white dark:ring-gray-900" />
                                    )}
                                </button>
                            </Tooltip>
                        </div>

                        {/* Save Copy Button - Desktop Only */}
                        <div className="hidden md:block">
                            <Tooltip content={!isAuthenticated ? "Sign in to save copies" : "Save as Copy"} side="bottom">
                                <button
                                    onClick={handleSaveCopyClick}
                                    disabled={isSavingCopy || isExporting}
                                    className={cn(
                                        iconButtonBase,
                                        isAuthenticated ? iconButtonEnabled : "text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:text-gray-500",
                                        (isSavingCopy || isExporting) && "opacity-50 cursor-not-allowed"
                                    )}
                                >
                                    {isSavingCopy ? (
                                        <Loader2 className="w-[18px] h-[18px] animate-spin" />
                                    ) : showCopySuccess ? (
                                        <Check className="w-[18px] h-[18px] text-green-600" />
                                    ) : (
                                        <Copy className="w-[18px] h-[18px]" />
                                    )}
                                </button>
                            </Tooltip>
                        </div>

                        <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1.5" />

                        {/* Export Button - Text hidden on mobile, Icon shown */}
                        <div id="walkthrough-export">
                            <Tooltip content="Export Poster" side="bottom">
                                <button
                                    onClick={handleExportClick}
                                    disabled={isExporting}
                                    className={cn(
                                        "flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-200",
                                        "bg-gradient-to-r from-blue-600 to-blue-500 text-white",
                                        "hover:from-blue-700 hover:to-blue-600 hover:shadow-lg hover:shadow-blue-500/25",
                                        "active:scale-95",
                                        isExporting && "opacity-70 cursor-not-allowed"
                                    )}
                                >
                                    {isExporting ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Download className="w-4 h-4" />
                                    )}
                                    <span className="hidden md:inline text-sm font-medium">Export</span>
                                </button>
                            </Tooltip>
                        </div>
                    </div>
                </div>
            </div>

            {/* Save Dialog */}
            {showSaveDialog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={() => { setShowSaveDialog(false); setSaveError(null); }}
                    />
                    <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full mx-4 z-10">
                        <div className="p-6 space-y-4">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                                Save Project
                            </h2>
                            <form onSubmit={(e) => { e.preventDefault(); handleSave(projectName); }} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Project Name
                                    </label>
                                    <input
                                        type="text"
                                        value={projectName}
                                        onChange={(e) => { setProjectName(e.target.value); setSaveError(null); }}
                                        placeholder="My Awesome Map"
                                        autoFocus
                                        className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        disabled={isSaving}
                                    />
                                </div>
                                {saveError && (
                                    <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                                        <p className="text-sm text-red-600 dark:text-red-400">{saveError}</p>
                                    </div>
                                )}
                                <div className="flex items-center justify-end gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => { setShowSaveDialog(false); setSaveError(null); }}
                                        disabled={isSaving}
                                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={!projectName.trim() || isSaving}
                                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                                    >
                                        {isSaving ? 'Saving...' : 'Save'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Save Copy Dialog */}
            {showCopyDialog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={() => { setShowCopyDialog(false); setCopyError(null); }}
                    />
                    <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full mx-4 z-10">
                        <div className="p-6 space-y-4">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                                Save a Copy
                            </h2>
                            <form onSubmit={(e) => { e.preventDefault(); handleSaveCopy(copyProjectName); }} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Project Name
                                    </label>
                                    <input
                                        type="text"
                                        value={copyProjectName}
                                        onChange={(e) => { setCopyProjectName(e.target.value); setCopyError(null); }}
                                        placeholder="My Awesome Map - Copy"
                                        autoFocus
                                        className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        disabled={isSavingCopy}
                                    />
                                </div>
                                {copyError && (
                                    <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                                        <p className="text-sm text-red-600 dark:text-red-400">{copyError}</p>
                                    </div>
                                )}
                                <div className="flex items-center justify-end gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => { setShowCopyDialog(false); setCopyError(null); }}
                                        disabled={isSavingCopy}
                                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={!copyProjectName.trim() || isSavingCopy}
                                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                                    >
                                        {isSavingCopy ? 'Saving...' : 'Save Copy'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Export Options Modal */}
            <ExportOptionsModal
                isOpen={showExportModal}
                onClose={() => !isExporting && setShowExportModal(false)}
                onExport={handleStartExport}
                isExporting={isExporting}
                exportProgress={exportProgress}
                gifProgress={gifProgress}
                videoProgress={videoProgress}
                format={format}
                onFormatChange={onFormatChange}
                subscriptionTier={subscriptionTier}
                exportUsage={exportUsage}
            />

            {/* Export Success Modal */}
            <ExportSuccessModal
                isOpen={showDonationModal}
                onClose={() => onDonationModalChange(false)}
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
