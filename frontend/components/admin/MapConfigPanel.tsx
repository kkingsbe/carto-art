'use client';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { X, RotateCcw } from 'lucide-react';
import { PosterStyle } from '@/types/poster';
import { darkModeStyle } from '@/lib/styles/dark-mode';
import { midnightStyle } from '@/lib/styles/midnight';

// Available styles for the admin map
const ADMIN_STYLES = [
    { id: 'dark-neon', name: 'Dark Neon', style: darkModeStyle, paletteId: 'dark-neon' },
    { id: 'dark-gold', name: 'Dark Gold', style: darkModeStyle, paletteId: 'dark-gold' },
    { id: 'midnight', name: 'Midnight', style: midnightStyle, paletteId: 'midnight' },
];

export interface AdminMapConfig {
    styleId: string;
    markerColor: string;
    showLabels: boolean;
    showPopulation: boolean;
    showSavedMaps: boolean;
    showExports: boolean;
}

interface MapConfigPanelProps {
    config: AdminMapConfig;
    onChange: (newConfig: AdminMapConfig) => void;
    onClose: () => void;
    onReset: () => void;
}

export function MapConfigPanel({ config, onChange, onClose, onReset }: MapConfigPanelProps) {
    const handleStyleChange = (styleId: string) => {
        onChange({ ...config, styleId });
    };

    return (
        <div className="absolute top-4 right-4 z-20 w-72 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md rounded-xl p-4 shadow-2xl border border-gray-200 dark:border-gray-800 animate-in slide-in-from-right-2 duration-200">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold">Map Settings</h3>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
                    <X className="w-4 h-4" />
                </Button>
            </div>

            <div className="space-y-4">
                {/* Style Selector */}
                <div className="space-y-2">
                    <Label className="text-xs text-gray-500">Theme</Label>
                    <div className="grid grid-cols-2 gap-2">
                        {ADMIN_STYLES.map((style) => (
                            <button
                                key={style.id}
                                onClick={() => handleStyleChange(style.id)}
                                className={`px-2 py-1.5 text-xs text-left rounded-md border transition-all ${config.styleId === style.id
                                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 text-blue-700 dark:text-blue-300'
                                    : 'bg-transparent border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                    }`}
                            >
                                {style.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Marker Color */}
                <div className="space-y-2">
                    <Label className="text-xs text-gray-500">Marker Color</Label>
                    <div className="flex items-center gap-2">
                        <Input
                            type="color"
                            value={config.markerColor}
                            onChange={(e) => onChange({ ...config, markerColor: e.target.value })}
                            className="w-10 h-8 p-1 cursor-pointer"
                        />
                        <span className="text-xs font-mono text-gray-500">{config.markerColor}</span>
                    </div>
                </div>

                {/* Toggles */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <Label className="text-xs text-gray-500 font-medium">Data Layers</Label>
                    </div>
                    <div className="flex items-center justify-between pl-2">
                        <Label className="text-xs text-gray-500">Show Saved Maps</Label>
                        <Switch
                            checked={config.showSavedMaps}
                            onCheckedChange={(checked) => onChange({ ...config, showSavedMaps: checked })}
                        />
                    </div>
                    <div className="flex items-center justify-between pl-2">
                        <Label className="text-xs text-gray-500">Show Exports</Label>
                        <Switch
                            checked={config.showExports}
                            onCheckedChange={(checked) => onChange({ ...config, showExports: checked })}
                        />
                    </div>

                    <div className="pt-2">
                        <Label className="text-xs text-gray-500 font-medium">Map Layers</Label>
                    </div>
                    <div className="flex items-center justify-between pl-2">
                        <Label className="text-xs text-gray-500">Show Labels</Label>
                        <Switch
                            checked={config.showLabels}
                            onCheckedChange={(checked) => onChange({ ...config, showLabels: checked })}
                        />
                    </div>
                    <div className="flex items-center justify-between pl-2">
                        <Label className="text-xs text-gray-500">Show Population</Label>
                        <Switch
                            checked={config.showPopulation}
                            onCheckedChange={(checked: boolean) => onChange({ ...config, showPopulation: checked })}
                        />
                    </div>
                </div>

                <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-xs text-gray-500 hover:text-red-500"
                        onClick={onReset}
                    >
                        <RotateCcw className="w-3 h-3 mr-2" />
                        Reset View & Config
                    </Button>
                </div>
            </div>
        </div>
    );
}
