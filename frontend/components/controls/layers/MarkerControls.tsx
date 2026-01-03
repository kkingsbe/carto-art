import { PosterConfig, ColorPalette } from '@/types/poster';
import { cn } from '@/lib/utils';
import { useState, useMemo } from 'react';
import { HexColorPicker } from 'react-colorful';
import { Target, MapPin, Circle, Radio, Heart, Home } from 'lucide-react';
import { ControlLabel, ControlInput } from '@/components/ui/control-components';

interface MarkerControlsProps {
    layers: PosterConfig['layers'];
    palette: ColorPalette;
    onLayersChange: (layers: Partial<PosterConfig['layers']>) => void;
}

const markerTypes = [
    { id: 'crosshair', icon: Target, label: 'Target' },
    { id: 'pin', icon: MapPin, label: 'Pin' },
    { id: 'dot', icon: Circle, label: 'Dot' },
    { id: 'ring', icon: Radio, label: 'Ring' },
    { id: 'heart', icon: Heart, label: 'Heart' },
    { id: 'home', icon: Home, label: 'Home' },
] as const;

export function MarkerControls({ layers, palette, onLayersChange }: MarkerControlsProps) {
    const [showColorPicker, setShowColorPicker] = useState(false);

    const effectiveMarkerColor = useMemo(() => {
        return layers.markerColor || palette.primary || palette.accent || palette.text;
    }, [layers.markerColor, palette.primary, palette.accent, palette.text]);

    return (
        <div className="pl-8 pr-2 pb-2">
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 space-y-4">
                {/* Marker Type Selector */}
                <div className="space-y-2">
                    <ControlLabel className="text-[10px] uppercase text-gray-500">Icon Style</ControlLabel>
                    <div className="grid grid-cols-3 gap-2">
                        {markerTypes.map(({ id, icon: Icon, label }) => {
                            const isActive = layers.markerType === id;
                            return (
                                <button
                                    key={id}
                                    onClick={() => onLayersChange({ markerType: id })}
                                    className={cn(
                                        "flex flex-col items-center gap-1.5 py-2.5 px-1 rounded-lg border transition-all",
                                        isActive
                                            ? "bg-white dark:bg-gray-700 border-blue-500 text-blue-600 dark:text-blue-400 shadow-sm ring-1 ring-blue-500/20"
                                            : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                                    )}
                                >
                                    <Icon className="h-4 w-4" />
                                    <span className="text-[10px] uppercase tracking-tight font-medium">{label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Marker Color Control */}
                <div className="space-y-2 relative">
                    <ControlLabel
                        className="text-[10px] uppercase text-gray-500"
                        action={
                            <button
                                onClick={() => onLayersChange({ markerColor: undefined })}
                                className="text-[10px] text-blue-600 hover:underline font-medium"
                            >
                                Reset
                            </button>
                        }
                    >
                        Icon Color
                    </ControlLabel>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setShowColorPicker(!showColorPicker)}
                            className={cn(
                                'w-9 h-9 rounded-md border shadow-sm transition-all',
                                showColorPicker
                                    ? 'border-blue-500 ring-2 ring-blue-500/20'
                                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                            )}
                            style={{ backgroundColor: effectiveMarkerColor }}
                            aria-label="Toggle marker color picker"
                        />
                        <ControlInput
                            type="text"
                            value={effectiveMarkerColor}
                            onChange={(e) => onLayersChange({ markerColor: e.target.value })}
                            className="font-mono"
                            placeholder={palette.primary || palette.accent || palette.text}
                        />
                    </div>

                    {showColorPicker && (
                        <div className="absolute left-0 top-full mt-2 z-50 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl animate-in fade-in zoom-in-95 duration-200">
                            <div
                                className="fixed inset-0 z-[-1]"
                                onClick={() => setShowColorPicker(false)}
                            />
                            <HexColorPicker
                                color={effectiveMarkerColor}
                                onChange={(color) => onLayersChange({ markerColor: color })}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
