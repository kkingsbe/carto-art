'use client';

import { ControlSection, ControlInput, ControlLabel, ControlGroup } from '@/components/ui/control-components';
import type { PosterConfig } from '@/types/poster';

interface ContentSectionProps {
    location: PosterConfig['location'];
    onLocationChange: (location: Partial<PosterConfig['location']>) => void;
}

export function ContentSection({ location, onLocationChange }: ContentSectionProps) {
    return (
        <ControlSection title="Content">
            <ControlGroup>
                <div className="space-y-3">
                    <div>
                        <ControlLabel>Title</ControlLabel>
                        <ControlInput
                            type="text"
                            value={location.name}
                            onChange={(e) => onLocationChange({ name: e.target.value })}
                            placeholder="WHERE WE MET"
                        />
                        <div className="text-[10px] text-gray-400 mt-1">
                            {location.name.length} characters
                        </div>
                    </div>
                    <div>
                        <ControlLabel>Subtitle</ControlLabel>
                        <ControlInput
                            type="text"
                            value={location.city || ''}
                            onChange={(e) => onLocationChange({ city: e.target.value })}
                            placeholder="SUBTITLE"
                        />
                        <div className="text-[10px] text-gray-400 mt-1">
                            {(location.city || '').length} characters
                        </div>
                    </div>
                </div>
            </ControlGroup>
        </ControlSection>
    );
}
