import React from 'react';
import { VISTAS, Vista } from '@/lib/config/examples';
import { PosterConfig } from '@/types/poster';
import { cn } from '@/lib/utils';
import { Sparkles } from 'lucide-react';
import { PosterThumbnail } from '../map/PosterThumbnail';

interface VistasGalleryProps {
    onLocationSelect: (location: PosterConfig['location']) => void;
    currentConfig: PosterConfig;
}

export const VistasGallery: React.FC<VistasGalleryProps> = ({ onLocationSelect, currentConfig }) => {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2 px-1">
                <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
                    Curated Vistas
                </h2>
            </div>

            <div className="grid grid-cols-1 gap-4 overflow-y-auto max-h-[calc(100vh-200px)] pr-2 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-800">
                {VISTAS.map((vista) => {
                    const isActive = currentConfig.location.name === vista.location.name &&
                        currentConfig.location.city === vista.location.city;

                    // Create a temporary config for the thumbnail that uses the CURRENT style but the VISTA location
                    // This ensures the thumbnail preview matches what the user would see with their current style settings
                    // BUT actually, checking existing ExamplesGallery, it uses the example.config.
                    // However, for Vistas, we probably want to show the location with the *example's* style (which is optimized for it)
                    // OR show it with a neutral style?
                    // Since we are just reusing existing Examples code which has full configs, let's use the original config for the thumbnail
                    // so it looks good.
                    // Wait, VISTAS array effectively has the original config's location, but we might not have the full original config easily available 
                    // unless we look it up or store it.
                    // In `examples.ts` I mapped `VISTAS` from `POSTER_EXAMPLES`.
                    // `PosterThumbnail` takes a `config`.
                    // I should probably pass the full config from the original example to the thumbnail so it looks "correct" as a preview of that location.

                    // Let's find the original example config to pass to the thumbnail
                    // We can import POSTER_EXAMPLES to find it

                    return (
                        <button
                            key={vista.id}
                            onClick={() => onLocationSelect(vista.location)}
                            className={cn(
                                "group relative flex flex-col overflow-hidden rounded-xl border-2 transition-all duration-300 hover:shadow-lg text-left bg-white dark:bg-gray-800",
                                isActive
                                    ? "border-blue-500 ring-4 ring-blue-500/10 shadow-md translate-y-[-2px]"
                                    : "border-gray-100 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600"
                            )}
                        >
                            <div className="aspect-[4/3] w-full relative bg-gray-50 dark:bg-gray-900 overflow-hidden">
                                {/* 
                     We need to render a thumbnail. The existing PosterThumbnail takes a full config. 
                     Since VISTAS are derived from POSTER_EXAMPLES, we can assume we want to show the 
                     beautifully styled version of that location as the preview.
                 */}
                                <VistaThumbnail vistaId={vista.id} />

                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
                                <div className="absolute bottom-3 left-3 right-3 text-white">
                                    <h3 className="font-bold text-sm leading-tight drop-shadow-md">{vista.name}</h3>
                                </div>
                            </div>
                            <div className="p-3">
                                <p className="text-[11px] leading-relaxed text-gray-500 dark:text-gray-400 line-clamp-2">
                                    {vista.description}
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
                    Tip: Selecting a vista will move your map to this location, but keep your current style settings.
                </p>
            </div>
        </div>
    );
};

import { POSTER_EXAMPLES } from '@/lib/config/examples';

const VistaThumbnail = ({ vistaId }: { vistaId: string }) => {
    const example = POSTER_EXAMPLES.find(e => e.id === vistaId);
    if (!example) return null;

    return (
        <PosterThumbnail
            config={example.config}
            className="transition-transform duration-500 group-hover:scale-110"
        />
    );
};
