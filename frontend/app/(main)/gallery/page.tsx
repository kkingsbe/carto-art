import { FeedClient } from '@/components/feed/FeedClient';
import GalleryHero from '@/components/gallery/GalleryHero';
import { getSiteStats } from '@/lib/actions/stats';

export const metadata = {
  title: 'Community Gallery | Carto Art',
  description: 'Discover stunning map posters created by the community. Browse and get inspired by beautiful cartographic designs.',
};

interface GalleryPageProps {
  searchParams: Promise<{ sort?: 'fresh' | 'top' | 'following' }>;
}

export default async function GalleryPage({ searchParams }: GalleryPageProps) {
  const params = await searchParams;
  const sort = (params.sort || 'fresh') as 'fresh' | 'top' | 'following';
  const stats = await getSiteStats();

  return (
    <>
      {/* Hero Section */}
      <GalleryHero stats={stats} />

      {/* Filter Bar + Content */}
      <div className="min-h-screen bg-[#0a0f1a]">
        <FeedClient initialSort={sort} />
      </div>
    </>
  );
}

