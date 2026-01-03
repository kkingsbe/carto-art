'use client';

import { PosterConfig } from '@/types/poster';
import { DimensionSection } from './format/DimensionSection';
import { LayoutSection } from './format/LayoutSection';
import { TextureSection } from './format/TextureSection';

interface FormatControlsProps {
  format: PosterConfig['format'];
  onFormatChange: (format: Partial<PosterConfig['format']>) => void;
}

export function FormatControls({ format, onFormatChange }: FormatControlsProps) {
  return (
    <div className="space-y-6">
      <DimensionSection format={format} onFormatChange={onFormatChange} />
      <LayoutSection format={format} onFormatChange={onFormatChange} />
      <TextureSection format={format} onFormatChange={onFormatChange} />
    </div>
  );
}
