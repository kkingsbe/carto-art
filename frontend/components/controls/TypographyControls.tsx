'use client';

import type { PosterConfig } from '@/types/poster';
import { Accordion } from '@/components/ui/accordion';
import { TextPresets } from './typography/TextPresets';
import { ContentSection } from './typography/ContentSection';
import { TypographySection } from './typography/TypographySection';
import { BackdropSection } from './typography/BackdropSection';
import { DisplayOptionsSection } from './typography/DisplayOptionsSection';
import { MapLabelsSection } from './typography/MapLabelsSection';

interface TypographyControlsProps {
  config: PosterConfig;
  onTypographyChange: (typography: Partial<PosterConfig['typography']>) => void;
  onLocationChange: (location: Partial<PosterConfig['location']>) => void;
  onLayersChange: (layers: Partial<PosterConfig['layers']>) => void;
}

export function TypographyControls({ config, onTypographyChange, onLocationChange, onLayersChange }: TypographyControlsProps) {
  const { typography, style, layers, location } = config;

  return (
    <div className="space-y-6">
      {/* 1. TEXT PRESETS - Always visible */}
      <TextPresets
        typography={typography}
        onTypographyChange={onTypographyChange}
      />

      {/* 2. CONTENT - Always visible */}
      <ContentSection
        location={location}
        onLocationChange={onLocationChange}
      />

      {/* 3-6. COLLAPSIBLE SECTIONS */}
      <Accordion type="multiple" defaultValue={["typography", "backdrop"]} className="space-y-2">
        {/* 3. TYPOGRAPHY */}
        <TypographySection
          typography={typography}
          style={style}
          onTypographyChange={onTypographyChange}
        />

        {/* 4. BACKDROP & READABILITY */}
        <BackdropSection
          typography={typography}
          onTypographyChange={onTypographyChange}
        />

        {/* 5. DISPLAY OPTIONS */}
        <DisplayOptionsSection
          typography={typography}
          onTypographyChange={onTypographyChange}
        />

        {/* 6. MAP LABELS */}
        <MapLabelsSection
          layers={layers}
          onLayersChange={onLayersChange}
        />
      </Accordion>
    </div>
  );
}
