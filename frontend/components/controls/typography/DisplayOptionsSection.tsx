'use client';

import { ControlCheckbox } from '@/components/ui/control-components';
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
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
                <div className="space-y-2 pt-2">
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
            </AccordionContent>
        </AccordionItem>
    );
}
