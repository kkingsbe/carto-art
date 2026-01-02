'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/control-components';
import { Clock, TrendingUp } from 'lucide-react';

interface FeedFiltersProps {
  currentSort: 'fresh' | 'top';
}

export function FeedFilters({ currentSort }: FeedFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const handleSortChange = (sort: 'fresh' | 'top') => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('sort', sort);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="mb-6 flex gap-2">
      <Button
        variant={currentSort === 'fresh' ? 'default' : 'outline'}
        onClick={() => handleSortChange('fresh')}
      >
        <Clock className="w-4 h-4 mr-2" />
        Fresh
      </Button>
      <Button
        variant={currentSort === 'top' ? 'default' : 'outline'}
        onClick={() => handleSortChange('top')}
      >
        <TrendingUp className="w-4 h-4 mr-2" />
        Top
      </Button>
    </div>
  );
}

