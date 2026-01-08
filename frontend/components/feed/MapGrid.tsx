'use client';

import Masonry from 'react-masonry-css';
import type { FeedMap } from '@/lib/actions/feed';
import { MapCard } from './MapCard';

interface MapGridProps {
  maps: FeedMap[];
}

export const breakpointColumnsObj = {
  default: 3,        // 1920px+
  1920: 3,
  1440: 3,           // 1440px+
  1024: 2,           // lg screens (1024px+)
  768: 2,            // md screens (768px+)
  640: 1,            // sm screens (640px+)
  0: 1               // mobile (below 640px)
};

export function MapGrid({ maps }: MapGridProps) {
  if (maps.length === 0) {
    return (
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center p-12 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-br from-[#c9a962]/20 to-[#b87333]/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-[#c9a962]/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          </div>
          <p className="text-xl text-[#d4cfc4]/80 font-medium mb-2">
            No maps published yet
          </p>
          <p className="text-sm text-[#d4cfc4]/50">
            Be the first to share your cartographic creation with the community!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 py-8 sm:py-12">
      <Masonry
        breakpointCols={breakpointColumnsObj}
        className="my-masonry-grid"
        columnClassName="my-masonry-grid_column"
      >
        {maps.map((map, index) => (
          <MapCard
            key={map.id}
            map={map}
            index={index}
            featured={index === 0 && map.vote_score > 10}
          />
        ))}
      </Masonry>
    </div>
  );
}
