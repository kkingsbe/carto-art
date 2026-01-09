'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, TrendingUp, Users, LayoutGrid, List, Search, Palette, X, Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { styles } from '@/lib/styles';
import { motion, AnimatePresence } from 'framer-motion';

interface FeedFiltersProps {
  currentSort: 'fresh' | 'top' | 'following';
}

export function FeedFilters({ currentSort }: FeedFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isStyleFilterOpen, setIsStyleFilterOpen] = useState(false);

  const selectedStyles = searchParams.get('styles')?.split(',').filter(Boolean) || [];

  const handleSortChange = (sort: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('sort', sort);
    router.push(`${pathname}?${params.toString()}`);
  };

  const toggleStyle = (styleId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    let current = params.get('styles')?.split(',').filter(Boolean) || [];

    if (current.includes(styleId)) {
      current = current.filter(id => id !== styleId);
    } else {
      current.push(styleId);
    }

    if (current.length > 0) {
      params.set('styles', current.join(','));
    } else {
      params.delete('styles');
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const clearStyles = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('styles');
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

            <div className="w-px h-5 bg-white/10 hidden sm:block mx-1" />

            {/* Style Filter Button */}
            <button
              onClick={() => setIsStyleFilterOpen(!isStyleFilterOpen)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300",
                selectedStyles.length > 0
                  ? "bg-[#c9a962] text-[#0a0f1a]"
                  : "bg-white/5 border border-white/10 text-[#d4cfc4] hover:text-[#f5f0e8] hover:bg-white/10"
              )}
            >
              <Palette className="w-4 h-4" />
              <span>Styles</span>
              {selectedStyles.length > 0 && (
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#0a0f1a] text-[#c9a962] text-[10px] font-bold">
                  {selectedStyles.length}
                </span>
              )}
              <ChevronDown className={cn("w-4 h-4 transition-transform duration-300", isStyleFilterOpen && "rotate-180")} />
            </button>
          </div>
        </div>

        {/* Style Selection Drawer */}
        <AnimatePresence>
          {isStyleFilterOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-white/5"
            >
              <div className="py-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-[#f5f0e8]">Filter by Style</h4>
                  {selectedStyles.length > 0 && (
                    <button
                      onClick={clearStyles}
                      className="text-xs text-[#c9a962] hover:text-[#e5c985] font-medium"
                    >
                      Clear all
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {styles.map((style) => {
                    const isSelected = selectedStyles.includes(style.id);
                    const palette = style.defaultPalette;
                    const colors = [
                      palette.background,
                      (palette as any).roads?.primary || palette.primary || palette.text,
                      palette.water,
                      palette.greenSpace
                    ].filter(Boolean).slice(0, 4);

                    return (
                      <button
                        key={style.id}
                        onClick={() => toggleStyle(style.id)}
                        className={cn(
                          "group relative flex flex-col gap-2 p-2.5 text-left border rounded-xl transition-all duration-300",
                          isSelected
                            ? "border-[#c9a962] bg-[#c9a962]/10 shadow-[0_0_15px_rgba(201,169,98,0.1)]"
                            : "border-white/5 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.05]"
                        )}
                      >
                        {/* Swatches */}
                        <div className="flex gap-0.5 w-full">
                          {colors.map((color, idx) => (
                            <div
                              key={idx}
                              className="flex-1 h-6 rounded-sm border border-black/10"
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>

                        <div className="flex items-center justify-between gap-2 mt-1">
                          <span className={cn(
                            "text-[11px] font-bold truncate",
                            isSelected ? "text-[#c9a962]" : "text-[#d4cfc4]"
                          )}>
                            {style.name}
                          </span>
                          {isSelected && <Check className="w-3 h-3 text-[#c9a962] shrink-0" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
