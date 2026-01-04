'use client';

import { useEffect, useRef } from 'react';
import { FeedFilters } from './FeedFilters';
import { MapGrid } from './MapGrid';
import { useInfiniteFeed } from '@/hooks/useInfiniteFeed';
import { Loader2 } from 'lucide-react';

interface FeedClientProps {
  initialSort: 'fresh' | 'top' | 'following';
}

export function FeedClient({ initialSort }: FeedClientProps) {
  const { maps, loadMore, hasMore, loading, initialLoading, error } = useInfiniteFeed(initialSort);
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
    <>
      <FeedFilters currentSort={initialSort} />

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {initialLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <>
          <MapGrid maps={maps} />

          {/* Sentinel element for infinite scroll */}
          <div ref={sentinelRef} className="h-10 flex items-center justify-center">
            {loading && (
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm">Loading more maps...</span>
              </div>
            )}
            {!hasMore && maps.length > 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No more maps to load
              </p>
            )}
          </div>
        </>
      )}
    </>
  );
}

