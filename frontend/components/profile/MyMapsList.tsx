'use client';

import { useState } from 'react';
import Link from 'next/link';
import Masonry from 'react-masonry-css';
import { Trash2, Edit, Eye, EyeOff, Map as MapIcon } from 'lucide-react';
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
                <div className="flex items-center gap-2 mt-2">
                  {map.is_published ? (
                    <>
                      <Link href={`/map/${map.id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full border-white/20 bg-white/5 hover:bg-white/10 text-[#f5f0e8]">
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUnpublish(map.id)}
                        disabled={publishingId === map.id}
                        className="border-white/20 bg-white/5 hover:bg-white/10 text-[#f5f0e8]"
                      >
                        <EyeOff className="w-4 h-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Link href={`/editor?mapId=${map.id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full border-white/20 bg-white/5 hover:bg-white/10 text-[#f5f0e8]">
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                      </Link>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handlePublishClick(map)}
                        disabled={publishingId === map.id}
                        className="bg-[#c9a962] text-[#0a0f1a] hover:bg-[#d4b472] border-none font-bold"
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
                    className="hover:bg-red-500/20 hover:text-red-400 text-[#d4cfc4]/50"
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
