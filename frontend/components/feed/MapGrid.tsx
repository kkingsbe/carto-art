'use client';

import Masonry from 'react-masonry-css';
import type { FeedMap } from '@/lib/actions/feed';
import { MapCard } from './MapCard';

interface MapGridProps {
  maps: FeedMap[];
}

const breakpointColumnsObj = {
  default: 5,        // 1920px+
  1920: 5,
  1440: 4,           // 1440px+
  1024: 3,           // lg screens (1024px+)
  768: 2,            // md screens (768px+)
  640: 2,            // sm screens (640px+)
  0: 1               // mobile (below 640px)
};

export function MapGrid({ maps }: MapGridProps) {
  if (maps.length === 0) {
    return (
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <p className="text-gray-500 dark:text-gray-400">
            No maps published yet. Be the first to share!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Masonry
        breakpointCols={breakpointColumnsObj}
        className="my-masonry-grid"
        columnClassName="my-masonry-grid_column"
      >
        {maps.map((map) => (
          <MapCard key={map.id} map={map} />
        ))}
      </Masonry>
    </div>
  );
}

