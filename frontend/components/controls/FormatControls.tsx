'use client';

import { PosterConfig } from '@/types/poster';
import { cn } from '@/lib/utils';
import { ControlSection, ControlSlider, ControlLabel, ControlRow } from '@/components/ui/control-components';
import { Layout, Maximize, Crop, Frame } from 'lucide-react';

interface FormatControlsProps {
  format: PosterConfig['format'];
  onFormatChange: (format: Partial<PosterConfig['format']>) => void;
}

const aspectRatioOptions: Array<{
  value: PosterConfig['format']['aspectRatio'];
  label: string;
  description?: string;
}> = [
  { value: '2:3', label: '2:3', description: 'Standard' },
  { value: '3:4', label: '3:4', description: 'Medium' },
  { value: '4:5', label: '4:5', description: 'Compact' },
  { value: '1:1', label: '1:1', description: 'Square' },
  { value: 'ISO', label: 'ISO', description: 'A-series' },
];

export function FormatControls({ format, onFormatChange }: FormatControlsProps) {
  return (
    <div className="space-y-6">
      <ControlSection title="Dimensions">
        <div className="space-y-4">
          <div className="space-y-2">
            <ControlLabel>Aspect Ratio</ControlLabel>
            <div className="grid grid-cols-5 gap-2">
              {aspectRatioOptions.map((option) => {
                const isActive = format.aspectRatio === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => onFormatChange({ aspectRatio: option.value })}
                    className={cn(
                      'flex flex-col items-center justify-center p-2 rounded-lg border transition-all h-16',
                      isActive
                        ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:border-blue-400 dark:text-blue-300'
                        : 'border-gray-200 hover:border-gray-300 text-gray-600 dark:border-gray-700 dark:text-gray-400 dark:hover:border-gray-600'
                    )}
                  >
                    <span className="text-sm font-bold">{option.label}</span>
                    <span className="text-[10px] opacity-75">{option.description}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <ControlLabel>Orientation</ControlLabel>
            <ControlRow>
              <button
                type="button"
                onClick={() => onFormatChange({ orientation: 'portrait' })}
                className={cn(
                  'flex items-center justify-center gap-2 p-3 border rounded-lg transition-all',
                  format.orientation === 'portrait'
                    ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:border-blue-400 dark:text-blue-300'
                    : 'border-gray-200 hover:border-gray-300 text-gray-600 dark:border-gray-700 dark:text-gray-400'
                )}
              >
                <Crop className="w-4 h-4 rotate-90" />
                <span className="text-sm font-medium">Portrait</span>
              </button>
              <button
                type="button"
                onClick={() => onFormatChange({ orientation: 'landscape' })}
                className={cn(
                  'flex items-center justify-center gap-2 p-3 border rounded-lg transition-all',
                  format.orientation === 'landscape'
                    ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:border-blue-400 dark:text-blue-300'
                    : 'border-gray-200 hover:border-gray-300 text-gray-600 dark:border-gray-700 dark:text-gray-400'
                )}
              >
                <Crop className="w-4 h-4" />
                <span className="text-sm font-medium">Landscape</span>
              </button>
            </ControlRow>
          </div>
        </div>
      </ControlSection>

      <ControlSection title="Layout">
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center mb-1">
              <ControlLabel className="mb-0">Margin</ControlLabel>
              <span className="text-xs font-mono text-gray-500">{format.margin}%</span>
            </div>
            <ControlSlider
              min="0"
              max="20"
              step="0.5"
              value={format.margin}
              onChange={(e) => onFormatChange({ margin: parseFloat(e.target.value) })}
            />
          </div>

          <div className="space-y-2">
            <ControlLabel>Border Style</ControlLabel>
            <div className="grid grid-cols-5 gap-2">
              {['none', 'thin', 'thick', 'double', 'inset'].map((style) => (
                <button
                  key={style}
                  type="button"
                  onClick={() => onFormatChange({ borderStyle: style as PosterConfig['format']['borderStyle'] })}
                  className={cn(
                    'p-2 text-xs font-medium capitalize border rounded-lg transition-all',
                    format.borderStyle === style
                      ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:border-blue-400 dark:text-blue-300'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600 dark:border-gray-700 dark:text-gray-400'
                  )}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>
        </div>
      </ControlSection>

      <ControlSection title="Texture">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {['none', 'paper', 'canvas', 'grain'].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => onFormatChange({ texture: t as any })}
                className={cn(
                  "px-4 py-2 text-xs font-medium rounded-full border transition-all",
                  format.texture === t 
                    ? "bg-gray-900 border-gray-900 text-white dark:bg-white dark:border-white dark:text-gray-900" 
                    : "bg-transparent border-gray-200 text-gray-600 hover:border-gray-400 dark:border-gray-700 dark:text-gray-400"
                )}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
          
          {format.texture && format.texture !== 'none' && (
            <div className="space-y-2 pt-2">
              <div className="flex justify-between items-center mb-1">
                <ControlLabel className="mb-0">Texture Intensity</ControlLabel>
                <span className="text-xs font-mono text-gray-500">{format.textureIntensity || 20}%</span>
              </div>
              <ControlSlider
                min="5"
                max="60"
                value={format.textureIntensity || 20}
                onChange={(e) => onFormatChange({ textureIntensity: parseInt(e.target.value) })}
              />
            </div>
          )}
        </div>
      </ControlSection>
    </div>
  );
}
