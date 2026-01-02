'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { MapPreview } from './MapPreview';
import { TextOverlay } from './TextOverlay';
import { applyPaletteToStyle } from '@/lib/styles/applyPalette';
import { getAspectRatioCSS } from '@/lib/styles/dimensions';
import { VoteButtons } from '@/components/voting/VoteButtons';
import { CommentList } from '@/components/comments/CommentList';
import { CommentForm } from '@/components/comments/CommentForm';
import { Button } from '@/components/ui/control-components';
import { ArrowLeft, Edit, EyeOff } from 'lucide-react';
import type { SavedMap } from '@/lib/actions/maps';
import type { Comment } from '@/lib/actions/comments';

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
        <Link href="/feed" className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Feed
        </Link>

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
                <div
                  className="relative shadow-2xl bg-white flex flex-col transition-all duration-300 ease-in-out ring-1 ring-black/5 w-full max-w-2xl"
                  style={{
                    aspectRatio: getAspectRatioCSS(map.config.format.aspectRatio, map.config.format.orientation),
                    backgroundColor: map.config.palette.background,
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                    containerType: 'size',
                  }}
                >
                  {/* The Map Window */}
                  <div
                    className="absolute overflow-hidden min-h-0 min-w-0"
                    style={{
                      top: `${map.config.format.margin}cqw`,
                      left: `${map.config.format.margin}cqw`,
                      right: `${map.config.format.margin}cqw`,
                      bottom: `${map.config.format.margin}cqw`,
                      borderRadius: (map.config.format.maskShape || 'rectangular') === 'circular' ? '50%' : '0',
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
                  </div>

                  {/* Text Overlay */}
                  <TextOverlay config={map.config} />

                  {/* Border Overlay - Now drawn AFTER TextOverlay to stay on top of gradients */}
                  {map.config.format.borderStyle !== 'none' && (
                    <div
                      className="absolute pointer-events-none z-30"
                      style={{
                        top: `${map.config.format.margin}cqw`,
                        left: `${map.config.format.margin}cqw`,
                        right: `${map.config.format.margin}cqw`,
                        bottom: `${map.config.format.margin}cqw`,
                        padding: map.config.format.borderStyle === 'inset' ? '2cqw' : '0',
                      }}
                    >
                      <div
                        className="w-full h-full"
                        style={{
                          border: `${map.config.format.borderStyle === 'thick' ? '1.5cqw' : '0.5cqw'
                            } solid ${map.config.palette.accent || map.config.palette.text}`,
                          borderRadius: (map.config.format.maskShape || 'rectangular') === 'circular' ? '50%' : '0',
                        }}
                      />

                      {/* Compass Rose Preview (SVG) */}
                      {(map.config.format.maskShape || 'rectangular') === 'circular' && map.config.format.compassRose && (
                        <svg
                          className="absolute"
                          style={{
                            pointerEvents: 'none',
                            overflow: 'visible',
                            top: '-4cqw',
                            left: '-4cqw',
                            right: '-4cqw',
                            bottom: '-4cqw',
                            width: 'calc(100% + 8cqw)',
                            height: 'calc(100% + 8cqw)',
                          }}
                          viewBox="0 0 100 100"
                        >
                          <g
                            stroke={map.config.palette.accent || map.config.palette.text}
                            fill={map.config.palette.accent || map.config.palette.text}
                            strokeWidth="0.15"
                            opacity="0.8"
                          >
                            {/* Draw 8 main directions */}
                            {[
                              { angle: 0, label: 'N' },
                              { angle: 45, label: 'NE' },
                              { angle: 90, label: 'E' },
                              { angle: 135, label: 'SE' },
                              { angle: 180, label: 'S' },
                              { angle: 225, label: 'SW' },
                              { angle: 270, label: 'W' },
                              { angle: 315, label: 'NW' },
                            ].map(({ angle, label }) => {
                              const rad = ((angle - 90) * Math.PI) / 180;
                              const centerX = 50;
                              const centerY = 50;
                              // Border is at the edge of the original 100x100 viewBox
                              // Position ticks starting at the border edge
                              const borderOuterRadius = 49.5; // Outer edge of border in 100x100 coordinate system
                              const tickLen = label === 'N' || label === 'S' || label === 'E' || label === 'W' ? 1.2 : 0.6;
                              // Ticks start at the border edge and extend outward
                              const tickStartRadius = borderOuterRadius;
                              const tickEndRadius = borderOuterRadius + tickLen;

                              const x1 = centerX + Math.cos(rad) * tickStartRadius;
                              const y1 = centerY + Math.sin(rad) * tickStartRadius;
                              const x2 = centerX + Math.cos(rad) * tickEndRadius;
                              const y2 = centerY + Math.sin(rad) * tickEndRadius;

                              // Position labels further out from the border
                              const labelRadius = borderOuterRadius + tickLen + 1.0;
                              const labelX = centerX + Math.cos(rad) * labelRadius;
                              const labelY = centerY + Math.sin(rad) * labelRadius;

                              return (
                                <g key={angle}>
                                  <line x1={x1} y1={y1} x2={x2} y2={y2} />
                                  <text
                                    x={labelX}
                                    y={labelY}
                                    fontSize="1.2"
                                    fontWeight="bold"
                                    textAnchor="middle"
                                    dominantBaseline="middle"
                                    opacity={label === 'N' || label === 'S' || label === 'E' || label === 'W' ? 1 : 0.7}
                                  >
                                    {label}
                                  </text>
                                </g>
                              );
                            })}

                            {/* Draw intermediate ticks */}
                            {Array.from({ length: 24 }, (_, i) => {
                              if (i % 3 === 0) return null; // Skip positions where we have main directions
                              const angle = (i * 15 - 90) * (Math.PI / 180);
                              const centerX = 50;
                              const centerY = 50;
                              const borderOuterRadius = 49.5;
                              const tickLen = 0.4;
                              // Ticks start at the border edge and extend outward
                              const tickStartRadius = borderOuterRadius;
                              const tickEndRadius = borderOuterRadius + tickLen;

                              const x1 = centerX + Math.cos(angle) * tickStartRadius;
                              const y1 = centerY + Math.sin(angle) * tickStartRadius;
                              const x2 = centerX + Math.cos(angle) * tickEndRadius;
                              const y2 = centerY + Math.sin(angle) * tickEndRadius;

                              return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} opacity="0.6" />;
                            })}
                          </g>
                        </svg>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <VoteButtons mapId={map.id} initialVote={userVote} initialScore={map.vote_score} />
                </div>

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

