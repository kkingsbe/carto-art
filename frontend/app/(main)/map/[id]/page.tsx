import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getMapById } from '@/lib/actions/maps';
import { getComments } from '@/lib/actions/comments';
import { getUserVote } from '@/lib/actions/votes';
import { MapDetailView } from '@/components/map/MapDetailView';
import { ViewTracker } from '@/components/analytics/ViewTracker';
import type { PosterConfig } from '@/types/poster';
import type { Metadata } from 'next';

interface MapDetailPageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: MapDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const map = await getMapById(id);

  if (!map) {
    return {
      title: 'Map Not Found - Carto-Art',
      description: 'This map could not be found.',
    };
  }

  // Fallback chain: map.title → config.location.name → "Custom Map Poster"
  const mapTitle = map.title || map.config?.location?.name || 'Custom Map Poster';
  const title = `${mapTitle} | Carto-Art`;

  // Fallback chain for description: map.subtitle → config.location.subtitle → generic
  const description = map.subtitle
    || map.config?.location?.subtitle
    || `A custom map poster of ${mapTitle} created on Carto-Art`;

  return {
    title,
    description,
    openGraph: {
      title: mapTitle,
      description,
      url: `/map/${id}`,
      locale: 'en_US',
      type: 'article',
      images: map.thumbnail_url
        ? [
          {
            url: map.thumbnail_url,
            width: 1200,
            height: 630,
            alt: mapTitle,
          },
        ]
        : [
          {
            url: '/hero.jpg',
            width: 1200,
            height: 630,
            alt: 'Carto-Art Custom Map Poster',
          },
        ],
    },
    twitter: {
      card: 'summary_large_image',
      title: mapTitle,
      description,
      images: map.thumbnail_url ? [map.thumbnail_url] : ['/hero.jpg'],
    },
  };
}

export default async function MapDetailPage({ params }: MapDetailPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const map = await getMapById(id);

  if (!map) {
    notFound();
  }

  // Only published maps are accessible to non-owners
  if (!map.is_published && map.user_id !== user?.id) {
    redirect('/login?redirect=/map/' + id);
  }

  const [comments, userVote] = await Promise.all([
    getComments(id),
    user ? getUserVote(id) : Promise.resolve(null),
  ]);

  return (
    <div className="relative">
      <ViewTracker type="map" id={id} />
      <MapDetailView
        map={map}
        comments={comments}
        userVote={userVote}
        isOwner={user?.id === map.user_id}
      />
    </div>
  );
}

