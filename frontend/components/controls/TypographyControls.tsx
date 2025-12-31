'use client';

import type { PosterConfig } from '@/types/poster';
import { cn } from '@/lib/utils';

interface TypographyControlsProps {
  config: PosterConfig;
  onTypographyChange: (typography: Partial<PosterConfig['typography']>) => void;
  onLocationChange: (location: Partial<PosterConfig['location']>) => void;
}

export function TypographyControls({ config, onTypographyChange, onLocationChange }: TypographyControlsProps) {
  const { typography, style } = config;

  // Use recommended fonts from the style or a general list
  const availableFonts = [
    ...new Set([
      ...style.recommendedFonts,
      'Inter', 'Montserrat', 'Poppins', 'Playfair Display', 'Crimson Text', 'JetBrains Mono'
    ])
  ];

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {/* Text Content */}
        <div className="space-y-2">
          <div className="space-y-1">
            <label className="text-xs text-gray-600 dark:text-gray-400">Title</label>
            <input
              type="text"
              value={config.location.name}
              onChange={(e) => onLocationChange({ name: e.target.value })}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="WHERE WE MET"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-gray-600 dark:text-gray-400">Subtitle</label>
            <input
              type="text"
              value={config.location.city || ''}
              onChange={(e) => onLocationChange({ city: e.target.value })}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="SUBTITLE"
            />
          </div>
        </div>

        {/* Font Family */}
        <div className="space-y-1">
          <label className="text-xs text-gray-600 dark:text-gray-400">Font Family</label>
          <select
            value={typography.titleFont}
            onChange={(e) => onTypographyChange({ 
              titleFont: e.target.value,
              subtitleFont: e.target.value
            })}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {availableFonts.map((font) => (
              <option key={font} value={font}>{font}</option>
            ))}
          </select>
        </div>

        {/* Font Size, Weight & Spacing */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
          <div className="space-y-1">
            <label className="text-xs text-gray-600 dark:text-gray-400">Title Size</label>
            <input
              type="range"
              min="0.5"
              max="40"
              step="0.1"
              value={typography.titleSize}
              onChange={(e) => onTypographyChange({ titleSize: parseFloat(e.target.value) })}
              className="w-full"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-gray-600 dark:text-gray-400">Title Weight</label>
            <input
              type="range"
              min="100"
              max="900"
              step="100"
              value={typography.titleWeight}
              onChange={(e) => onTypographyChange({ titleWeight: parseInt(e.target.value) })}
              className="w-full"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-gray-600 dark:text-gray-400">Letter Spacing</label>
            <input
              type="range"
              min="-0.1"
              max="0.5"
              step="0.01"
              value={typography.titleLetterSpacing || 0}
              onChange={(e) => onTypographyChange({ titleLetterSpacing: parseFloat(e.target.value) })}
              className="w-full"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-gray-600 dark:text-gray-400">Subtitle Size</label>
            <input
              type="range"
              min="0.2"
              max="20"
              step="0.1"
              value={typography.subtitleSize}
              onChange={(e) => onTypographyChange({ subtitleSize: parseFloat(e.target.value) })}
              className="w-full"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-gray-600 dark:text-gray-400">Legibility Backdrop</label>
            <select
              value={typography.textBackdrop || 'subtle'}
              onChange={(e) => onTypographyChange({ textBackdrop: e.target.value as any })}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="none">None</option>
              <option value="subtle">Subtle</option>
              <option value="strong">Strong</option>
              <option value="gradient">Full Gradient</option>
            </select>
          </div>
        </div>

        {/* Backdrop Configuration */}
        {typography.textBackdrop !== 'none' && (
          <div className="grid grid-cols-2 gap-x-4 gap-y-3 pt-2 border-t border-gray-100 dark:border-gray-800">
            <div className="space-y-1">
              <label className="text-xs text-gray-600 dark:text-gray-400">Backdrop Height (%)</label>
              <input
                type="range"
                min="10"
                max="100"
                step="1"
                value={typography.backdropHeight ?? 35}
                onChange={(e) => onTypographyChange({ backdropHeight: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-600 dark:text-gray-400">Backdrop Opacity</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={typography.backdropAlpha ?? 1.0}
                onChange={(e) => onTypographyChange({ backdropAlpha: parseFloat(e.target.value) })}
                className="w-full"
              />
            </div>
          </div>
        )}

        {/* Toggles */}
        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={typography.showTitle !== false}
              onChange={(e) => onTypographyChange({ showTitle: e.target.checked })}
              className="rounded text-blue-500"
            />
            <span className="text-xs text-gray-600 dark:text-gray-400">Show Title</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={typography.showSubtitle !== false}
              onChange={(e) => onTypographyChange({ showSubtitle: e.target.checked })}
              className="rounded text-blue-500"
            />
            <span className="text-xs text-gray-600 dark:text-gray-400">Show Subtitle</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={typography.titleAllCaps}
              onChange={(e) => onTypographyChange({ titleAllCaps: e.target.checked })}
              className="rounded text-blue-500"
            />
            <span className="text-xs text-gray-600 dark:text-gray-400">ALL CAPS</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={typography.showCoordinates !== false}
              onChange={(e) => onTypographyChange({ showCoordinates: e.target.checked })}
              className="rounded text-blue-500"
            />
            <span className="text-xs text-gray-600 dark:text-gray-400">Coordinates</span>
          </label>
        </div>
      </div>
    </div>
  );
}

