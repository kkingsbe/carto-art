'use client';

import { useState } from 'react';
import Link from 'next/link';
import Masonry from 'react-masonry-css';
import { Trash2, Edit, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/control-components';
import { PublishModal } from './PublishModal';
import { MapCard } from '@/components/feed/MapCard';
import type { SavedMap } from '@/lib/actions/maps';
import type { FeedMap } from '@/lib/actions/feed';

const myMapsBreakpointColumns = {
  default: 3,
  1280: 3,
  1024: 2,
  640: 1
};

interface MyMapsListProps {
  maps: SavedMap[];
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
function toFeedMap(map: SavedMap, author: MyMapsListProps['userProfile']): FeedMap {
  return {
    id: map.id,
    title: map.title,
    subtitle: map.subtitle,
    thumbnail_url: map.thumbnail_url,
    vote_score: map.vote_score,
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
  const [publishModalMap, setPublishModalMap] = useState<SavedMap | null>(null);

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

  const handlePublishClick = (map: SavedMap) => {
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
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400 mb-4">
          You haven't saved any maps yet.
        </p>
        <Link href="/editor">
          <Button>Create Your First Map</Button>
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
                <div className="flex items-center gap-2">
                  {map.is_published ? (
                    <>
                      <Link href={`/map/${map.id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full">
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUnpublish(map.id)}
                        disabled={publishingId === map.id}
                      >
                        <EyeOff className="w-4 h-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Link href={`/editor?mapId=${map.id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full">
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                      </Link>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handlePublishClick(map)}
                        disabled={publishingId === map.id}
                      >
                        {publishingId === map.id ? 'Publishing...' : 'Publish'}
                      </Button>
                    </>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(map.id)}
                    disabled={deletingId === map.id}
                  >
                    <Trash2 className="w-4 h-4" />
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
