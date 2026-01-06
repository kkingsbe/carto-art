'use client';

import { ProfileStats, UserProfile } from '@/lib/actions/user';
import { FollowButton } from '@/components/profile/FollowButton';
import { Background3D } from '@/components/landing/3DBackground';
import { Calendar, Eye, Heart, Users, Sparkles } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import { FollowListDialog } from './FollowListDialog';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';

interface ProfileHeaderProps {
    profile: UserProfile;
    stats: ProfileStats;
    isOwnProfile: boolean;
}

export function ProfileHeader({ profile, stats, isOwnProfile }: ProfileHeaderProps) {
    const isPlusEnabled = useFeatureFlag('carto_plus');
    const [followDialogOpen, setFollowDialogOpen] = useState(false);
    const [activeFollowTab, setActiveFollowTab] = useState<'followers' | 'following'>('followers');

    const joinDate = new Date(profile.created_at).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric'
    });

    const openFollowList = (tab: 'followers' | 'following') => {
        setActiveFollowTab(tab);
        setFollowDialogOpen(true);
    };

    return (
        <div className="relative overflow-hidden mb-8">
            <FollowListDialog
                userId={profile.id}
                open={followDialogOpen}
                onOpenChange={setFollowDialogOpen}
                initialTab={activeFollowTab}
            />

            {/* Background Layer */}
            <div className="absolute inset-0 z-0 h-[500px] bg-gradient-to-b from-[#0a0f1a] to-[#0a0f1a]/50">
                <Background3D />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0a0f1a]" />
            </div>

            {/* Ambient Glow Effects */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse pointer-events-none" />
            <div className="absolute top-20 right-1/4 w-96 h-96 bg-[#c9a962]/10 rounded-full blur-3xl animate-pulse delay-1000 pointer-events-none" />

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24">
                <div className="glass-card rounded-2xl p-8 backdrop-blur-xl border border-white/5 bg-white/5">
                    <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
                        {/* Avatar */}
                        <div className="relative shrink-0">
                            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-[#c9a962]/20 shadow-[0_0_20px_rgba(201,169,98,0.2)] bg-[#0a0f1a]">
                                {profile.avatar_url ? (
                                    <Image
                                        src={profile.avatar_url}
                                        alt={profile.display_name || profile.username}
                                        fill
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-[#141d2e] text-[#c9a962] text-3xl font-bold">
                                        {(profile.display_name || profile.username || '?')[0].toUpperCase()}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Info */}
                        <div className="flex-grow min-w-0">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                                <div className="flex items-center gap-3">
                                    <h1 className="text-3xl md:text-4xl font-bold text-[#f5f0e8] truncate tracking-tight animate-fade-in">
                                        {profile.display_name || profile.username}
                                    </h1>
                                    {profile.subscription_tier === 'carto_plus' && isPlusEnabled && (
                                        <span
                                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-indigo-500/20 border border-white/10"
                                            title="Carto Plus Member"
                                        >
                                            <Sparkles className="w-3 h-3 fill-white" />
                                            Plus
                                        </span>
                                    )}
                                </div>
                                <p className="text-[#c9a962] font-medium tracking-wide">@{profile.username}</p>
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
                                    <div className="flex gap-3">
                                        <a
                                            href="/profile/orders"
                                            className="inline-flex items-center justify-center px-6 py-2.5 border border-[#c9a962]/30 rounded-full text-sm font-medium text-[#f5f0e8] hover:bg-[#c9a962]/10 hover:border-[#c9a962]/50 transition-all duration-300"
                                        >
                                            My Orders
                                        </a>
                                        <a
                                            href="/profile/edit"
                                            className="inline-flex items-center justify-center px-6 py-2.5 bg-[#c9a962]/10 text-[#c9a962] border border-[#c9a962]/20 rounded-full text-sm font-bold hover:bg-[#c9a962]/20 hover:border-[#c9a962]/40 transition-all duration-300"
                                        >
                                            Edit Profile
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="flex flex-wrap gap-4 md:gap-12 text-sm text-[#d4cfc4]/60 border-t border-white/5 pt-6 mt-2">
                            <div className="flex items-center gap-2 group" title="Total Map Views">
                                <div className="p-2 rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors">
                                    <Eye className="w-4 h-4 text-[#c9a962]" />
                                </div>
                                <div>
                                    <span className="block font-bold text-lg text-[#f5f0e8]">{stats.total_views.toLocaleString()}</span>
                                    <span className="text-xs uppercase tracking-wider">Map Views</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 group" title="Total Likes Received">
                                <div className="p-2 rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors">
                                    <Heart className="w-4 h-4 text-[#c9a962]" />
                                </div>
                                <div>
                                    <span className="block font-bold text-lg text-[#f5f0e8]">{stats.total_likes.toLocaleString()}</span>
                                    <span className="text-xs uppercase tracking-wider">Likes</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 group" title="Total Profile Visits">
                                <div className="p-2 rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors">
                                    <Eye className="w-4 h-4 text-[#c9a962]" />
                                </div>
                                <div>
                                    <span className="block font-bold text-lg text-[#f5f0e8]">{stats.profile_views.toLocaleString()}</span>
                                    <span className="text-xs uppercase tracking-wider">Profile Views</span>
                                </div>
                            </div>
                            <button
                                onClick={() => openFollowList('followers')}
                                className="flex items-center gap-2 group hover:bg-white/5 -ml-2 pl-2 pr-4 rounded-lg transition-colors text-left"
                            >
                                <div className="p-2 rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors">
                                    <Users className="w-4 h-4 text-[#c9a962]" />
                                </div>
                                <div>
                                    <span className="block font-bold text-lg text-[#f5f0e8] group-hover:text-white transition-colors">{stats.followers.toLocaleString()}</span>
                                    <span className="text-xs uppercase tracking-wider group-hover:text-[#c9a962] transition-colors">Followers</span>
                                </div>
                            </button>
                            <button
                                onClick={() => openFollowList('following')}
                                className="flex items-center gap-2 group hover:bg-white/5 -ml-2 pl-2 pr-4 rounded-lg transition-colors text-left"
                            >
                                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors">
                                    <span className="font-bold text-[#f5f0e8] group-hover:text-white transition-colors">{stats.following.toLocaleString()}</span>
                                    <span className="text-xs uppercase tracking-wider group-hover:text-[#c9a962] transition-colors">Following</span>
                                </div>
                            </button>
                        </div>

                        <div className="mt-6 flex flex-wrap gap-y-2 gap-x-6 text-xs text-[#d4cfc4]/40 font-mono">
                            <div className="flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5" />
                                MEMBER SINCE {joinDate.toUpperCase()}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
