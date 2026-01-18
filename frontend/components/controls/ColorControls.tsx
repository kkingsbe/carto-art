'use client';

import { HexColorPicker } from 'react-colorful';
import { useState } from 'react';
import type { ColorPalette } from '@/types/poster';
import { cn } from '@/lib/utils';
import { ControlLabel, ControlInput } from '@/components/ui/control-components';
import { Check, ChevronDown, Palette, Paintbrush } from 'lucide-react';
import { trackEventAction } from '@/lib/actions/events';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface ColorControlsProps {
  palette: ColorPalette;
  presets?: ColorPalette[];
  onPaletteChange: (palette: ColorPalette) => void;
}

const colorLabels: Record<string, string> = {
  background: 'Background',
  primary: 'Primary',
  secondary: 'Secondary',
  water: 'Water',
  greenSpace: 'Parks',
  text: 'Text',
  grid: 'Grid',
};

// Extract main colors for the preset preview
function getPresetColors(preset: ColorPalette): string[] {
  const colors: string[] = [];

  // Always show background
  if (preset.background) colors.push(preset.background);

  // Show primary road color or text
  if ('roads' in preset && typeof preset.roads === 'object') {
    const roads = preset.roads as any;
    if (roads.primary) colors.push(roads.primary);
  } else if (preset.primary) {
    colors.push(preset.primary);
  } else if (preset.text) {
    colors.push(preset.text);
  }

  // Show water if available
  if (preset.water) colors.push(preset.water);

  // Show green space if available
  if (preset.greenSpace) colors.push(preset.greenSpace);

  // Limit to 4 colors
  return colors.slice(0, 4);
}

export function ColorControls({ palette, presets, onPaletteChange }: ColorControlsProps) {
  const [activeColor, setActiveColor] = useState<string | null>(null);

  const handleColorChange = (colorKey: string, color: string) => {
    onPaletteChange({
      ...palette,
      [colorKey]: color,
    });
  };

  const visibleColorKeys = Object.keys(colorLabels).filter(key =>
    key in palette || (key === 'grid' && presets?.some(p => 'grid' in p))
  );

  return (
    <div className="space-y-4">
      {/* Presets Grid */}
      {presets && presets.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <Palette className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Color Presets
            </h4>
            <span className="text-xs text-gray-400 dark:text-gray-500">
              ({presets.length})
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {presets.map((preset) => {
              const isActive = palette.id === preset.id;
              const presetColors = getPresetColors(preset);

              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    onPaletteChange(preset);
                    trackEventAction('palette_change', {
                      eventName: preset.name,
                      metadata: { paletteId: preset.id }
                    });
                  }}
                  className={cn(
                    'group relative flex flex-col gap-2 p-2.5 text-left border rounded-lg transition-all hover:scale-[1.02]',
                    isActive
                      ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 shadow-md ring-2 ring-blue-500/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm'
                  )}
                >
                  {/* Color Swatches */}
                  <div className="flex gap-1 w-full">
                    {presetColors.map((color, idx) => (
                      <div
                        key={idx}
                        className="flex-1 h-8 rounded border border-white/20 dark:border-black/20 shadow-sm"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>

                  {/* Name */}
                  <div className="flex items-center justify-between gap-1 min-w-0">
                    <span className={cn(
                      "text-[10px] font-medium truncate leading-tight",
                      isActive
                        ? "text-blue-700 dark:text-blue-300"
                        : "text-gray-600 dark:text-gray-400"
                    )}>
                      {preset.name}
                    </span>
                    {isActive && (
                      <Check className="w-3 h-3 text-blue-500 flex-shrink-0" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Customize Colors - Collapsible */}
      <Accordion type="single" collapsible className="border-t border-gray-200 dark:border-gray-700 pt-2">
        <AccordionItem value="custom-colors" className="border-none">
          <AccordionTrigger className="px-1 py-2 hover:no-underline text-sm font-semibold text-gray-700 dark:text-gray-300">
            <div className="flex items-center gap-2">
              <Paintbrush className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              Customize Colors
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-3 pb-1">
            <div className="space-y-2.5">
              {visibleColorKeys.map((colorKey) => (
                <div key={colorKey} className="relative">
                  <ControlLabel className="text-xs mb-1.5">{colorLabels[colorKey]}</ControlLabel>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveColor(activeColor === colorKey ? null : colorKey)}
                      className={cn(
                        'w-10 h-10 rounded-md border shadow-sm transition-all flex-shrink-0',
                        activeColor === colorKey
                          ? 'border-blue-500 ring-2 ring-blue-500/20 scale-105'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 hover:scale-105'
                      )}
                      style={{ backgroundColor: (palette as any)[colorKey] }}
                      aria-label={`Select ${colorLabels[colorKey]} color`}
                    />
                    <ControlInput
                      type="text"
                      value={(palette as any)[colorKey] || ''}
                      onChange={(e) => handleColorChange(colorKey, e.target.value)}
                      className="font-mono text-xs h-10"
                      placeholder="#000000"
                    />
                  </div>

                  {activeColor === colorKey && (
                    <div className="absolute left-0 top-full mt-2 z-50 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl animate-in fade-in zoom-in-95 duration-200">
                      <div
                        className="fixed inset-0 z-[-1]"
                        onClick={() => setActiveColor(null)}
                      />
                      <HexColorPicker
                        color={(palette as any)[colorKey] || '#000000'}
                        onChange={(color) => handleColorChange(colorKey, color)}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

