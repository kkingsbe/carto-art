'use client';

import { useEffect, useState, useCallback } from 'react';
import { Command } from 'cmdk';
import { Search, Map as MapIcon, RotateCw, Download, FileJson, Layout, Layers, Mountain, X, Sparkles, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { styles } from '@/lib/styles';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { VisuallyHidden } from '@/components/ui/visually-hidden';
import { PosterConfig } from '@/types/poster';

interface CommandMenuProps {
    onRandomize: () => void;
    onReset: () => void;
    onExport: () => void;
    onToggleStudio: () => void;
    onStartWalkthrough: () => void;
    config: PosterConfig;
    updateLocation: (location: any) => void;
    updateStyle: (style: any) => void;
    updateLayers: (layers: any) => void;
    isOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export function CommandMenu({
    onRandomize,
    onReset,
    onExport,
    onToggleStudio,
    onStartWalkthrough,
    config,
    updateLocation,
    updateStyle,
    updateLayers,
    isOpen: externalIsOpen,
    onOpenChange: externalOnOpenChange
}: CommandMenuProps) {
    const [open, setOpen] = useState(false);
    const { setTheme } = useTheme();

    const isMenuOpen = externalIsOpen !== undefined ? externalIsOpen : open;
    const setMenuOpen = externalOnOpenChange || setOpen;

    // Toggle the menu when ⌘K is pressed
    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                if (externalOnOpenChange) {
                    externalOnOpenChange(!isMenuOpen);
                } else {
                    setOpen((open) => !open);
                }
            }
        };

        document.addEventListener('keydown', down);
        return () => document.removeEventListener('keydown', down);
    }, [externalOnOpenChange, isMenuOpen, setOpen]);

    const toggleOpen = useCallback(() => {
        if (externalOnOpenChange) {
            externalOnOpenChange(!externalIsOpen);
        } else {
            setOpen(prev => !prev);
        }
    }, [externalIsOpen, externalOnOpenChange]);

    const runCommand = useCallback((command: () => void) => {
        setMenuOpen(false);
        command();
    }, [setMenuOpen]);

    // Cities for quick navigation
    const cities = [
        { name: 'Tokyo', center: [139.6917, 35.6895], zoom: 12 },
        { name: 'New York', center: [-74.0060, 40.7128], zoom: 12 },
        { name: 'London', center: [-0.1278, 51.5074], zoom: 12 },
        { name: 'Paris', center: [2.3522, 48.8566], zoom: 12 },
        { name: 'Berlin', center: [13.4050, 52.5200], zoom: 12 },
        { name: 'San Francisco', center: [-122.4194, 37.7749], zoom: 12 },
    ];

    return (
        <>
            <Dialog open={isMenuOpen} onOpenChange={setMenuOpen}>
                <DialogContent className="p-0 overflow-hidden max-w-2xl bg-transparent border-0 shadow-2xl">
                    <VisuallyHidden>
                        <DialogTitle>Command Menu</DialogTitle>
                        <DialogDescription>
                            Search for actions, navigation, styles, and settings.
                        </DialogDescription>
                    </VisuallyHidden>

                    <div className="bg-white dark:bg-gray-900 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 w-full">
                        <Command className="w-full bg-transparent">
                            <div className="flex items-center border-b border-gray-100 dark:border-gray-800 px-3 px-4">
                                <Search className="w-5 h-5 text-gray-400 mr-2" />
                                <Command.Input
                                    placeholder="Type a command or search..."
                                    className="w-full h-14 bg-transparent outline-none text-base text-gray-900 dark:text-white placeholder:text-gray-400"
                                />
                                <div className="flex items-center gap-1">
                                    <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                                        <span className="text-xs">ESC</span>
                                    </kbd>
                                </div>
                            </div>

                            <Command.List className="max-h-[60vh] overflow-y-auto overflow-x-hidden p-2">
                                <Command.Empty className="py-6 text-center text-sm text-gray-500">No results found.</Command.Empty>

                                <Command.Group heading="Actions" className="text-xs font-medium text-gray-500 mb-2 px-2">
                                    <Command.Item
                                        onSelect={() => runCommand(onRandomize)}
                                        className="flex items-center gap-2 px-2 py-2 rounded-lg cursor-default select-none hover:bg-gray-100 dark:hover:bg-gray-800 aria-selected:bg-blue-50 aria-selected:text-blue-900 dark:aria-selected:bg-blue-900/20 dark:aria-selected:text-blue-100 transition-colors"
                                    >
                                        <Sparkles className="w-4 h-4" />
                                        <span>Randomize Map</span>
                                    </Command.Item>
                                    <Command.Item
                                        onSelect={() => runCommand(onReset)}
                                        className="flex items-center gap-2 px-2 py-2 rounded-lg cursor-default select-none hover:bg-gray-100 dark:hover:bg-gray-800 aria-selected:bg-blue-50 aria-selected:text-blue-900 dark:aria-selected:bg-blue-900/20 dark:aria-selected:text-blue-100 transition-colors"
                                    >
                                        <RotateCw className="w-4 h-4" />
                                        <span>Reset View</span>
                                    </Command.Item>
                                    <Command.Item
                                        onSelect={() => runCommand(onToggleStudio)}
                                        className="flex items-center gap-2 px-2 py-2 rounded-lg cursor-default select-none hover:bg-gray-100 dark:hover:bg-gray-800 aria-selected:bg-blue-50 aria-selected:text-blue-900 dark:aria-selected:bg-blue-900/20 dark:aria-selected:text-blue-100 transition-colors"
                                    >
                                        <Layers className="w-4 h-4" />
                                        <span>Open Studio Controls</span>
                                    </Command.Item>
                                    <Command.Item
                                        onSelect={() => runCommand(onExport)}
                                        className="flex items-center gap-2 px-2 py-2 rounded-lg cursor-default select-none hover:bg-gray-100 dark:hover:bg-gray-800 aria-selected:bg-blue-50 aria-selected:text-blue-900 dark:aria-selected:bg-blue-900/20 dark:aria-selected:text-blue-100 transition-colors"
                                    >
                                        <Download className="w-4 h-4" />
                                        <span>Export / Download</span>
                                    </Command.Item>
                                    <Command.Item
                                        onSelect={() => runCommand(onStartWalkthrough)}
                                        className="flex items-center gap-2 px-2 py-2 rounded-lg cursor-default select-none hover:bg-gray-100 dark:hover:bg-gray-800 aria-selected:bg-blue-50 aria-selected:text-blue-900 dark:aria-selected:bg-blue-900/20 dark:aria-selected:text-blue-100 transition-colors"
                                    >
                                        <Search className="w-4 h-4" />
                                        <span>Start Walkthrough</span>
                                    </Command.Item>
                                </Command.Group>

                                <Command.Separator className="h-px bg-gray-100 dark:bg-gray-800 my-1 mx-2" />

                                <Command.Group heading="Navigation" className="text-xs font-medium text-gray-500 mb-2 px-2">
                                    {cities.map((city) => (
                                        <Command.Item
                                            key={city.name}
                                            onSelect={() => runCommand(() => {
                                                updateLocation({
                                                    center: city.center,
                                                    zoom: city.zoom,
                                                    city: city.name,
                                                    name: city.name
                                                });
                                            })}
                                            className="flex items-center gap-2 px-2 py-2 rounded-lg cursor-default select-none hover:bg-gray-100 dark:hover:bg-gray-800 aria-selected:bg-blue-50 aria-selected:text-blue-900 dark:aria-selected:bg-blue-900/20 dark:aria-selected:text-blue-100 transition-colors"
                                        >
                                            <MapIcon className="w-4 h-4" />
                                            <span>Go to {city.name}</span>
                                        </Command.Item>
                                    ))}
                                </Command.Group>

                                <Command.Separator className="h-px bg-gray-100 dark:bg-gray-800 my-1 mx-2" />

                                <Command.Group heading="Styles" className="text-xs font-medium text-gray-500 mb-2 px-2">
                                    {styles.slice(0, 5).map((style) => (
                                        <Command.Item
                                            key={style.id}
                                            onSelect={() => runCommand(() => updateStyle(style))}
                                            className="flex items-center gap-2 px-2 py-2 rounded-lg cursor-default select-none hover:bg-gray-100 dark:hover:bg-gray-800 aria-selected:bg-blue-50 aria-selected:text-blue-900 dark:aria-selected:bg-blue-900/20 dark:aria-selected:text-blue-100 transition-colors"
                                        >
                                            <Layout className="w-4 h-4" />
                                            <span>Switch to {style.name}</span>
                                        </Command.Item>
                                    ))}
                                </Command.Group>

                                <Command.Separator className="h-px bg-gray-100 dark:bg-gray-800 my-1 mx-2" />

                                <Command.Group heading="Toggles" className="text-xs font-medium text-gray-500 mb-2 px-2">
                                    <Command.Item
                                        onSelect={() => runCommand(() => updateLayers({ buildings3D: !config.layers.buildings3D }))}
                                        className="flex items-center gap-2 px-2 py-2 rounded-lg cursor-default select-none hover:bg-gray-100 dark:hover:bg-gray-800 aria-selected:bg-blue-50 aria-selected:text-blue-900 dark:aria-selected:bg-blue-900/20 dark:aria-selected:text-blue-100 transition-colors"
                                    >
                                        <Layers className="w-4 h-4" />
                                        <span>{config.layers.buildings3D ? 'Disable' : 'Enable'} 3D Buildings</span>
                                    </Command.Item>
                                    <Command.Item
                                        onSelect={() => runCommand(() => updateLayers({ labels: !config.layers.labels }))}
                                        className="flex items-center gap-2 px-2 py-2 rounded-lg cursor-default select-none hover:bg-gray-100 dark:hover:bg-gray-800 aria-selected:bg-blue-50 aria-selected:text-blue-900 dark:aria-selected:bg-blue-900/20 dark:aria-selected:text-blue-100 transition-colors"
                                    >
                                        <MapIcon className="w-4 h-4" />
                                        <span>{config.layers.labels ? 'Hide' : 'Show'} Labels</span>
                                    </Command.Item>
                                </Command.Group>

                                <Command.Separator className="h-px bg-gray-100 dark:bg-gray-800 my-1 mx-2" />

                                <Command.Group heading="Theme" className="text-xs font-medium text-gray-500 mb-2 px-2">
                                    <Command.Item
                                        onSelect={() => runCommand(() => setTheme('light'))}
                                        className="flex items-center gap-2 px-2 py-2 rounded-lg cursor-default select-none hover:bg-gray-100 dark:hover:bg-gray-800 aria-selected:bg-blue-50 aria-selected:text-blue-900 dark:aria-selected:bg-blue-900/20 dark:aria-selected:text-blue-100 transition-colors"
                                    >
                                        <Sun className="w-4 h-4" />
                                        <span>Light Mode</span>
                                    </Command.Item>
                                    <Command.Item
                                        onSelect={() => runCommand(() => setTheme('dark'))}
                                        className="flex items-center gap-2 px-2 py-2 rounded-lg cursor-default select-none hover:bg-gray-100 dark:hover:bg-gray-800 aria-selected:bg-blue-50 aria-selected:text-blue-900 dark:aria-selected:bg-blue-900/20 dark:aria-selected:text-blue-100 transition-colors"
                                    >
                                        <Moon className="w-4 h-4" />
                                        <span>Dark Mode</span>
                                    </Command.Item>
                                </Command.Group>

                            </Command.List>
                        </Command>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
