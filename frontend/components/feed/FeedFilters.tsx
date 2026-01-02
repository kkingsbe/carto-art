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
    <div className="sticky top-0 z-10 backdrop-blur-lg bg-gray-50/80 dark:bg-gray-900/80 border-b border-gray-200/50 dark:border-gray-700/50">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <Tabs value={currentSort} onValueChange={handleSortChange}>
          <TabsList>
            <TabsTrigger
              value="fresh"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#c9a962] data-[state=active]:to-[#b87333] data-[state=active]:text-[#0a0f1a] transition-all duration-300 hover:scale-[1.02]"
            >
              <Clock className="w-4 h-4 mr-2" />
              Fresh
            </TabsTrigger>
            <TabsTrigger
              value="top"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#c9a962] data-[state=active]:to-[#b87333] data-[state=active]:text-[#0a0f1a] transition-all duration-300 hover:scale-[1.02]"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Top
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    </div>
  );
}

