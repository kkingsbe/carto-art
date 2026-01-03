'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, TrendingUp } from 'lucide-react';

interface FeedFiltersProps {
  currentSort: 'fresh' | 'top';
}

export function FeedFilters({ currentSort }: FeedFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const handleSortChange = (sort: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('sort', sort);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="sticky top-0 z-40 backdrop-blur-xl bg-[#0a0f1a]/80 border-b border-white/5">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Tabs value={currentSort} onValueChange={handleSortChange} className="w-full">
          <TabsList className="bg-white/5 border border-white/10 p-1 rounded-full w-auto inline-flex">
            <TabsTrigger
              value="fresh"
              className="px-6 py-2.5 rounded-full data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#c9a962] data-[state=active]:to-[#b87333] data-[state=active]:text-[#0a0f1a] data-[state=active]:font-bold text-[#d4cfc4] hover:text-[#f5f0e8] transition-all duration-300"
            >
              <Clock className="w-4 h-4 mr-2" />
              Fresh
            </TabsTrigger>
            <TabsTrigger
              value="top"
              className="px-6 py-2.5 rounded-full data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#c9a962] data-[state=active]:to-[#b87333] data-[state=active]:text-[#0a0f1a] data-[state=active]:font-bold text-[#d4cfc4] hover:text-[#f5f0e8] transition-all duration-300"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Top Rated
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    </div>
  );
}

