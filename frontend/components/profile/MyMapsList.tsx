'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Trash2, Edit, Eye, EyeOff, Calendar, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/control-components';
import { PublishModal } from './PublishModal';
import type { SavedMap } from '@/lib/actions/maps';

interface MyMapsListProps {
  maps: SavedMap[];
  onDelete: (id: string) => Promise<void>;
  onPublish: (id: string, subtitle?: string) => Promise<SavedMap>;
  onUnpublish: (id: string) => Promise<SavedMap>;
}

export function MyMapsList({ maps, onDelete, onPublish, onUnpublish }: MyMapsListProps) {
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
      // Error is handled by modal
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {maps.map((map) => (
        <div
          key={map.id}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow"
        >
          {map.thumbnail_url ? (
            <Link href={`/map/${map.id}`}>
              <div className="aspect-[2/3] relative bg-gray-100 dark:bg-gray-700">
                <Image
                  src={map.thumbnail_url}
                  alt={map.title}
                  fill
                  className="object-cover"
                />
              </div>
            </Link>
          ) : (
            <Link href={`/map/${map.id}`}>
              <div className="aspect-[2/3] bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                <p className="text-gray-400 dark:text-gray-500 text-sm">No thumbnail</p>
              </div>
            </Link>
          )}
          
          <div className="p-4">
            <Link href={`/map/${map.id}`}>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1 hover:text-blue-600 dark:hover:text-blue-400">
                {map.title}
              </h3>
            </Link>
            {map.subtitle && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                {map.subtitle}
              </p>
            )}
            
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-4">
              <Calendar className="w-3 h-3" />
              <span>
                {new Date(map.updated_at).toLocaleDateString()}
              </span>
              {map.is_published && (
                <>
                  <TrendingUp className="w-3 h-3 ml-2" />
                  <span>{map.vote_score} votes</span>
                </>
              )}
            </div>
            
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
          </div>
        </div>
      ))}
      
      {publishModalMap && (
        <PublishModal
          isOpen={!!publishModalMap}
          onClose={() => setPublishModalMap(null)}
          mapTitle={publishModalMap.title}
          currentSubtitle={publishModalMap.subtitle}
          onPublish={handlePublishConfirm}
        />
      )}
    </div>
  );
}

