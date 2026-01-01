'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Loader2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip } from '@/components/ui/tooltip';

interface SaveButtonProps {
  onSave: (name: string) => Promise<void>;
  currentMapName?: string | null;
  hasUnsavedChanges?: boolean;
  isAuthenticated: boolean;
  disabled?: boolean;
}

export function SaveButton({
  onSave,
  currentMapName,
  hasUnsavedChanges,
  isAuthenticated,
  disabled
}: SaveButtonProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSaveClick = () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (currentMapName) {
      // If editing existing map, save directly without dialog
      handleSave(currentMapName);
    } else {
      // New project - show dialog
      setProjectName('');
      setError(null);
      setShowDialog(true);
    }
  };

  const handleSave = async (name: string) => {
    if (!name.trim() || isSaving) return;

    setIsSaving(true);
    setError(null);
    try {
      await onSave(name.trim());
      setShowDialog(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
      setIsSaving(false);
    } catch (err: any) {
      setError(err.message || 'Failed to save project. Please try again.');
      setIsSaving(false);
    }
  };

  const handleDialogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim()) {
      setError('Please enter a project name');
      return;
    }
    handleSave(projectName);
  };

  if (!isAuthenticated) {
    return (
      <Tooltip content="Sign in to save your work">
        <button
          type="button"
          disabled={disabled}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all',
            'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400',
            'hover:bg-gray-200 dark:hover:bg-gray-700',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
          onClick={handleSaveClick}
        >
          <Save className="h-4 w-4" />
          <span className="hidden md:inline">Save</span>
        </button>
      </Tooltip>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={handleSaveClick}
        disabled={isSaving || disabled}
        className={cn(
          'group relative flex items-center gap-2 px-4 py-2 rounded-full font-medium shadow-md transition-all duration-300',
          hasUnsavedChanges
            ? 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg'
            : currentMapName
            ? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750',
          'disabled:opacity-70 disabled:cursor-wait disabled:hover:shadow-md'
        )}
        title={currentMapName ? `Save "${currentMapName}"` : 'Save as new project'}
      >
        <div className={cn(
          "transition-transform duration-300",
          (isSaving || showSuccess) ? "scale-0 w-0" : "scale-100"
        )}>
          <Save className="h-4 w-4" />
        </div>
        
        {isSaving && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        )}

        {showSuccess && !isSaving && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2">
            <Check className="h-4 w-4 text-green-600" />
          </div>
        )}

        <span className={cn(
          "transition-all duration-300",
          (isSaving || showSuccess) && "translate-x-4"
        )}>
          {isSaving ? 'Saving...' : showSuccess ? 'Saved!' : currentMapName ? 'Save' : 'Save Project'}
        </span>
        
        {hasUnsavedChanges && (
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
        )}
      </button>

      {/* Save Dialog */}
      {showDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => {
              setShowDialog(false);
              setError(null);
            }}
          />
          <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 z-10">
            <div className="p-6 space-y-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Save Project
              </h2>
              
              <form onSubmit={handleDialogSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Project Name
                  </label>
                  <input
                    type="text"
                    value={projectName}
                    onChange={(e) => {
                      setProjectName(e.target.value);
                      setError(null);
                    }}
                    placeholder="My Awesome Map"
                    autoFocus
                    className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={isSaving}
                  />
                </div>

                {error && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowDialog(false);
                      setError(null);
                    }}
                    disabled={isSaving}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!projectName.trim() || isSaving}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

