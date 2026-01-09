'use client';

import { useEffect, useRef } from 'react';
import { FeedFilters } from './FeedFilters';
import { MapGrid } from './MapGrid';
import { useInfiniteFeed } from '@/hooks/useInfiniteFeed';
import { Loader2 } from 'lucide-react';
import { GalleryOnboarding } from '../gallery/GalleryOnboarding';

interface FeedClientProps {
  initialSort: 'fresh' | 'top' | 'following';
  initialStyles: string[];
}

export function FeedClient({ initialSort, initialStyles }: FeedClientProps) {
  const { maps, loadMore, hasMore, loading, initialLoading, error } = useInfiniteFeed(initialSort, initialStyles);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (!sentinelRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasMore && !loading && !initialLoading) {
          loadMore();
        }
      },
      {
        rootMargin: '100px', // Start loading 100px before reaching the bottom
      }
    );

    observer.observe(sentinelRef.current);

    return () => {
      observer.disconnect();
    };
  }, [hasMore, loading, initialLoading, loadMore]);

  return (
    <div className="bg-[#0a0f1a]">
      <FeedFilters currentSort={initialSort} />

      <GalleryOnboarding />

      {error && (
        <div className="mx-4 sm:mx-6 lg:mx-10 mb-6 p-4 bg-red-900/20 border border-red-800 rounded-lg">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {initialLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-[#c9a962]" />
            <p className="text-sm text-[#d4cfc4]/60">Loading maps...</p>
          </div>
        </div>
      ) : (
        <>
          <MapGrid maps={maps} />

          {/* Sentinel element for infinite scroll */}
          <div ref={sentinelRef} className="h-20 flex items-center justify-center bg-[#0a0f1a]">
            {loading && (
              <div className="flex items-center gap-3 text-[#d4cfc4]/60">
                <Loader2 className="w-5 h-5 animate-spin text-[#c9a962]" />
                <span className="text-sm">Loading more maps...</span>
              </div>
            )}
            {!hasMore && maps.length > 0 && (
              <div className="flex flex-col items-center gap-2 py-8">
                <div className="w-12 h-[1px] bg-gradient-to-r from-transparent via-[#c9a962]/30 to-transparent" />
                <p className="text-sm text-[#d4cfc4]/40">
                  You've reached the end
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
