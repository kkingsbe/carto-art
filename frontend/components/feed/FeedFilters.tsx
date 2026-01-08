'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, TrendingUp, Users, LayoutGrid, List, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface FeedFiltersProps {
  currentSort: 'fresh' | 'top' | 'following';
}

export function FeedFilters({ currentSort }: FeedFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const handleSortChange = (sort: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('sort', sort);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="sticky top-0 z-40 backdrop-blur-xl bg-[#0a0f1a]/90 border-b border-white/5">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10">
        {/* Main Filter Bar */}
        <div className="flex items-center justify-between gap-4 py-4">
          {/* Sort Tabs */}
          <Tabs value={currentSort} onValueChange={handleSortChange} className="flex-shrink-0">
            <TabsList className="bg-white/5 border border-white/10 p-1 rounded-full">
              <TabsTrigger
                value="fresh"
                className={cn(
                  "px-4 sm:px-6 py-2 rounded-full transition-all duration-300",
                  "text-sm font-medium",
                  "data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#c9a962] data-[state=active]:to-[#b87333]",
                  "data-[state=active]:text-[#0a0f1a] data-[state=active]:font-bold data-[state=active]:shadow-lg",
                  "text-[#d4cfc4] hover:text-[#f5f0e8]"
                )}
              >
                <Clock className="w-4 h-4 mr-1.5 sm:mr-2" />
                <span className="hidden xs:inline">Fresh</span>
              </TabsTrigger>
              <TabsTrigger
                value="top"
                className={cn(
                  "px-4 sm:px-6 py-2 rounded-full transition-all duration-300",
                  "text-sm font-medium",
                  "data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#c9a962] data-[state=active]:to-[#b87333]",
                  "data-[state=active]:text-[#0a0f1a] data-[state=active]:font-bold data-[state=active]:shadow-lg",
                  "text-[#d4cfc4] hover:text-[#f5f0e8]"
                )}
              >
                <TrendingUp className="w-4 h-4 mr-1.5 sm:mr-2" />
                <span className="hidden xs:inline">Top</span>
              </TabsTrigger>
              <TabsTrigger
                value="following"
                className={cn(
                  "px-4 sm:px-6 py-2 rounded-full transition-all duration-300",
                  "text-sm font-medium",
                  "data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#c9a962] data-[state=active]:to-[#b87333]",
                  "data-[state=active]:text-[#0a0f1a] data-[state=active]:font-bold data-[state=active]:shadow-lg",
                  "text-[#d4cfc4] hover:text-[#f5f0e8]"
                )}
              >
                <Users className="w-4 h-4 mr-1.5 sm:mr-2" />
                <span className="hidden xs:inline">Following</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Right Side: Search + View Toggle */}
          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className={cn(
              "relative hidden md:block transition-all duration-300",
              isSearchFocused ? "w-64" : "w-48"
            )}>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                type="text"
                placeholder="Search maps..."
                className={cn(
                  "w-full pl-9 pr-4 py-2 rounded-full text-sm",
                  "bg-white/5 border border-white/10",
                  "text-white placeholder:text-white/40",
                  "focus:border-[#c9a962]/50 focus:ring-2 focus:ring-[#c9a962]/20 focus:outline-none",
                  "transition-all duration-300"
                )}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
              />
            </div>

            {/* View Toggle */}
            <div className="hidden sm:flex items-center bg-white/5 border border-white/10 rounded-full p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  "p-2 rounded-full transition-all duration-200",
                  viewMode === 'grid'
                    ? "bg-[#c9a962]/20 text-[#c9a962]"
                    : "text-white/40 hover:text-white/60"
                )}
                title="Grid view"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  "p-2 rounded-full transition-all duration-200",
                  viewMode === 'list'
                    ? "bg-[#c9a962]/20 text-[#c9a962]"
                    : "text-white/40 hover:text-white/60"
                )}
                title="List view"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
