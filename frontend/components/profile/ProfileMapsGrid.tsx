'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Eye, Heart, Calendar } from 'lucide-react';
import type { SavedMap } from '@/lib/actions/maps';

interface ProfileMapsGridProps {
    maps: SavedMap[];
}

export function ProfileMapsGrid({ maps }: ProfileMapsGridProps) {
    if (maps.length === 0) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400">
                    This user hasn't published any maps yet.
                </p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {maps.map((map) => (
                <Link
                    key={map.id}
                    href={`/map/${map.id}`}
                    className="group block bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-all hover:ring-2 hover:ring-indigo-500/20"
                >
                    <div className="aspect-[2/3] relative bg-gray-100 dark:bg-gray-700">
                        {map.thumbnail_url ? (
                            <Image
                                src={map.thumbnail_url}
                                alt={map.title}
                                fill
                                className="object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <p className="text-gray-400 dark:text-gray-500 text-sm">No thumbnail</p>
                            </div>
                        )}

                        {/* Overlay stats on hover */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                    </div>

                    <div className="p-4">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-1 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {map.title}
                        </h3>
                        {map.subtitle && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 truncate">
                                {map.subtitle}
                            </p>
                        )}

                        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
                            <div className="flex items-center gap-3">
                                <span className="flex items-center gap-1">
                                    <Eye className="w-3.5 h-3.5" />
                                    {map.view_count || 0}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Heart className="w-3.5 h-3.5" />
                                    {map.vote_score || 0}
                                </span>
                            </div>
                            <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(map.published_at || map.created_at).toLocaleDateString()}
                            </span>
                        </div>
                    </div>
                </Link>
            ))}
        </div>
    );
}
