'use client';

import { useState, useTransition } from 'react';
import Masonry from 'react-masonry-css';
import { SavedMap } from '@/lib/actions/maps';
import { updateFeaturedMaps } from '@/lib/actions/user';
import { Star } from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';

interface FeaturedMapsEditorProps {
    allMaps: SavedMap[];
    initialFeaturedIds: string[];
}

// Smaller breakpoint config for sidebar use
const sidebarBreakpointColumns = {
    default: 2,
    1536: 2,
    0: 1 // Single column for most sizes since it's in a 1/3 sidebar
};

export function FeaturedMapsEditor({ allMaps, initialFeaturedIds }: FeaturedMapsEditorProps) {
    const [featuredIds, setFeaturedIds] = useState<string[]>(initialFeaturedIds || []);
    const [isPending, startTransition] = useTransition();

    const toggleFeatured = (mapId: string) => {
        let newIds = [...featuredIds];
        if (newIds.includes(mapId)) {
            newIds = newIds.filter(id => id !== mapId);
        } else {
            if (newIds.length >= 3) {
                toast.warning('You can only feature up to 3 maps');
                return;
            }
            newIds.push(mapId);
        }

        setFeaturedIds(newIds);
    };

    const handleSave = () => {
        startTransition(async () => {
            try {
                await updateFeaturedMaps(featuredIds);
                toast.success('Featured maps updated');
            } catch (error) {
                toast.error('Failed to update featured maps');
            }
        });
    };

    const publishedMaps = allMaps.filter(m => m.is_published);

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <Star className="w-5 h-5 text-yellow-500" />
                        Featured Maps
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Select up to 3 published maps to highlight on your profile
                    </p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={isPending}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                    {isPending ? 'Saving...' : 'Save Changes'}
                </button>
            </div>

            {publishedMaps.length === 0 ? (
                <div className="text-center py-8 text-gray-500 bg-gray-50 dark:bg-gray-900 rounded-lg border border-dashed border-gray-200 dark:border-gray-700">
                    Publish some maps to feature them!
                </div>
            ) : (
                <Masonry
                    breakpointCols={sidebarBreakpointColumns}
                    className="my-masonry-grid"
                    columnClassName="my-masonry-grid_column"
                >
                    {publishedMaps.map(map => {
                        const isFeatured = featuredIds.includes(map.id);
                        const selectionOrder = featuredIds.indexOf(map.id) + 1;

                        return (
                            <div
                                key={map.id}
                                onClick={() => toggleFeatured(map.id)}
                                className={`
                                    relative cursor-pointer group overflow-hidden transition-all duration-500
                                    bg-white dark:bg-gray-800/40 rounded-2xl border
                                    shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] dark:shadow-[0_4px_30px_-4px_rgba(0,0,0,0.3)]
                                    hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.2)] dark:hover:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.4)]
                                    hover:scale-[1.01] 
                                    ${isFeatured
                                        ? 'border-indigo-500 ring-4 ring-indigo-500/20'
                                        : 'border-gray-100 dark:border-white/5 hover:border-blue-500/30 dark:hover:border-blue-400/20'
                                    }
                                `}
                            >
                                <div className="relative bg-gray-50 dark:bg-gray-900/50 w-full overflow-hidden" style={{ minHeight: '150px' }}>
                                    {map.thumbnail_url ? (
                                        <>
                                            <Image
                                                src={map.thumbnail_url}
                                                alt={map.title}
                                                fill
                                                className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                                            />
                                            {/* Gradient overlay */}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-500" />
                                        </>
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs font-medium tracking-wide aspect-[2/3]">
                                            NO PREVIEW
                                        </div>
                                    )}

                                    {/* Selection Overlay */}
                                    <div className={`
                                        absolute inset-0 bg-black/40 transition-opacity flex items-center justify-center
                                        ${isFeatured ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
                                    `}>
                                        {isFeatured && (
                                            <div className="w-10 h-10 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold shadow-lg text-lg">
                                                {selectionOrder}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="p-3 text-sm font-semibold truncate bg-white dark:bg-gray-900 text-gray-900 dark:text-white/90">
                                    {map.title}
                                </div>
                            </div>
                        );
                    })}
                </Masonry>
            )}
        </div>
    );
}
