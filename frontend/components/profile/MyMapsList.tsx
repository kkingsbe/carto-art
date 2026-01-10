'use client';

import { useState } from 'react';
import Link from 'next/link';
import Masonry from 'react-masonry-css';
import { Trash2, Edit, Eye, EyeOff, Map as MapIcon } from 'lucide-react';
import { Button } from '@/components/ui/control-components';
import { PublishModal } from './PublishModal';
import { MapCard } from '@/components/feed/MapCard';
import type { SavedMap, SavedMapSummary } from '@/lib/actions/maps';
import type { FeedMap } from '@/lib/actions/feed';

const myMapsBreakpointColumns = {
  default: 3,
  1280: 3,
  1024: 2,
  640: 1
};

interface MyMapsListProps {
  maps: SavedMap[] | SavedMapSummary[];
  userProfile: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
  onDelete: (id: string) => Promise<void>;
  onPublish: (id: string, subtitle?: string) => Promise<SavedMap>;
  onUnpublish: (id: string) => Promise<SavedMap>;
}

// Convert SavedMap to FeedMap for MapCard compatibility
function toFeedMap(map: SavedMap | SavedMapSummary, author: MyMapsListProps['userProfile']): FeedMap {
  return {
    id: map.id,
    title: map.title,
    subtitle: map.subtitle,
    thumbnail_url: map.thumbnail_url,
    vote_score: map.vote_score,
    view_count: map.view_count || 0,
    published_at: map.published_at || map.created_at,
    created_at: map.created_at,
    author: {
      username: author.username,
      display_name: author.display_name,
      avatar_url: author.avatar_url,
    },
  };
}

export function MyMapsList({ maps, userProfile, onDelete, onPublish, onUnpublish }: MyMapsListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [publishModalMap, setPublishModalMap] = useState<SavedMap | SavedMapSummary | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this map?')) return;

    setDeletingId(id);
    try {
      await onDelete(id);
    } catch (error) {
      console.error('Failed to delete map:', error);
      alert('Failed to delete map. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const handlePublishClick = (map: SavedMap | SavedMapSummary) => {
    setPublishModalMap(map);
  };

  const handlePublishConfirm = async (subtitle?: string) => {
    if (!publishModalMap) return;

    setPublishingId(publishModalMap.id);
    try {
      await onPublish(publishModalMap.id, subtitle);
      setPublishModalMap(null);
    } catch (error) {
      console.error('Failed to publish map:', error);
      throw error;
    } finally {
      setPublishingId(null);
    }
  };

  const handleUnpublish = async (id: string) => {
    setPublishingId(id);
    try {
      await onUnpublish(id);
    } catch (error) {
      console.error('Failed to unpublish map:', error);
      alert('Failed to unpublish map. Please try again.');
    } finally {
      setPublishingId(null);
    }
  };

  if (maps.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mb-6 animate-float">
          <MapIcon className="w-12 h-12 text-[#c9a962]/50" />
        </div>
        <h3 className="text-xl font-bold text-[#f5f0e8] mb-2">No Maps Yet</h3>
        <p className="text-[#d4cfc4]/60 max-w-md mb-8">
          You haven't created any maps yet. Start your journey by designing your first custom map poster.
        </p>
        <Link href="/editor">
          <Button className="bg-[#c9a962] text-[#0a0f1a] hover:bg-[#d4b472] border-none font-bold px-8 py-6 text-lg">
            Create Your First Map
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="w-full">
        <Masonry
          breakpointCols={myMapsBreakpointColumns}
          className="my-masonry-grid"
          columnClassName="my-masonry-grid_column"
        >
          {maps.map((map) => (
            <MapCard
              key={map.id}
              map={toFeedMap(map, userProfile)}
              actionSlot={
                <div className="flex items-center gap-3">
                  {map.is_published ? (
                    <div className="flex-1 flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => handleUnpublish(map.id)}
                        disabled={publishingId === map.id}
                        className="flex-1 border-white/20 bg-white/5 hover:bg-white/10 text-[#f5f0e8] h-10 rounded-xl"
                      >
                        <EyeOff className="w-4 h-4 mr-2" />
                        Unpublish
                      </Button>
                    </div>
                  ) : (
                    <div className="flex-1 flex gap-2">
                      <Link href={`/editor?map=${map.id}`} className="flex-1">
                        <Button variant="outline" className="w-full border-white/20 bg-white/5 hover:bg-white/10 text-[#f5f0e8] h-10 rounded-xl font-semibold">
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                      </Link>
                      <Button
                        variant="default"
                        onClick={() => handlePublishClick(map)}
                        disabled={publishingId === map.id}
                        className="flex-1 bg-[#c9a962] text-[#0a0f1a] hover:bg-[#d4b472] border-none font-bold h-10 rounded-xl"
                      >
                        {publishingId === map.id ? '...' : 'Publish'}
                      </Button>
                    </div>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(map.id)}
                    disabled={deletingId === map.id}
                    className="w-10 h-10 rounded-xl hover:bg-red-500/20 hover:text-red-400 text-[#d4cfc4]/30"
                  >
                    <Trash2 className="w-5 h-5" />
                  </Button>
                </div>
              }
            />
          ))}
        </Masonry>
      </div>

      {publishModalMap ? (
        <PublishModal
          isOpen={!!publishModalMap}
          onClose={() => setPublishModalMap(null)}
          mapTitle={publishModalMap.title}
          currentSubtitle={publishModalMap.subtitle}
          onPublish={handlePublishConfirm}
        />
      ) : null}
    </>
  );
}
