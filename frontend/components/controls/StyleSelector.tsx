'use client';

import type { PosterStyle } from '@/types/poster';
import { styles } from '@/lib/styles';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import { ControlSection } from '@/components/ui/control-components';

interface StyleSelectorProps {
  selectedStyleId: string;
  onStyleSelect: (style: PosterStyle) => void;
}

export function StyleSelector({ selectedStyleId, onStyleSelect }: StyleSelectorProps) {
  return (
    <ControlSection title="Theme">
      <div className="grid grid-cols-1 gap-2">
        {styles.map((style) => {
          const isSelected = selectedStyleId === style.id;
          return (
            <button
              key={style.id}
              type="button"
              onClick={() => onStyleSelect(style)}
              className={cn(
                'group relative flex items-start gap-4 p-4 text-left border rounded-lg transition-all',
                isSelected
                  ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/10 dark:border-blue-500/50 ring-1 ring-blue-500/20'
                  : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800/50'
              )}
            >
              <div className="flex-1 space-y-1">
                <div className={cn(
                  "font-medium transition-colors",
                  isSelected ? "text-blue-700 dark:text-blue-300" : "text-gray-900 dark:text-white"
                )}>
                  {style.name}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  {style.description}
                </div>
              </div>
              
              {isSelected && (
                <div className="text-blue-500 dark:text-blue-400">
                  <Check className="w-5 h-5" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </ControlSection>
  );
}

