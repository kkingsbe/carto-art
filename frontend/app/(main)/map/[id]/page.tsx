import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getMapById } from '@/lib/actions/maps';
import { getComments } from '@/lib/actions/comments';
import { getUserVote } from '@/lib/actions/votes';
import { MapDetailView } from '@/components/map/MapDetailView';
import type { PosterConfig } from '@/types/poster';

interface MapDetailPageProps {
  params: Promise<{ id: string }>;
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
    <MapDetailView
      map={map}
      comments={comments}
      userVote={userVote}
      isOwner={user?.id === map.user_id}
    />
  );
}

