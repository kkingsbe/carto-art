import React from 'react';
import { POSTER_EXAMPLES } from '@/lib/config/examples';
import { PosterConfig } from '@/types/poster';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Sparkles } from 'lucide-react';

interface ExamplesGalleryProps {
  onSelect: (config: PosterConfig) => void;
  currentConfig: PosterConfig;
}

export const ExamplesGallery: React.FC<ExamplesGalleryProps> = ({ onSelect, currentConfig }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 px-1">
        <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
          Inspiration Gallery
        </h2>
      </div>
      
      <div className="grid grid-cols-1 gap-4 overflow-y-auto max-h-[calc(100vh-200px)] pr-2 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-800">
        {POSTER_EXAMPLES.map((example) => {
          const isActive = currentConfig.location.name === example.config.location.name && 
                          currentConfig.style.id === example.config.style.id;
          
          return (
            <button
              key={example.id}
              onClick={() => onSelect(example.config)}
              className={cn(
                "group relative flex flex-col overflow-hidden rounded-xl border-2 transition-all duration-300 hover:shadow-lg text-left bg-white dark:bg-gray-800",
                isActive 
                  ? "border-blue-500 ring-4 ring-blue-500/10 shadow-md translate-y-[-2px]" 
                  : "border-gray-100 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600"
              )}
            >
              <div className="aspect-[4/3] w-full relative bg-gray-50 dark:bg-gray-900 overflow-hidden">
                <Image
                  src={example.thumbnail}
                  alt={example.name}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                  quality={60}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <h3 className="font-bold text-sm leading-tight drop-shadow-md">{example.name}</h3>
                </div>
              </div>
              <div className="p-3">
                <p className="text-[11px] leading-relaxed text-gray-500 dark:text-gray-400 line-clamp-2">
                  {example.description}
                </p>
              </div>
              {isActive && (
                <div className="absolute top-2 right-2 bg-blue-500 text-white p-1 rounded-full shadow-lg">
                  <Sparkles className="w-3 h-3" />
                </div>
              )}
            </button>
          );
        })}
      </div>
      
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-100 dark:border-blue-800/30">
        <p className="text-[11px] text-blue-700 dark:text-blue-300 leading-relaxed italic">
          Tip: Selecting a preset will replace all your current settings. Use these as a starting point for your own custom artwork.
        </p>
      </div>
    </div>
  );
};

