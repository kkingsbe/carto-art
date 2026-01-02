'use client';

import { useState, useTransition } from 'react';
import { followUser, unfollowUser } from '@/lib/actions/user';
import { useRouter } from 'next/navigation';
import { UserPlus, UserMinus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface FollowButtonProps {
    targetUserId: string;
    isFollowing: boolean;
    className?: string; // Allow minimal styling override
}

export function FollowButton({ targetUserId, isFollowing: initialIsFollowing, className = '' }: FollowButtonProps) {
    const [isPending, startTransition] = useTransition();
    const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
    const router = useRouter();

    const handleFollowToggle = () => {
        // Optimistic update
        setIsFollowing((prev) => !prev);

        startTransition(async () => {
            try {
                if (isFollowing) {
                    await unfollowUser(targetUserId);
                    toast.success('Unfollowed user');
                } else {
                    await followUser(targetUserId);
                    toast.success('Followed user');
                }
                router.refresh();
            } catch (error) {
                // Revert on error
                setIsFollowing((prev) => !prev);
                toast.error('Failed to update follow status');
            }
        });
    };

    return (
        <button
            onClick={handleFollowToggle}
            disabled={isPending}
            className={`
        inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all
        ${isFollowing
                    // Following state
                    ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-red-50 hover:text-red-600 border border-gray-200 dark:border-gray-700'
                    // Not following state
                    : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm hover:shadow'
                }
        ${isPending ? 'opacity-70 cursor-not-allowed' : ''}
        ${className}
      `}
        >
            {isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
            ) : isFollowing ? (
                <>
                    <span className="group-hover:hidden">Following</span>
                    <span className="hidden group-hover:inline flex items-center gap-1">
                        <UserMinus className="w-4 h-4" /> Unfollow
                    </span>
                </>
            ) : (
                <>
                    <UserPlus className="w-4 h-4" />
                    Follow
                </>
            )}
        </button>
    );
}
