'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { TrendingUp, User, Copy, Eye } from 'lucide-react';
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
  const router = useRouter();
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
      className={`group relative flex flex-col bg-[#050B14] rounded-3xl overflow-hidden transition-all duration-500 hover:shadow-[0_0_50px_rgba(201,169,98,0.15)] hover:-translate-y-1 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
    >
      {/* Primary Link (Stretched) - Covers the card up to z-10 */}
      <Link
        href={`/map/${map.id}`}
        className="absolute inset-0 z-10"
        aria-label={`View map: ${map.title}`}
      />

      {/* Image Section - Poster Preview */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#EBE9E4]">
        {map.thumbnail_url ? (
          <>
            <img
              src={map.thumbnail_url}
              alt={map.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              loading="lazy"
            />
            {/* Subtle inner shadow for depth */}
            <div className="absolute inset-0 shadow-[inset_0_0_40px_rgba(0,0,0,0.1)] pointer-events-none" />

            {/* Quick Remix Button (only on hover) */}
            <div className="absolute top-4 right-4 translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300 z-30">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  router.push(`/editor?remix=${map.id}`);
                }}
                className="p-3 bg-white/90 hover:bg-white text-[#0a0f1a] rounded-full shadow-lg backdrop-blur-sm transition-colors"
                title="Remix this map"
              >
                <Copy className="w-5 h-5" />
              </button>
            </div>
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-[#1a1f2e] border-b border-white/5">
            <TrendingUp className="w-12 h-12 text-white/10 mb-4" />
            <p className="text-white/20 text-xs font-bold tracking-widest uppercase">No Preview</p>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="flex flex-col p-5 bg-[#050B14] border-t border-white/5 relative z-20">
        <h3 className="text-2xl font-bold text-white mb-4 line-clamp-1 tracking-tight">
          {map.title}
        </h3>

        <div className="flex items-center justify-between mb-2">
          {/* Author */}
          <Link
            href={`/user/${map.author.username}`}
            className="flex items-center gap-3 group/author hover:opacity-80 transition-opacity z-30"
            onClick={(e) => e.stopPropagation()}
          >
            {map.author.avatar_url ? (
              <img src={map.author.avatar_url} alt={map.author.username} className="w-8 h-8 rounded-full border border-white/10" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center border border-white/10">
                <User className="w-4 h-4 text-white/50" />
              </div>
            )}
            <span className="text-sm font-medium text-[#d4cfc4] group-hover/author:text-[#c9a962] transition-colors">
              {map.author.display_name || map.author.username}
            </span>
          </Link>

          {/* Date */}
          <span className="text-[11px] font-bold text-[#d4cfc4]/30 uppercase tracking-widest">
            {relativeTime(map.created_at).replace(' ago', '')} AGO
          </span>
        </div>

        {/* Stats Row */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#141d2e] border border-white/5 group-hover:border-[#c9a962]/30 transition-colors">
              <TrendingUp className="w-3.5 h-3.5 text-[#c9a962]" />
              <span className="text-xs font-bold text-[#f5f0e8]">{map.vote_score}</span>
            </div>

            {map.view_count !== undefined && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#141d2e] border border-white/5 group-hover:border-blue-500/30 transition-colors">
                <Eye className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-xs font-bold text-[#f5f0e8]">{map.view_count}</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Slot (Profile Buttons) */}
        {actionSlot && (
          <div className="mt-6 pt-0 pointer-events-auto z-30 relative">
            {actionSlot}
          </div>
        )}
      </div>
    </div>
  );
}

