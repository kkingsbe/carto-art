'use client';

import { ControlSlider, ControlLabel, ControlCheckbox } from '@/components/ui/control-components';
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { cn } from '@/lib/utils';
import type { PosterConfig } from '@/types/poster';

interface MapLabelsSectionProps {
    layers: PosterConfig['layers'];
    onLayersChange: (layers: Partial<PosterConfig['layers']>) => void;
}

export function MapLabelsSection({ layers, onLayersChange }: MapLabelsSectionProps) {
    return (
        <AccordionItem value="map-labels" className="border border-gray-200 dark:border-gray-700 rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Map Labels</span>
            </AccordionTrigger>
            <AccordionContent>
                <div className="space-y-4 pt-2">
                    {/* General Labels Toggle */}
                    <div className="space-y-2">
                        <ControlCheckbox
                            label="Place Labels"
                            checked={Boolean(layers.labels)}
                            onChange={(e) => onLayersChange({ labels: e.target.checked })}
                        />

                        {layers.labels && (
                            <div className="pl-8 pr-2 pb-2">
                                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 space-y-4">
                                    <div className="space-y-2">
                                        <ControlLabel className="text-[10px] uppercase text-gray-500">Label Style</ControlLabel>
                                        <div className="grid grid-cols-2 gap-2">
                                            {['standard', 'elevated', 'glass', 'vintage'].map((labelStyle) => (
                                                <button
                                                    key={labelStyle}
                                                    onClick={() => onLayersChange({ labelStyle: labelStyle as any })}
                                                    className={cn(
                                                        "py-1.5 px-2 text-[10px] uppercase font-bold rounded border transition-all",
                                                        (layers.labelStyle || 'elevated') === labelStyle
                                                            ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                                                            : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 hover:border-gray-300 dark:hover:border-gray-600"
                                                    )}
                                                >
                                                    {labelStyle}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <ControlLabel className="text-[10px] uppercase text-gray-500">Label Size</ControlLabel>
                                        <ControlSlider
                                            min="0.5"
                                            max="2.5"
                                            step="0.1"
                                            value={layers.labelSize ?? 1.0}
                                            onChange={(e) => onLayersChange({ labelSize: parseFloat(e.target.value) })}
                                            displayValue={`${(layers.labelSize ?? 1.0).toFixed(1)}x`}
                                            onValueChange={(value) => onLayersChange({ labelSize: value })}
                                            formatValue={(v) => v.toFixed(1)}
                                            parseValue={(s) => parseFloat(s.replace('x', ''))}
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <ControlLabel className="text-[10px] uppercase text-gray-500">Label Wrap</ControlLabel>
                                        <ControlSlider
                                            min="2"
                                            max="20"
                                            step="1"
                                            value={layers.labelMaxWidth ?? 10}
                                            onChange={(e) => onLayersChange({ labelMaxWidth: parseFloat(e.target.value) })}
                                            displayValue={layers.labelMaxWidth ?? 10}
                                            onValueChange={(value) => onLayersChange({ labelMaxWidth: value })}
                                            formatValue={(v) => String(Math.round(v))}
                                            parseValue={(s) => parseInt(s)}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* State & Country Names */}
                    <div className="space-y-2">
                        <ControlCheckbox
                            label="State & Country Names"
                            checked={Boolean(layers['labels-admin'])}
                            onChange={(e) => onLayersChange({ 'labels-admin': e.target.checked })}
                        />

                        {layers['labels-admin'] && (
                            <div className="pl-8 pr-2 pb-2">
                                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 space-y-3">
                                    <div className="space-y-1">
                                        <ControlLabel className="text-[10px] uppercase text-gray-500">Label Size</ControlLabel>
                                        <ControlSlider
                                            min="0.5"
                                            max="2.5"
                                            step="0.1"
                                            value={layers.labelAdminSize ?? 1.0}
                                            onChange={(e) => onLayersChange({ labelAdminSize: parseFloat(e.target.value) })}
                                            displayValue={`${(layers.labelAdminSize ?? 1.0).toFixed(1)}x`}
                                            onValueChange={(value) => onLayersChange({ labelAdminSize: value })}
                                            formatValue={(v) => v.toFixed(1)}
                                            parseValue={(s) => parseFloat(s.replace('x', ''))}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* City Names */}
                    <div className="space-y-2">
                        <ControlCheckbox
                            label="City Names"
                            checked={Boolean(layers['labels-cities'])}
                            onChange={(e) => onLayersChange({ 'labels-cities': e.target.checked })}
                        />

                        {layers['labels-cities'] && (
                            <div className="pl-8 pr-2 pb-2">
                                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 space-y-3">
                                    <div className="space-y-1">
                                        <ControlLabel className="text-[10px] uppercase text-gray-500">Label Size</ControlLabel>
                                        <ControlSlider
                                            min="0.5"
                                            max="2.5"
                                            step="0.1"
                                            value={layers.labelCitiesSize ?? 1.0}
                                            onChange={(e) => onLayersChange({ labelCitiesSize: parseFloat(e.target.value) })}
                                            displayValue={`${(layers.labelCitiesSize ?? 1.0).toFixed(1)}x`}
                                            onValueChange={(value) => onLayersChange({ labelCitiesSize: value })}
                                            formatValue={(v) => v.toFixed(1)}
                                            parseValue={(s) => parseFloat(s.replace('x', ''))}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </AccordionContent>
        </AccordionItem>
    );
}
