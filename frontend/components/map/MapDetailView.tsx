'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { MapPreview } from './MapPreview';
import { PosterCanvas } from './PosterCanvas';
import { applyPaletteToStyle } from '@/lib/styles/applyPalette';
import { VoteButtons } from '@/components/voting/VoteButtons';
import { CommentList } from '@/components/comments/CommentList';
import { CommentForm } from '@/components/comments/CommentForm';
import { Button } from '@/components/ui/control-components';
import { Edit, Copy } from 'lucide-react';
import type { SavedMap } from '@/lib/actions/maps';
import type { Comment } from '@/lib/actions/comments';
import { setupMapLibreContour } from '@/lib/map/setup';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

// Initialize contour protocol
if (typeof window !== 'undefined') {
  setupMapLibreContour(maplibregl);
}

interface MapDetailViewProps {
  map: SavedMap;
  comments: Comment[];
  userVote: number | null;
  isOwner: boolean;
}

export function MapDetailView({ map, comments: initialComments, userVote, isOwner }: MapDetailViewProps) {
  const [comments, setComments] = useState(initialComments);

  const handleCommentAdded = (newComment: Comment) => {
    setComments([...comments, newComment]);
  };

  const handleCommentDeleted = (commentId: string) => {
    setComments(comments.filter(c => c.id !== commentId));
  };

  // Apply palette colors and visibility to the current map style
  const mapStyle = useMemo(() => {
    return applyPaletteToStyle(
      map.config.style.mapStyle,
      map.config.palette,
      map.config.layers,
      map.config.style.layerToggles
    );
  }, [map.config.style.mapStyle, map.config.palette, map.config.layers, map.config.style.layerToggles]);

  return (
    <div className="flex-1 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Map Preview */}
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {map.title}
              </h1>
              {map.subtitle && (
                <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
                  {map.subtitle}
                </p>
              )}

              <div className="mb-6 flex items-center justify-center">
                <PosterCanvas
                  config={map.config}
                  className="w-full max-w-2xl"
                  style={{
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                  }}
                >
                  <MapPreview
                    mapStyle={mapStyle}
                    location={map.config.location}
                    format={map.config.format}
                    showMarker={map.config.layers.marker}
                    markerColor={map.config.layers.markerColor || map.config.palette.primary || map.config.palette.accent || map.config.palette.text}
                    layers={map.config.layers}
                    layerToggles={map.config.style.layerToggles}
                  />
                </PosterCanvas>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <VoteButtons mapId={map.id} initialVote={userVote} initialScore={map.vote_score} />
                </div>

                <div className="flex items-center gap-2">
                  <Link href={`/editor?remix=${map.id}`}>
                    <Button variant="outline" size="sm">
                      <Copy className="w-4 h-4 mr-2" />
                      Edit Copy
                    </Button>
                  </Link>

                  {isOwner && (
                    <Link href="/profile">
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Comments Section */}
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Comments ({comments.length})
              </h2>

              <CommentForm mapId={map.id} onCommentAdded={handleCommentAdded} />

              <div className="mt-6">
                <CommentList
                  comments={comments}
                  onCommentDeleted={handleCommentDeleted}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

