import { useEffect } from 'react';

interface UseEditorKeyboardShortcutsProps {
    undo: () => void;
    redo: () => void;
    canUndo: boolean;
    canRedo: boolean;
}

export function useEditorKeyboardShortcuts({
    undo,
    redo,
    canUndo,
    canRedo,
}: UseEditorKeyboardShortcutsProps) {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // CMD/CTRL + Z = Undo
            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                if (canUndo) undo();
            }
            // CMD/CTRL + Y (Windows) or CMD/CTRL + SHIFT + Z (Mac) = Redo
            else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
                e.preventDefault();
                if (canRedo) redo();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [canUndo, canRedo, undo, redo]);
}
