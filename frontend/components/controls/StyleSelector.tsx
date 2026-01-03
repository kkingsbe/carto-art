import { useState } from 'react';
import type { PosterStyle, PosterConfig } from '@/types/poster';
import { styles } from '@/lib/styles';
import { cn } from '@/lib/utils';
import { Check, Sparkles } from 'lucide-react';
import { trackEventAction } from '@/lib/actions/events';

interface StyleSelectorProps {
  selectedStyleId: string;
  onStyleSelect: (style: PosterStyle) => void;
  currentConfig: PosterConfig;
}

// Extract representative colors from a style's default palette
function getStyleColors(style: PosterStyle): string[] {
  const palette = style.defaultPalette;
  const colors: string[] = [];

  // Always show background
  if (palette.background) colors.push(palette.background);

  // Show primary road/line color
  if ('roads' in palette && typeof palette.roads === 'object') {
    const roads = palette.roads as any;
    if (roads.primary) colors.push(roads.primary);
  } else if (palette.primary) {
    colors.push(palette.primary);
  } else if (palette.text) {
    colors.push(palette.text);
  }

  // Show water
  if (palette.water) colors.push(palette.water);

  // Show green space
  if (palette.greenSpace) colors.push(palette.greenSpace);

  return colors.slice(0, 4);
}

export function StyleSelector({ selectedStyleId, onStyleSelect, currentConfig }: StyleSelectorProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 px-1">
        <Sparkles className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Map Themes
        </h4>
        <span className="text-xs text-gray-400 dark:text-gray-500">
          ({styles.length})
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {styles.map((style) => {
          const isSelected = selectedStyleId === style.id;
          const styleColors = getStyleColors(style);

          return (
            <button
              key={style.id}
              type="button"
              onClick={() => {
                onStyleSelect(style);
                trackEventAction({
                  eventType: 'style_change',
                  eventName: style.name,
                  metadata: { styleId: style.id }
                });
              }}
              className={cn(
                'group relative flex flex-col gap-2.5 p-3 text-left border rounded-lg transition-all hover:scale-[1.02]',
                isSelected
                  ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 shadow-md ring-2 ring-blue-500/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm'
              )}
            >
              {/* Color Swatches */}
              <div className="flex gap-1 w-full">
                {styleColors.map((color, idx) => (
                  <div
                    key={idx}
                    className="flex-1 h-10 rounded border border-white/20 dark:border-black/20 shadow-sm"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>

              {/* Name & Description */}
              <div className="space-y-1 min-w-0">
                <div className="flex items-center justify-between gap-1.5">
                  <h5 className={cn(
                    "text-xs font-semibold truncate",
                    isSelected
                      ? "text-blue-700 dark:text-blue-300"
                      : "text-gray-900 dark:text-white"
                  )}>
                    {style.name}
                  </h5>
                  {isSelected && (
                    <Check className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                  )}
                </div>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-snug line-clamp-2">
                  {style.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

