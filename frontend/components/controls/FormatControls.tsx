'use client';

import { PosterConfig } from '@/types/poster';
import { cn } from '@/lib/utils';
import { ControlSection, ControlSlider, ControlLabel, ControlRow } from '@/components/ui/control-components';
import { Tooltip } from '@/components/ui/tooltip';
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
  const isSquareAspectRatio = format.aspectRatio === '1:1';

  const handleAspectRatioChange = (newAspectRatio: PosterConfig['format']['aspectRatio']) => {
    // Auto-reset maskShape to rectangular if changing away from square while circular is active
    if (format.maskShape === 'circular' && newAspectRatio !== '1:1') {
      onFormatChange({ aspectRatio: newAspectRatio, maskShape: 'rectangular' });
    } else {
      onFormatChange({ aspectRatio: newAspectRatio });
    }
  };

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
                    onClick={() => handleAspectRatioChange(option.value)}
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
            <ControlLabel>Mask Shape</ControlLabel>
            <ControlRow>
              <button
                type="button"
                onClick={() => onFormatChange({ maskShape: 'rectangular' })}
                className={cn(
                  'flex items-center justify-center gap-2 p-3 border rounded-lg transition-all',
                  (format.maskShape || 'rectangular') === 'rectangular'
                    ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:border-blue-400 dark:text-blue-300'
                    : 'border-gray-200 hover:border-gray-300 text-gray-600 dark:border-gray-700 dark:text-gray-400'
                )}
              >
                <Frame className="w-4 h-4" />
                <span className="text-sm font-medium">Rectangular</span>
              </button>
              <Tooltip
                content="Circular mask is only available for square (1:1) aspect ratio"
                disabled={isSquareAspectRatio}
              >
                <button
                  type="button"
                  disabled={!isSquareAspectRatio}
                  onClick={() => onFormatChange({ maskShape: 'circular' })}
                  className={cn(
                    'flex items-center justify-center gap-2 p-3 border rounded-lg transition-all',
                    format.maskShape === 'circular'
                      ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:border-blue-400 dark:text-blue-300'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600 dark:border-gray-700 dark:text-gray-400',
                    !isSquareAspectRatio && 'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-200 dark:disabled:hover:border-gray-700'
                  )}
                >
                  <div className="w-4 h-4 rounded-full border-2 border-current" />
                  <span className="text-sm font-medium">Circular</span>
                </button>
              </Tooltip>
            </ControlRow>
            
            {/* Compass Rose Toggle - Only show when circular mask is selected */}
            {format.maskShape === 'circular' && (
              <ControlRow>
                <ControlLabel>Compass Rose</ControlLabel>
                <button
                  type="button"
                  onClick={() => onFormatChange({ compassRose: !format.compassRose })}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 border rounded-lg transition-all text-sm font-medium',
                    format.compassRose
                      ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:border-blue-400 dark:text-blue-300'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600 dark:border-gray-700 dark:text-gray-400'
                  )}
                >
                  <span>{format.compassRose ? '✓' : ''}</span>
                  <span>Show Compass Rose</span>
                </button>
              </ControlRow>
            )}
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
