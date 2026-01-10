import React, { useState } from 'react';
import { Plus, Trash2, MapPin, Share2, Edit2, Check, X } from 'lucide-react';
import { CustomMarker } from '@/types/poster';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { HexColorPicker } from 'react-colorful';
import { MarkerIcon } from '@/components/map/MarkerIcon';

interface MarkersListProps {
    markers?: CustomMarker[];
    onMarkersChange: (markers: CustomMarker[]) => void;
    onCenterAdd: () => void;
    isPlusEnabled?: boolean;
    connectMarkers?: boolean;
    markerPathColor?: string;
    fillMarkers?: boolean;
    markerFillColor?: string;
    showSegmentLengths?: boolean;
    markerPathLabelStyle?: 'standard' | 'elevated' | 'glass' | 'vintage';
    markerPathLabelSize?: number;
    onSettingsChange?: (settings: {
        connectMarkers?: boolean;
        markerPathColor?: string;
        fillMarkers?: boolean;
        markerFillColor?: string;
        showSegmentLengths?: boolean;
        markerPathLabelStyle?: 'standard' | 'elevated' | 'glass' | 'vintage';
        markerPathLabelSize?: number;
    }) => void;
}

export const MarkersList: React.FC<MarkersListProps> = ({
    markers = [],
    onMarkersChange,
    onCenterAdd,
    isPlusEnabled = false,
    connectMarkers = false,
    markerPathColor = '#000000',
    fillMarkers = false,
    markerFillColor = '#000000',
    showSegmentLengths = false,
    markerPathLabelStyle = 'standard',
    markerPathLabelSize = 12,
    onSettingsChange
}) => {
    // Capture props in an object to use in the render function to avoid stale closures in the conditional block
    const markersListProps = { showSegmentLengths, markerPathLabelStyle, markerPathLabelSize };
    const [editingId, setEditingId] = useState<string | null>(null);

    // If not plus enabled, show upgrade prompt (or disable controls)
    if (!isPlusEnabled) {
        return (
            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 text-center">
                <MapPin className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">Custom Markers</h4>
                <p className="text-xs text-gray-500 mt-1 mb-3">Add and customize markers with Carto Plus.</p>
                <Button variant="outline" size="sm" className="w-full" disabled>
                    Upgrade to Plus
                </Button>
            </div>
        );
    }

    const handleDelete = (id: string) => {
        onMarkersChange(markers.filter(m => m.id !== id));
    };

    const handleUpdate = (id: string, updates: Partial<CustomMarker>) => {
        onMarkersChange(markers.map(m => m.id === id ? { ...m, ...updates } : m));
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Custom Markers</Label>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onCenterAdd}
                    className="h-8 text-xs gap-1"
                >
                    <Plus size={14} /> Add at Center
                </Button>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-800">
                <div className="space-y-0.5">
                    <Label className="text-sm font-medium">Connect Points</Label>
                    <p className="text-[10px] text-gray-500">Draw a path between markers</p>
                </div>
                <div className="flex items-center gap-3">
                    {connectMarkers && (
                        <Popover>
                            <PopoverTrigger asChild>
                                <button
                                    className="w-6 h-6 rounded border border-gray-200 dark:border-gray-700 shadow-sm"
                                    style={{ backgroundColor: markerPathColor }}
                                />
                            </PopoverTrigger>
                            <PopoverContent className="w-64 p-3">
                                <Label className="text-xs mb-2 block">Path Color</Label>
                                <HexColorPicker
                                    color={markerPathColor}
                                    onChange={(color) => onSettingsChange?.({ markerPathColor: color })}
                                    style={{ width: '100%', height: '100px' }}
                                />
                            </PopoverContent>
                        </Popover>
                    )}
                    <Switch
                        checked={connectMarkers}
                        onCheckedChange={(checked) => onSettingsChange?.({ connectMarkers: checked })}
                    />
                </div>
            </div>

            {/* Show Distances Toggle */}
            {connectMarkers && (
                <div className="space-y-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-800">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label className="text-sm font-medium">Show Distances</Label>
                            <p className="text-[10px] text-gray-500">Display length of each segment</p>
                        </div>
                        <Switch
                            checked={markersListProps.showSegmentLengths}
                            onCheckedChange={(checked) => onSettingsChange?.({ showSegmentLengths: checked })}
                        />
                    </div>

                    {markersListProps.showSegmentLengths && (
                        <div className="flex items-center gap-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                            <div className="flex-1">
                                <Label className="text-xs mb-1.5 block">Label Style</Label>
                                <Select
                                    value={markersListProps.markerPathLabelStyle}
                                    onValueChange={(val: any) => onSettingsChange?.({ markerPathLabelStyle: val })}
                                >
                                    <SelectTrigger className="h-7 text-xs">
                                        <SelectValue placeholder="Style" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="standard">Standard</SelectItem>
                                        <SelectItem value="elevated">Elevated</SelectItem>
                                        <SelectItem value="glass">Glass</SelectItem>
                                        <SelectItem value="vintage">Vintage</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="w-20">
                                <Label className="text-xs mb-1.5 block">Size ({markersListProps.markerPathLabelSize}px)</Label>
                                <Input
                                    type="number"
                                    min={8}
                                    max={32}
                                    value={markersListProps.markerPathLabelSize}
                                    onChange={(e) => onSettingsChange?.({ markerPathLabelSize: parseInt(e.target.value) || 12 })}
                                    className="h-7 text-xs"
                                />
                            </div>
                        </div>
                    )}
                </div>
            )}

            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-800">
                <div className="space-y-0.5">
                    <Label className="text-sm font-medium">Fill Area</Label>
                    <p className="text-[10px] text-gray-500">Shade the area between markers</p>
                </div>
                <div className="flex items-center gap-3">
                    {fillMarkers && (
                        <Popover>
                            <PopoverTrigger asChild>
                                <button
                                    className="w-6 h-6 rounded border border-gray-200 dark:border-gray-700 shadow-sm opacity-50"
                                    style={{ backgroundColor: markerFillColor }}
                                />
                            </PopoverTrigger>
                            <PopoverContent className="w-64 p-3">
                                <Label className="text-xs mb-2 block">Fill Color</Label>
                                <HexColorPicker
                                    color={markerFillColor}
                                    onChange={(color) => onSettingsChange?.({ markerFillColor: color })}
                                    style={{ width: '100%', height: '100px' }}
                                />
                            </PopoverContent>
                        </Popover>
                    )}
                    <Switch
                        checked={fillMarkers}
                        onCheckedChange={(checked) => onSettingsChange?.({ fillMarkers: checked })}
                    />
                </div>
            </div>

            {markers.length === 0 ? (
                <div className="text-center py-6 border border-dashed rounded-lg border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-gray-500">
                        Right-click map or use button above<br />to add markers
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {markers.map(marker => (
                        <div
                            key={marker.id}
                            className="bg-white dark:bg-gray-800 border p-3 rounded-lg shadow-sm space-y-3"
                        >
                            <div className="flex items-center gap-3">
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <button className="w-8 h-8 flex items-center justify-center rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                                            <MarkerIcon type={marker.type} color={marker.color} size={20} shadow={false} />
                                        </button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-64 p-3">
                                        <div className="space-y-3">
                                            <div>
                                                <Label className="text-xs mb-1.5 block">Icon Style</Label>
                                                <Select
                                                    value={marker.type}
                                                    onValueChange={(val: any) => handleUpdate(marker.id, { type: val })}
                                                >
                                                    <SelectTrigger className="h-8">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="pin">Pin</SelectItem>
                                                        <SelectItem value="dot">Dot</SelectItem>
                                                        <SelectItem value="crosshair">Crosshair</SelectItem>
                                                        <SelectItem value="ring">Ring</SelectItem>
                                                        <SelectItem value="heart">Heart</SelectItem>
                                                        <SelectItem value="home">Home</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div>
                                                <Label className="text-xs mb-1.5 block">Color</Label>
                                                <HexColorPicker
                                                    color={marker.color}
                                                    onChange={(c) => handleUpdate(marker.id, { color: c })}
                                                    style={{ width: '100%', height: '100px' }}
                                                />
                                            </div>
                                        </div>
                                    </PopoverContent>
                                </Popover>

                                <div className="flex-1 min-w-0">
                                    <Input
                                        value={marker.label || ''}
                                        onChange={(e) => handleUpdate(marker.id, { label: e.target.value })}
                                        placeholder="Optional label..."
                                        className="h-8 text-xs"
                                    />
                                </div>

                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-gray-400 hover:text-red-500"
                                    onClick={() => handleDelete(marker.id)}
                                >
                                    <Trash2 size={14} />
                                </Button>
                            </div>

                            <div className="flex items-center gap-2">
                                <Select
                                    value={marker.labelStyle || 'standard'}
                                    onValueChange={(val: any) => handleUpdate(marker.id, { labelStyle: val })}
                                >
                                    <SelectTrigger className="h-7 text-[10px] w-auto">
                                        <SelectValue placeholder="Label Style" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="standard">Standard</SelectItem>
                                        <SelectItem value="elevated">Elevated</SelectItem>
                                        <SelectItem value="glass">Glass</SelectItem>
                                        <SelectItem value="vintage">Vintage</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
