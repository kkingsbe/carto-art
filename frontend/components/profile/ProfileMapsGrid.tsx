'use client';

import { MapCard } from '@/components/feed/MapCard';
import type { SavedMap } from '@/lib/actions/maps';
import type { FeedMap } from '@/lib/actions/feed';

interface ProfileMapsGridProps {
    maps: SavedMap[];
    profile: {
        username: string;
        display_name: string | null;
        avatar_url: string | null;
    };
}

function toFeedMap(map: SavedMap, user: ProfileMapsGridProps['profile']): FeedMap {
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
            username: user.username,
            display_name: user.display_name,
            avatar_url: user.avatar_url,
        },
    };
}

export function ProfileMapsGrid({ maps, profile }: ProfileMapsGridProps) {
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
                <MapCard
                    key={map.id}
                    map={toFeedMap(map, profile)}
                />
            ))}
        </div>
    );
}
