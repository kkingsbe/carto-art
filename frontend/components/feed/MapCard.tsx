'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { TrendingUp, User, Copy, Eye, Heart, MapPin, Sparkles } from 'lucide-react';
import type { FeedMap } from '@/lib/actions/feed';
import { cn } from '@/lib/utils';

interface MapCardProps {
  map: FeedMap;
  actionSlot?: React.ReactNode;
  featured?: boolean;
  index?: number;
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

export function MapCard({ map, actionSlot, featured = false, index = 0 }: MapCardProps) {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [voteAnimation, setVoteAnimation] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Staggered animation delay based on index
          setTimeout(() => {
            setIsVisible(true);
          }, Math.min(index * 100, 500));
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, [index]);

  const handleVote = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setVoteAnimation(true);
    setTimeout(() => setVoteAnimation(false), 400);
    // TODO: Implement actual vote functionality
  };

  const handleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsSaved(!isSaved);
    // TODO: Implement actual save functionality
  };

  return (
    <div
      ref={cardRef}
      className={cn(
        "gallery-card group relative flex flex-col rounded-3xl overflow-hidden",
        "bg-gradient-to-br from-[#0c1424] to-[#050B14]",
        "border border-white/5",
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6',
        featured && "md:row-span-2"
      )}
      style={{
        transitionProperty: 'opacity, transform, box-shadow, border-color',
        transitionDuration: '0.6s',
        transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
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
              className={cn(
                "w-full h-full object-cover transition-all duration-700",
                isHovered && "scale-105"
              )}
              loading="lazy"
            />

            {/* Gradient overlay on hover */}
            <div
              className={cn(
                "absolute inset-0 bg-gradient-to-t from-[#050B14]/90 via-transparent to-transparent",
                "transition-opacity duration-500",
                isHovered ? "opacity-100" : "opacity-0"
              )}
            />

            {/* Subtle inner shadow for depth */}
            <div className="absolute inset-0 shadow-[inset_0_0_60px_rgba(0,0,0,0.15)] pointer-events-none" />

            {/* Top Action Buttons */}
            <div className={cn(
              "absolute top-4 right-4 flex flex-col gap-2 z-30",
              "transition-all duration-300",
              isHovered ? "translate-x-0 opacity-100" : "translate-x-4 opacity-0"
            )}>
              {/* Save Button */}
              <button
                onClick={handleSave}
                className={cn(
                  "gallery-action-btn p-3 rounded-full shadow-lg backdrop-blur-md",
                  "transition-all duration-300",
                  isSaved
                    ? "bg-red-500/90 text-white"
                    : "bg-white/90 hover:bg-white text-[#0a0f1a]"
                )}
                title={isSaved ? "Remove from saved" : "Save this map"}
              >
                <Heart className={cn(
                  "w-5 h-5 transition-transform",
                  isSaved && "fill-current animate-heart-pop"
                )} />
              </button>

              {/* Remix Button */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  router.push(`/editor?remix=${map.id}`);
                }}
                className="gallery-action-btn p-3 bg-white/90 hover:bg-white text-[#0a0f1a] rounded-full shadow-lg backdrop-blur-md transition-colors"
                title="Remix this map"
              >
                <Copy className="w-5 h-5" />
              </button>
            </div>

            {/* Featured Badge */}
            {featured && (
              <div className="absolute top-4 left-4 z-20">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-[#c9a962] to-[#b87333] rounded-full shadow-lg">
                  <Sparkles className="w-3.5 h-3.5 text-[#0a0f1a]" />
                  <span className="text-xs font-bold text-[#0a0f1a] uppercase tracking-wide">Featured</span>
                </div>
              </div>
            )}

            {/* Bottom Stats Overlay (visible on hover) */}
            <div className={cn(
              "absolute bottom-0 left-0 right-0 p-4 z-20",
              "transition-all duration-500",
              isHovered ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
            )}>
              <div className="flex items-center gap-2">
                {/* Vote Button */}
                <button
                  onClick={handleVote}
                  className={cn(
                    "gallery-action-btn flex items-center gap-2 px-4 py-2 rounded-full",
                    "bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20",
                    "transition-all duration-300",
                    voteAnimation && "animate-vote-bounce"
                  )}
                >
                  <TrendingUp className="w-4 h-4 text-[#c9a962]" />
                  <span className="text-sm font-bold text-white">{map.vote_score}</span>
                </button>

                {map.view_count !== undefined && (
                  <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20">
                    <Eye className="w-4 h-4 text-blue-400" />
                    <span className="text-sm font-bold text-white">{map.view_count}</span>
                  </div>
                )}
              </div>
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
      <div className="flex flex-col p-5 bg-gradient-to-b from-[#050B14] to-[#0a0f1a] relative z-20">
        {/* Title with gradient on hover */}
        <h3 className={cn(
          "text-xl font-bold mb-3 line-clamp-1 tracking-tight transition-colors duration-300",
          isHovered ? "text-[#c9a962]" : "text-white"
        )}>
          {map.title}
        </h3>

        {/* Author Row */}
        <div className="flex items-center justify-between">
          <Link
            href={`/user/${map.author.username}`}
            className="flex items-center gap-3 group/author hover:opacity-80 transition-opacity z-30"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Avatar with ring on hover */}
            <div className={cn(
              "relative rounded-full transition-all duration-300",
              isHovered && "ring-2 ring-[#c9a962]/50 ring-offset-2 ring-offset-[#050B14]"
            )}>
              {map.author.avatar_url ? (
                <img src={map.author.avatar_url} alt={map.author.username} className="w-8 h-8 rounded-full border border-white/10" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center border border-white/10">
                  <User className="w-4 h-4 text-white/50" />
                </div>
              )}
            </div>
            <span className="text-sm font-medium text-[#d4cfc4] group-hover/author:text-[#c9a962] transition-colors">
              {map.author.display_name || map.author.username}
            </span>
          </Link>

          {/* Date Badge */}
          <span className="text-[11px] font-bold text-[#d4cfc4]/30 uppercase tracking-widest">
            {relativeTime(map.created_at).replace(' ago', '')}
          </span>
        </div>

        {/* Stats Row (always visible, mobile-friendly) */}
        <div className={cn(
          "flex items-center justify-between mt-4 pt-4 border-t border-white/5",
          "lg:hidden" // Hide on large screens where hover overlay shows stats
        )}>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#141d2e] border border-white/5">
              <TrendingUp className="w-3.5 h-3.5 text-[#c9a962]" />
              <span className="text-xs font-bold text-[#f5f0e8]">{map.vote_score}</span>
            </div>

            {map.view_count !== undefined && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#141d2e] border border-white/5">
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
