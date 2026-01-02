'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { TrendingUp, User } from 'lucide-react';
import type { FeedMap } from '@/lib/actions/feed';

interface MapCardProps {
  map: FeedMap;
}

function relativeTime(date: string): string {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now.getTime() - past.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return '1d ago';
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
  return `${Math.floor(diffDays / 365)}y ago`;
}

export function MapCard({ map }: MapCardProps) {
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={cardRef}
      className={`transition-all duration-500 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
    >
      <Link href={`/map/${map.id}`} className="block group">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm hover:shadow-2xl hover:scale-[1.02] hover:border-blue-500/50 dark:hover:border-blue-400/50 hover:ring-4 hover:ring-blue-500/10 transition-all duration-300 ease-out cursor-pointer">
          {/* Image with gradient overlay */}
          {map.thumbnail_url ? (
            <div className="relative bg-gray-100 dark:bg-gray-700 w-full overflow-hidden rounded-t-xl" style={{ minHeight: '200px' }}>
              <img
                src={map.thumbnail_url}
                alt={map.title}
                className="w-full h-auto object-cover block"
                loading="lazy"
              />
              {/* Gradient overlay */}
              <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 via-black/20 to-transparent pointer-events-none" />
            </div>
          ) : (
            <div className="aspect-[2/3] bg-gray-100 dark:bg-gray-700 flex items-center justify-center shimmer rounded-t-xl">
              <p className="text-gray-400 dark:text-gray-500 text-sm">No thumbnail</p>
            </div>
          )}

          {/* Content */}
          <div className="p-4">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="font-semibold text-base text-gray-900 dark:text-white line-clamp-2 flex-1">
                {map.title}
              </h3>
            </div>

            {map.subtitle && (
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1 mb-3">
                {map.subtitle}
              </p>
            )}

            {/* Metadata row */}
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                <span className="truncate max-w-[120px]">{map.author.display_name || map.author.username}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>{map.vote_score}</span>
                </div>
                <span className="text-gray-400 dark:text-gray-500">{relativeTime(map.created_at)}</span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}

