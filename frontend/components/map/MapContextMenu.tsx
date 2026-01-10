import React, { useEffect, useRef } from 'react';
import { Plus } from 'lucide-react';
import { createPortal } from 'react-dom';

interface MapContextMenuProps {
    x: number;
    y: number;
    onClose: () => void;
    onAddMarker: () => void;
}

export const MapContextMenu: React.FC<MapContextMenuProps> = ({
    x,
    y,
    onClose,
    onAddMarker,
}) => {
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);
        // Prevent context menu on the custom menu itself
        const handleContextMenu = (e: Event) => e.preventDefault();
        menuRef.current?.addEventListener('contextmenu', handleContextMenu);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
            menuRef.current?.removeEventListener('contextmenu', handleContextMenu);
        };
    }, [onClose]);

    if (typeof document === 'undefined') return null;

    // Portal to body to ensure it sits on top of everything (including map canvas)
    return createPortal(
        <div
            ref={menuRef}
            className="fixed z-[9999] min-w-[160px] bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-100"
            style={{
                left: x,
                top: y,
            }}
        >
            <button
                onClick={() => {
                    onAddMarker();
                    onClose();
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors"
            >
                <Plus size={16} />
                Add Marker Here
            </button>
        </div>,
        document.body
    );
};
