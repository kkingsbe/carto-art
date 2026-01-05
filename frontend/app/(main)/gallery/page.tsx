import { FeedClient } from '@/components/feed/FeedClient';
import GalleryHero from '@/components/gallery/GalleryHero';
import { getSiteStats } from '@/lib/actions/stats';

export const metadata = {
  title: 'Community Map Gallery | Explore Custom Map Posters - Carto-Art',
  description: 'Browse thousands of stunning custom map posters created by our community. Get inspired by beautiful cartographic designs, terrain maps, and location art.',
  keywords: 'map gallery, community maps, custom poster examples, map inspiration, cartographic art gallery',
  openGraph: {
    title: 'Community Map Gallery - Carto-Art',
    description: 'Explore stunning custom map posters created by thousands of users worldwide.',
    type: 'website',
  },
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

