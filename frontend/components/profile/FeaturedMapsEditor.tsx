'use client';

import { useState, useTransition } from 'react';
import Masonry from 'react-masonry-css';
import { SavedMap, SavedMapSummary } from '@/lib/actions/maps';
import { updateFeaturedMaps } from '@/lib/actions/user';
import { Star } from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';

interface FeaturedMapsEditorProps {
    allMaps: SavedMap[] | SavedMapSummary[];
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
        <div className="glass-card rounded-xl p-6 border border-white/5 bg-white/5">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h2 className="text-lg font-semibold text-[#f5f0e8] flex items-center gap-2">
                        <Star className="w-5 h-5 text-[#c9a962]" />
                        Featured Maps
                    </h2>
                    <p className="text-sm text-[#d4cfc4]/60">
                        Select up to 3 published maps to highlight
                    </p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={isPending}
                    className="px-6 py-2 bg-transparent border border-[#c9a962]/50 text-[#c9a962] rounded-xl text-sm font-bold hover:bg-[#c9a962] hover:text-[#0a0f1a] disabled:opacity-50 transition-all duration-300 shadow-[0_0_15px_-5px_rgba(201,169,98,0.3)] hover:shadow-[0_0_20px_rgba(201,169,98,0.5)]"
                >
                    {isPending ? 'Saving...' : 'Save Changes'}
                </button>
            </div>

            {publishedMaps.length === 0 ? (
                <div className="text-center py-8 text-[#d4cfc4]/40 bg-white/5 rounded-xl border border-dashed border-white/10 text-sm">
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
                                    relative cursor-pointer group overflow-hidden transition-all duration-300
                                    bg-[#141d2e] rounded-xl border
                                    shadow-lg select-none
                                    hover:scale-[1.02] 
                                    ${isFeatured
                                        ? 'border-[#c9a962] ring-2 ring-[#c9a962]/20 shadow-[0_0_20px_-5px_rgba(201,169,98,0.3)]'
                                        : 'border-white/5 hover:border-white/20'
                                    }
                                `}
                            >
                                <div className="relative bg-[#0a0f1a] w-full overflow-hidden aspect-[2/3]">
                                    {map.thumbnail_url ? (
                                        <>
                                            <Image
                                                src={map.thumbnail_url}
                                                alt={map.title}
                                                fill
                                                className={`object-cover transition-transform duration-700 ease-out ${isFeatured ? 'scale-105' : 'group-hover:scale-110'}`}
                                            />
                                            {/* Gradient overlay */}
                                            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f1a] via-transparent to-transparent opacity-80" />
                                        </>
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-[#d4cfc4]/20 text-xs font-medium tracking-wide">
                                            NO PREVIEW
                                        </div>
                                    )}

                                    {/* Selection Checkmark */}
                                    <div className={`
                                        absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300
                                        ${isFeatured
                                            ? 'bg-[#c9a962] text-[#0a0f1a] scale-100 shadow-lg'
                                            : 'bg-black/40 border border-white/20 text-transparent scale-90 group-hover:scale-100 group-hover:border-white/40'
                                        }
                                    `}>
                                        {isFeatured && selectionOrder}
                                    </div>
                                </div>

                                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-[#0a0f1a] via-[#0a0f1a]/80 to-transparent">
                                    <div className={`text-sm font-semibold truncate transition-colors duration-300 ${isFeatured ? 'text-[#c9a962]' : 'text-[#f5f0e8]'}`}>
                                        {map.title}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </Masonry>
            )}
        </div>
    );
}
