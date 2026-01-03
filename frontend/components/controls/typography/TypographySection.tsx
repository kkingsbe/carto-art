'use client';

import { ControlSlider, ControlSelect, ControlLabel } from '@/components/ui/control-components';
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Info } from 'lucide-react';
import { Tooltip } from '@/components/ui/tooltip-simple';
import type { PosterConfig } from '@/types/poster';

interface TypographySectionProps {
    typography: PosterConfig['typography'];
    style: PosterConfig['style'];
    onTypographyChange: (typography: Partial<PosterConfig['typography']>) => void;
}

export function TypographySection({ typography, style, onTypographyChange }: TypographySectionProps) {
    // Use recommended fonts from the style or a general list
    const availableFonts = [
        ...new Set([
            ...style.recommendedFonts,
            'Inter', 'Montserrat', 'Poppins', 'Playfair Display', 'Crimson Text', 'JetBrains Mono'
        ])
    ];

    return (
        <AccordionItem value="typography" className="border border-gray-200 dark:border-gray-700 rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Typography</span>
            </AccordionTrigger>
            <AccordionContent>
                <div className="space-y-6 pt-2">
                    {/* Title Typography */}
                    <div className="space-y-4">
                        <div className="text-[11px] uppercase font-bold text-gray-500 dark:text-gray-400 tracking-wide">
                            Title
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <ControlLabel>Font Family</ControlLabel>
                                {typography.titleFont !== typography.subtitleFont && (
                                    <button
                                        onClick={() => onTypographyChange({ subtitleFont: typography.titleFont })}
                                        className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline"
                                    >
                                        Apply to subtitle
                                    </button>
                                )}
                            </div>
                            <ControlSelect
                                value={typography.titleFont}
                                onChange={(e) => onTypographyChange({ titleFont: e.target.value })}
                            >
                                {availableFonts.map((font) => (
                                    <option key={font} value={font}>{font}</option>
                                ))}
                            </ControlSelect>
                        </div>

                        <div>
                            <Tooltip content="Container-relative units (cqw). Scales with poster size.">
                                <ControlLabel>
                                    Title Size <Info className="inline w-3 h-3 ml-1 text-gray-400" />
                                </ControlLabel>
                            </Tooltip>
                            <ControlSlider
                                min="0.5"
                                max="40"
                                step="0.1"
                                value={typography.titleSize}
                                onChange={(e) => onTypographyChange({ titleSize: parseFloat(e.target.value) })}
                                displayValue={`${typography.titleSize.toFixed(1)}cqw`}
                                onValueChange={(value) => onTypographyChange({ titleSize: value })}
                                formatValue={(v) => v.toFixed(1)}
                                parseValue={(s) => parseFloat(s.replace('cqw', ''))}
                            />
                        </div>

                        <div>
                            <ControlLabel>Title Weight</ControlLabel>
                            <ControlSlider
                                min="100"
                                max="900"
                                step="100"
                                value={typography.titleWeight}
                                onChange={(e) => onTypographyChange({ titleWeight: parseInt(e.target.value) })}
                            />
                        </div>

                        <div>
                            <Tooltip content="Adjust spacing between characters. Negative values tighten.">
                                <ControlLabel>
                                    Letter Spacing <Info className="inline w-3 h-3 ml-1 text-gray-400" />
                                </ControlLabel>
                            </Tooltip>
                            <ControlSlider
                                min="-0.1"
                                max="0.5"
                                step="0.01"
                                value={typography.titleLetterSpacing || 0}
                                onChange={(e) => onTypographyChange({ titleLetterSpacing: parseFloat(e.target.value) })}
                                displayValue={`${(typography.titleLetterSpacing || 0).toFixed(2)}em`}
                            />
                        </div>
                    </div>

                    {/* Subtitle Typography */}
                    <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="text-[11px] uppercase font-bold text-gray-500 dark:text-gray-400 tracking-wide">
                            Subtitle
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <ControlLabel>Font Family</ControlLabel>
                                {typography.titleFont !== typography.subtitleFont && (
                                    <button
                                        onClick={() => onTypographyChange({ titleFont: typography.subtitleFont })}
                                        className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline"
                                    >
                                        Apply to title
                                    </button>
                                )}
                            </div>
                            <ControlSelect
                                value={typography.subtitleFont}
                                onChange={(e) => onTypographyChange({ subtitleFont: e.target.value })}
                            >
                                {availableFonts.map((font) => (
                                    <option key={font} value={font}>{font}</option>
                                ))}
                            </ControlSelect>
                        </div>

                        <div>
                            <ControlLabel>Subtitle Size</ControlLabel>
                            <ControlSlider
                                min="0.2"
                                max="20"
                                step="0.1"
                                value={typography.subtitleSize}
                                onChange={(e) => onTypographyChange({ subtitleSize: parseFloat(e.target.value) })}
                                displayValue={`${typography.subtitleSize.toFixed(1)}cqw`}
                                onValueChange={(value) => onTypographyChange({ subtitleSize: value })}
                                formatValue={(v) => v.toFixed(1)}
                                parseValue={(s) => parseFloat(s.replace('cqw', ''))}
                            />
                        </div>

                        <div>
                            <ControlLabel>Subtitle Weight</ControlLabel>
                            <ControlSlider
                                min="100"
                                max="900"
                                step="100"
                                value={typography.subtitleWeight || 400}
                                onChange={(e) => onTypographyChange({ subtitleWeight: parseInt(e.target.value) })}
                            />
                        </div>

                        <div>
                            <ControlLabel>Letter Spacing</ControlLabel>
                            <ControlSlider
                                min="-0.1"
                                max="0.5"
                                step="0.01"
                                value={typography.subtitleLetterSpacing || 0}
                                onChange={(e) => onTypographyChange({ subtitleLetterSpacing: parseFloat(e.target.value) })}
                                displayValue={`${(typography.subtitleLetterSpacing || 0).toFixed(2)}em`}
                            />
                        </div>
                    </div>
                </div>
            </AccordionContent>
        </AccordionItem>
    );
}
