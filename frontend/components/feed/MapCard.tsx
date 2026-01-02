'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { TrendingUp, User } from 'lucide-react';
import type { FeedMap } from '@/lib/actions/feed';

interface MapCardProps {
  map: FeedMap;
  actionSlot?: React.ReactNode;
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

export function MapCard({ map, actionSlot }: MapCardProps) {
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

  const cardContent = (
    <div className="relative bg-white dark:bg-gray-800/40 rounded-2xl border border-gray-100 dark:border-white/5 overflow-hidden shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] dark:shadow-[0_4px_30px_-4px_rgba(0,0,0,0.3)] hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.2)] dark:hover:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.4)] hover:scale-[1.01] hover:border-blue-500/30 dark:hover:border-blue-400/20 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] cursor-pointer backdrop-blur-sm">
      {/* Image with gradient overlay */}
      {map.thumbnail_url ? (
        <div className="relative bg-gray-50 dark:bg-gray-900/50 w-full overflow-hidden" style={{ minHeight: '200px' }}>
          <img
            src={map.thumbnail_url}
            alt={map.title}
            className="w-full h-auto object-cover block transition-transform duration-700 ease-out group-hover:scale-105"
            loading="lazy"
          />
          {/* Refined Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-500" />
        </div>
      ) : (
        <div className="aspect-[2/3] bg-gray-50 dark:bg-gray-900/50 flex items-center justify-center shimmer">
          <p className="text-gray-400 dark:text-gray-500 text-xs font-medium tracking-wide">NO PREVIEW</p>
        </div>
      )}

      {/* Glassy Content Overlay (Bottom) */}
      <div className="p-5 relative z-10">
        <div className="flex items-start justify-between gap-3 mb-1.5">
          <h3 className="font-bold text-[17px] leading-snug text-gray-900 dark:text-white/90 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300 line-clamp-2">
            {map.title}
          </h3>
        </div>

        {map.subtitle && (
          <p className="text-[13px] font-medium text-gray-500 dark:text-gray-400 line-clamp-1 mb-4">
            {map.subtitle}
          </p>
        )}

        {/* Metadata row */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100/80 dark:border-white/5">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center border border-blue-100/50 dark:border-blue-400/10">
              <User className="w-3 h-3 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-[12px] font-semibold text-gray-600 dark:text-gray-300 truncate max-w-[100px]">
              {map.author.display_name || map.author.username}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
              <TrendingUp className="w-3 h-3 text-emerald-500" />
              <span className="text-[12px] font-bold text-gray-700 dark:text-gray-200">{map.vote_score}</span>
            </div>
            <span className="text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">{relativeTime(map.created_at)}</span>
          </div>
        </div>

        {/* Action Slot (for profile page buttons) */}
        {actionSlot && (
          <div className="pt-4 border-t border-gray-100/80 dark:border-white/5">
            {actionSlot}
          </div>
        )}
      </div>

      {/* Subtle Glow Effect on Hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-tr from-blue-500/5 via-transparent to-purple-500/5 transition-opacity duration-700 pointer-events-none" />
    </div>
  );

  return (
    <div
      ref={cardRef}
      className={`transition-all duration-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
    >
      {actionSlot ? (
        <div className="block group">
          {cardContent}
        </div>
      ) : (
        <Link href={`/map/${map.id}`} className="block group">
          {cardContent}
        </Link>
      )}
    </div>
  );
}

