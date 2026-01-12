'use client';

import { ProfileStats, UserProfile } from '@/lib/actions/user';
import { FollowButton } from '@/components/profile/FollowButton';
import { Background3D } from '@/components/landing/3DBackground';
import { Calendar, Eye, Heart, Users, Sparkles, Map } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import { FollowListDialog } from './FollowListDialog';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';
import { cn } from '@/lib/utils';

interface ProfileHeaderProps {
    profile: UserProfile;
    stats: ProfileStats;
    isOwnProfile: boolean;
}

export function ProfileHeader({ profile, stats, isOwnProfile }: ProfileHeaderProps) {
    const isPlusEnabled = useFeatureFlag('carto_plus');
    const isEcommerceEnabled = useFeatureFlag('ecommerce');
    const [followDialogOpen, setFollowDialogOpen] = useState(false);
    const [activeFollowTab, setActiveFollowTab] = useState<'followers' | 'following'>('followers');

    const isPlusMember = profile.subscription_tier === 'carto_plus' && isPlusEnabled;

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

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-12">
                <div className={cn(
                    "glass-card rounded-3xl p-8 backdrop-blur-2xl border transition-all duration-500 relative z-10 overflow-hidden group",
                    isPlusMember
                        ? "border-[#c9a962]/20 bg-gradient-to-br from-[#c9a962]/10 via-[#0a0f1a]/80 to-[#0a0f1a]/90 shadow-[0_0_50px_-10px_rgba(201,169,98,0.15)]"
                        : "border-white/10 bg-gradient-to-br from-white/10 via-[#0a0f1a]/80 to-[#0a0f1a]/90"
                )}>
                    {/* Subtle grain/noise texture overlay could go here if we had the asset */}
                    <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-50 pointer-events-none" />
                    <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-center md:items-start text-center md:text-left">
                        {/* Avatar */}
                        <div className="relative shrink-0">
                            <div className={cn(
                                "w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-4 shadow-2xl transition-all duration-500 bg-[#0a0f1a] mx-auto md:mx-0 relative z-20",
                                isPlusMember
                                    ? "border-[#c9a962] shadow-[0_0_40px_rgba(201,169,98,0.3)] ring-4 ring-[#c9a962]/20 ring-offset-4 ring-offset-[#0a0f1a]"
                                    : "border-white/10 shadow-[0_0_30px_rgba(255,255,255,0.05)]"
                            )}>
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
                            {isPlusMember && (
                                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-gradient-to-r from-[#c9a962] to-[#f4e4bc] text-[#0a0f1a] text-[10px] font-bold uppercase tracking-wider shadow-lg border border-white/20 whitespace-nowrap">
                                    Premium
                                </div>
                            )}
                        </div>

                        {/* Info */}
                        <div className="flex-grow min-w-0 w-full">
                            <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-4 mb-6">
                                <div>
                                    <div className="flex items-center justify-center md:justify-start gap-3 mb-1">
                                        <h1 className="text-3xl md:text-4xl font-bold text-[#f5f0e8] truncate tracking-tight">
                                            {profile.display_name || profile.username}
                                        </h1>
                                        {isPlusMember && (
                                            <span
                                                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 bg-[length:200%_auto] animate-gradient text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-indigo-500/20 border border-white/10"
                                                title="Carto Plus Member"
                                            >
                                                <Sparkles className="w-3 h-3 fill-white" />
                                                Plus
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center justify-center md:justify-start gap-4 text-sm">
                                        <p className="text-[#c9a962] font-medium tracking-wide">@{profile.username}</p>
                                        <div className="w-1 h-1 rounded-full bg-white/20" />
                                        <div className="flex items-center gap-1.5 text-white/40">
                                            <Calendar className="w-3.5 h-3.5" />
                                            <span className="uppercase tracking-wide text-xs font-bold">Member Since {joinDate}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-3 shrink-0 w-full md:w-auto justify-center">
                                    {!isOwnProfile && (
                                        <div className="group w-full md:w-auto">
                                            <FollowButton
                                                targetUserId={profile.id}
                                                isFollowing={stats.is_following}
                                            />
                                        </div>
                                    )}
                                    {isOwnProfile && (
                                        <>
                                            {isEcommerceEnabled && (
                                                <a
                                                    href="/profile/orders"
                                                    className="inline-flex flex-1 md:flex-none items-center justify-center px-6 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm font-medium text-[#f5f0e8] hover:bg-white/10 hover:border-white/20 hover:scale-105 active:scale-95 transition-all duration-300"
                                                >
                                                    My Orders
                                                </a>
                                            )}

                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Stats Row - Grid for stability */}
                            <div className="mt-10 pt-8 border-t border-white/5 grid grid-cols-2 md:grid-cols-5 gap-y-8 gap-x-4">
                                {/* Map Views */}
                                <div className="flex flex-col items-center md:items-start group">
                                    <div className="flex items-center gap-2 mb-2 text-white/40 group-hover:text-[#c9a962] transition-colors">
                                        <Map className="w-4 h-4" />
                                        <span className="text-[10px] font-bold uppercase tracking-widest">Map Views</span>
                                    </div>
                                    <span className="text-3xl font-bold text-[#f5f0e8] tracking-tight">{stats.total_views.toLocaleString()}</span>
                                </div>

                                {/* Likes */}
                                <div className="flex flex-col items-center md:items-start group">
                                    <div className="flex items-center gap-2 mb-2 text-white/40 group-hover:text-[#c9a962] transition-colors">
                                        <Heart className="w-4 h-4" />
                                        <span className="text-[10px] font-bold uppercase tracking-widest">Likes</span>
                                    </div>
                                    <span className="text-3xl font-bold text-[#f5f0e8] tracking-tight">{stats.total_likes.toLocaleString()}</span>
                                </div>

                                {/* Profile Views */}
                                <div className="flex flex-col items-center md:items-start group">
                                    <div className="flex items-center gap-2 mb-2 text-white/40 group-hover:text-[#c9a962] transition-colors">
                                        <Eye className="w-4 h-4" />
                                        <span className="text-[10px] font-bold uppercase tracking-widest">Profile Views</span>
                                    </div>
                                    <span className="text-3xl font-bold text-[#f5f0e8] tracking-tight">{stats.profile_views.toLocaleString()}</span>
                                </div>

                                {/* Followers */}
                                <button
                                    onClick={() => openFollowList('followers')}
                                    className="flex flex-col items-center md:items-start group hover:opacity-80 transition-opacity"
                                >
                                    <div className="flex items-center gap-2 mb-2 text-white/40 group-hover:text-[#c9a962] transition-colors">
                                        <Users className="w-4 h-4" />
                                        <span className="text-[10px] font-bold uppercase tracking-widest">Followers</span>
                                    </div>
                                    <span className="text-3xl font-bold text-[#f5f0e8] tracking-tight">{stats.followers.toLocaleString()}</span>
                                </button>

                                {/* Following */}
                                <button
                                    onClick={() => openFollowList('following')}
                                    className="flex flex-col items-center md:items-start group hover:opacity-80 transition-opacity"
                                >
                                    <div className="flex items-center gap-2 mb-2 text-white/40 group-hover:text-[#c9a962] transition-colors">
                                        <Users className="w-4 h-4" />
                                        <span className="text-[10px] font-bold uppercase tracking-widest">Following</span>
                                    </div>
                                    <span className="text-3xl font-bold text-[#f5f0e8] tracking-tight">{stats.following.toLocaleString()}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
