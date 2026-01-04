'use client';

import React from 'react';
import { useVistas, Vista } from '@/hooks/useVistas';
import { VISTAS as FALLBACK_VISTAS } from '@/lib/config/examples';
import { POSTER_EXAMPLES } from '@/lib/config/examples';
import { PosterConfig } from '@/types/poster';
import { cn } from '@/lib/utils';
import { Sparkles, Loader2 } from 'lucide-react';
import { PosterThumbnail } from '../map/PosterThumbnail';

interface VistasGalleryProps {
    onLocationSelect: (location: PosterConfig['location']) => void;
    currentConfig: PosterConfig;
}

export const VistasGallery: React.FC<VistasGalleryProps> = ({ onLocationSelect, currentConfig }) => {
    const { vistas: dbVistas, isLoading, error } = useVistas();

    // Use DB vistas if available, fall back to hardcoded examples
    const vistas: Vista[] = dbVistas.length > 0 ? dbVistas : FALLBACK_VISTAS;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2 px-1">
                <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
                    Curated Vistas
                </h2>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 overflow-y-auto max-h-[calc(100vh-200px)] pr-2 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-800">
                    {vistas.map((vista) => {
                        const isActive = currentConfig.location.name === vista.location.name &&
                            currentConfig.location.city === vista.location.city;

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
                                    <VistaThumbnail vistaId={vista.id} location={vista.location} />
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
            )}

            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-100 dark:border-blue-800/30">
                <p className="text-[11px] text-blue-700 dark:text-blue-300 leading-relaxed italic">
                    Tip: Selecting a vista will move your map to this location, but keep your current style settings.
                </p>
            </div>
        </div>
    );
};

interface VistaThumbnailProps {
    vistaId: string;
    location: PosterConfig['location'];
}

const VistaThumbnail = ({ vistaId, location }: VistaThumbnailProps) => {
    // Try to find a matching poster example for a nice styled thumbnail
    const example = POSTER_EXAMPLES.find(e => e.id === vistaId);

    if (example) {
        return (
            <PosterThumbnail
                config={example.config}
                className="transition-transform duration-500 group-hover:scale-110"
            />
        );
    }

    // Fallback: create a minimal config for DB-only vistas
    // This uses a simple representation when no example exists
    return (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800">
            <div className="text-center text-blue-600 dark:text-blue-300">
                <div className="text-2xl font-bold">{location.city || location.name}</div>
                <div className="text-xs opacity-75">
                    {location.center[1].toFixed(2)}°, {location.center[0].toFixed(2)}°
                </div>
            </div>
        </div>
    );
};
