import { ProfileStats, UserProfile } from '@/lib/actions/user';
import { FollowButton } from '@/components/profile/FollowButton';
import { MapPin, Calendar, Eye, Heart, Users } from 'lucide-react';
import Image from 'next/image';

interface ProfileHeaderProps {
    profile: UserProfile;
    stats: ProfileStats;
    isOwnProfile: boolean;
}

export function ProfileHeader({ profile, stats, isOwnProfile }: ProfileHeaderProps) {
    const joinDate = new Date(profile.created_at).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric'
    });

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 mb-8">
            <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start md:items-center">
                {/* Avatar */}
                <div className="relative shrink-0">
                    <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-white dark:border-gray-700 bg-gray-100 dark:bg-gray-900 shadow-md">
                        {profile.avatar_url ? (
                            <Image
                                src={profile.avatar_url}
                                alt={profile.display_name || profile.username}
                                fill
                                className="object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-indigo-100 dark:bg-indigo-900 text-indigo-500 dark:text-indigo-300 text-3xl font-bold">
                                {(profile.display_name || profile.username || '?')[0].toUpperCase()}
                            </div>
                        )}
                    </div>
                </div>

                {/* Info */}
                <div className="flex-grow min-w-0">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white truncate">
                                {profile.display_name || profile.username}
                            </h1>
                            <p className="text-gray-500 dark:text-gray-400 font-medium">@{profile.username}</p>
                        </div>

                        {/* Action Buttons */}
                        <div>
                            {!isOwnProfile && (
                                <div className="group">
                                    <FollowButton
                                        targetUserId={profile.id}
                                        isFollowing={stats.is_following}
                                    />
                                </div>
                            )}
                            {isOwnProfile && (
                                <a
                                    href="/profile/edit" // Assuming we might add this later or it redirects to settings
                                    className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-full text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                >
                                    Edit Profile
                                </a>
                            )}
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="flex flex-wrap gap-4 md:gap-8 text-sm text-gray-600 dark:text-gray-300 border-t border-gray-100 dark:border-gray-700 pt-4 mt-2">
                        <div className="flex items-center gap-1.5" title="Total Map Views">
                            <Eye className="w-4 h-4 text-gray-400" />
                            <span className="font-semibold text-gray-900 dark:text-white">{stats.total_views.toLocaleString()}</span>
                            <span>Views</span>
                        </div>
                        <div className="flex items-center gap-1.5" title="Total Likes Received">
                            <Heart className="w-4 h-4 text-gray-400" />
                            <span className="font-semibold text-gray-900 dark:text-white">{stats.total_likes.toLocaleString()}</span>
                            <span>Likes</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Users className="w-4 h-4 text-gray-400" />
                            <span className="font-semibold text-gray-900 dark:text-white">{stats.followers.toLocaleString()}</span>
                            <span>Followers</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-gray-900 dark:text-white ml-5">{stats.following.toLocaleString()}</span>
                            <span>Following</span>
                        </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-y-2 gap-x-6 text-xs text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" />
                            Joined {joinDate}
                        </div>
                        {/* Placeholder for location if we add it later */}
                        {/* <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              Earth
            </div> */}
                    </div>
                </div>
            </div>
        </div>
    );
}
