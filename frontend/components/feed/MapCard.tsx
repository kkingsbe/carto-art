'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { TrendingUp, User, Copy } from 'lucide-react';
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
      className={`relative group bg-[#0a0f1a] rounded-2xl border border-white/5 overflow-hidden transition-all duration-500 hover:shadow-[0_0_40px_rgba(201,169,98,0.1)] hover:border-[#c9a962]/30 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
    >
      {/* Primary Link (Stretched) - Covers the card up to z-10 */}
      {!actionSlot && (
        <Link
          href={`/map/${map.id}`}
          className="absolute inset-0 z-10"
          aria-label={`View map: ${map.title}`}
        />
      )}

      {/* Image with gradient overlay */}
      {map.thumbnail_url ? (
        <div className="relative z-0 bg-white/5 w-full overflow-hidden" style={{ minHeight: '200px' }}>
          <img
            src={map.thumbnail_url}
            alt={map.title}
            className="w-full h-auto object-cover block transition-transform duration-700 ease-out group-hover:scale-105"
            loading="lazy"
          />
          {/* Refined Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f1a] via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-500 pointer-events-none" />

          {/* Remix Button Overlay - High z-index to be clickable over the primary link */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-30 pointer-events-none group-hover:pointer-events-auto">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                router.push(`/editor?remix=${map.id}`);
              }}
              className="px-6 py-2.5 bg-[#c9a962] hover:bg-[#b89851] text-[#0a0f1a] rounded-full font-bold text-sm shadow-xl transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 flex items-center gap-2"
            >
              <Copy className="w-4 h-4" />
              Remix Map
            </button>
          </div>
        </div>
      ) : (
        <div className="aspect-[2/3] z-0 bg-white/5 flex items-center justify-center shimmer border-b border-white/5">
          <p className="text-white/20 text-xs font-medium tracking-wide">NO PREVIEW</p>
        </div>
      )}

      {/* Glassy Content Overlay (Bottom) */}
      <div className="p-5 relative z-20 bg-[#0a0f1a] pointer-events-none">
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className="font-bold text-[17px] leading-snug text-[#f5f0e8] group-hover:text-[#c9a962] transition-colors duration-300 line-clamp-2">
            {map.title}
          </h3>
        </div>

        {map.subtitle && (
          <p className="text-[13px] font-medium text-[#d4cfc4]/60 line-clamp-1 mb-4">
            {map.subtitle}
          </p>
        )}

        {/* Metadata row */}
        <div className="flex items-center justify-between pt-4 border-t border-white/5">
          <div className="flex items-center gap-2 pointer-events-auto">
            <Link
              href={`/user/${map.author.username}`}
              className="flex items-center gap-2 group/author hover:opacity-80 transition-opacity relative z-30"
            >
              <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center border border-white/10 group-hover/author:border-[#c9a962]/50 transition-colors">
                <User className="w-3 h-3 text-[#c9a962]" />
              </div>
              <span className="text-[12px] font-semibold text-[#d4cfc4]/80 group-hover/author:text-[#c9a962] transition-colors truncate max-w-[100px]">
                {map.author.display_name || map.author.username}
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 group-hover:border-[#c9a962]/30 transition-colors">
              <TrendingUp className="w-3 h-3 text-[#c9a962]" />
              <span className="text-[12px] font-bold text-[#f5f0e8]">{map.vote_score}</span>
            </div>
            <span className="text-[11px] font-medium text-[#d4cfc4]/40 uppercase tracking-wider">{relativeTime(map.created_at)}</span>
          </div>
        </div>

        {/* Action Slot (for profile page buttons) */}
        {actionSlot && (
          <div className="pt-4 mt-4 border-t border-white/5 pointer-events-auto relative z-30">
            {actionSlot}
          </div>
        )}
      </div>
    </div>
  );
}

