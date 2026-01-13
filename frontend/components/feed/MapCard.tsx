'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { TrendingUp, User, Copy, Eye, Heart, Sparkles } from 'lucide-react';
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
        "gallery-card group relative flex flex-col rounded-[2rem] overflow-hidden",
        "bg-[#0a0f1a]", // Fallback
        "transition-all duration-700 ease-out",
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12',
        featured && "md:row-span-2"
      )}
      style={{
        transitionDelay: `${index * 50}ms`,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Animated Border Gradient */}
      <div className={cn(
        "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700",
        "bg-gradient-to-b from-white/10 to-transparent pointer-events-none z-10"
      )} />

      {/* Base Border */}
      <div className="absolute inset-0 border border-white/5 group-hover:border-white/10 rounded-[2rem] pointer-events-none z-20 transition-colors duration-500" />

      {/* Primary Link (Stretched) - Covers the card up to z-10 */}
      <Link
        href={`/map/${map.id}`}
        className="absolute inset-0 z-10"
        aria-label={`View map: ${map.title}`}
      />

      {/* Image Section - Poster Preview */}
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-[#151b2e]">
        {map.thumbnail_url ? (
          <>
            <img
              src={map.thumbnail_url}
              alt={map.title}
              className={cn(
                "w-full h-full object-cover transition-transform duration-1000 cubic-bezier(0.2, 0, 0, 1)",
                isHovered && "scale-[1.03]"
              )}
              loading="lazy"
            />

            {/* Gradient overlay - Always present for text readability at bottom */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#050B14] via-[#050B14]/40 to-transparent opacity-60 transition-opacity duration-500 group-hover:opacity-80" />

            {/* Top gradient for action buttons */}
            <div className={cn(
              "absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/60 to-transparent",
              "opacity-0 transition-opacity duration-300",
              isHovered && "opacity-100"
            )} />

            {/* Subtle highlight/noise texture could go here */}

            {/* Top Action Buttons - Only visible on hover/focus */}
            <div className={cn(
              "absolute top-4 right-4 flex flex-col gap-2 z-30",
              "transition-all duration-300 ease-out",
              isHovered ? "translate-x-0 opacity-100" : "translate-x-4 opacity-0"
            )}>
              {/* Save Button */}
              <button
                onClick={handleSave}
                className={cn(
                  "p-3 rounded-full backdrop-blur-md shadow-lg border border-white/10",
                  "transition-all duration-300 hover:scale-110",
                  isSaved
                    ? "bg-rose-500/90 text-white border-rose-500/50"
                    : "bg-black/40 hover:bg-black/60 text-white"
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
                  // Custom navigation or action
                  router.push(`/editor?remix=${map.id}`);
                }}
                className="p-3 bg-black/40 hover:bg-black/60 text-white rounded-full shadow-lg backdrop-blur-md transition-all duration-300 hover:scale-110 border border-white/10"
                title="Remix this map"
              >
                <Copy className="w-5 h-5" />
              </button>
            </div>

            {/* Featured Badge */}
            {featured && (
              <div className="absolute top-4 left-4 z-20">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#c9a962] text-[#0a0f1a] rounded-full shadow-[0_4px_20px_-4px_rgba(201,169,98,0.5)]">
                  <Sparkles className="w-3.5 h-3.5 fill-[#0a0f1a]" />
                  <span className="text-xs font-bold uppercase tracking-wide">Featured</span>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden group-hover:scale-105 transition-transform duration-1000">
            {/* Abstract background for no preview */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/20 via-[#0a0f1a] to-[#0a0f1a]" />
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-500 via-transparent to-transparent" />

            <TrendingUp className="w-12 h-12 text-white/10 mb-4 relative z-10" />
            <p className="text-white/30 text-xs font-bold tracking-[0.2em] uppercase relative z-10">Map Preview</p>
          </div>
        )}
      </div>

      {/* Content Section - Overlaying the bottom of the image */}
      <div className="absolute bottom-0 left-0 right-0 p-6 z-20 flex flex-col justify-end">

        {/* Title & Stats */}
        <div className="space-y-3 transform transition-transform duration-300 group-hover:-translate-y-2">
          <h3 className={cn(
            "text-2xl font-bold text-white leading-tight tracking-tight",
            "line-clamp-2 drop-shadow-md"
          )}>
            {map.title}
          </h3>

          <div className="flex items-center justify-between">
            <Link
              href={`/user/${map.author.username}`}
              className="flex items-center gap-2.5 group/author z-30 opacity-90 hover:opacity-100 transition-opacity"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative">
                {map.author.avatar_url ? (
                  <img
                    src={map.author.avatar_url}
                    alt={map.author.username}
                    className="w-6 h-6 rounded-full ring-2 ring-white/20 group-hover/author:ring-[#c9a962] transition-all"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-white/10 ring-2 ring-white/20 flex items-center justify-center">
                    <User className="w-3 h-3 text-white/70" />
                  </div>
                )}
              </div>
              <span className="text-sm font-medium text-white/90 shadow-black drop-shadow-sm group-hover/author:text-[#c9a962] transition-colors">
                {map.author.display_name || map.author.username}
              </span>
            </Link>

            {/* Published Date - Tiny and clean */}
            <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
              {relativeTime(map.created_at)}
            </span>
          </div>
        </div>

        {/* Hover interaction area (Stats & Actions) */}
        <div className={cn(
          "grid grid-rows-[0fr] group-hover:grid-rows-[1fr] transition-[grid-template-rows] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]"
        )}>
          <div className="overflow-hidden">
            <div className="pt-4 flex items-center justify-between border-t border-white/10 mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
              {/* Stats */}
              <div className="flex items-center gap-4">
                <button
                  onClick={handleVote}
                  className={cn(
                    "flex items-center gap-2 group/vote transition-colors z-30",
                    voteAnimation && "animate-vote-pulse"
                  )}
                >
                  <TrendingUp className="w-4 h-4 text-[#c9a962]" />
                  <span className="text-sm font-bold text-white/90">{map.vote_score}</span>
                </button>

                {map.view_count !== undefined && (
                  <div className="flex items-center gap-2 text-white/60">
                    <Eye className="w-4 h-4" />
                    <span className="text-xs font-bold">{map.view_count}</span>
                  </div>
                )}
              </div>

              {/* Action Slot (e.g. quick view or similar, passed from parent) */}
              {actionSlot && (
                <div className="z-30">
                  {actionSlot}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
