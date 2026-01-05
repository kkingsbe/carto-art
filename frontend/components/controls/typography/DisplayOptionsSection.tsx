'use client';

import { ControlCheckbox, ControlSelect, ControlSlider, ControlLabel } from '@/components/ui/control-components';
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Info } from 'lucide-react';
import { Tooltip } from '@/components/ui/tooltip-simple';
import type { PosterConfig } from '@/types/poster';

interface DisplayOptionsSectionProps {
    typography: PosterConfig['typography'];
    onTypographyChange: (typography: Partial<PosterConfig['typography']>) => void;
}

export function DisplayOptionsSection({ typography, onTypographyChange }: DisplayOptionsSectionProps) {
    return (
        <AccordionItem value="display" className="border border-gray-200 dark:border-gray-700 rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Display Options</span>
            </AccordionTrigger>
            <AccordionContent>
                <div className="space-y-4 pt-2">
                    <div className="space-y-4 border-b border-gray-100 dark:border-gray-800 pb-4">
                        <div>
                            <ControlLabel>Position</ControlLabel>
                            <ControlSelect
                                value={typography.position}
                                onChange={(e) => onTypographyChange({ position: e.target.value as any })}
                            >
                                <option value="top">Top</option>
                                <option value="center">Center</option>
                                <option value="bottom">Bottom</option>
                            </ControlSelect>
                        </div>
                        <div>
                            <Tooltip content="Adjust vertical position relative to the placement area.">
                                <ControlLabel>
                                    Vertical Offset <Info className="inline w-3 h-3 ml-1 text-gray-400" />
                                </ControlLabel>
                            </Tooltip>
                            <ControlSlider
                                min="-20"
                                max="20"
                                step="1"
                                value={typography.offsetY ?? 0}
                                onChange={(e) => onTypographyChange({ offsetY: parseInt(e.target.value) })}
                                displayValue={`${typography.offsetY ?? 0}%`}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <ControlCheckbox
                            label="Show Title"
                            checked={typography.showTitle !== false}
                            onChange={(e) => onTypographyChange({ showTitle: e.target.checked })}
                        />
                        <ControlCheckbox
                            label="Show Subtitle"
                            checked={typography.showSubtitle !== false}
                            onChange={(e) => onTypographyChange({ showSubtitle: e.target.checked })}
                        />
                        <ControlCheckbox
                            label="ALL CAPS"
                            description="Convert title to uppercase regardless of input"
                            checked={Boolean(typography.titleAllCaps)}
                            onChange={(e) => onTypographyChange({ titleAllCaps: e.target.checked })}
                        />
                        <ControlCheckbox
                            label="Show Coordinates"
                            description="Display latitude/longitude below title"
                            checked={typography.showCoordinates !== false}
                            onChange={(e) => onTypographyChange({ showCoordinates: e.target.checked })}
                        />
                    </div>
                </div>
            </AccordionContent>
        </AccordionItem>
    );
}
