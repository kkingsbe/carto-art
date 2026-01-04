'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { FollowButton } from './FollowButton';
import { getFollowers, getFollowing, SocialProfile } from '@/lib/actions/user';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

interface FollowListDialogProps {
    userId: string;
    initialTab?: 'followers' | 'following';
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function FollowListDialog({ userId, initialTab = 'followers', open, onOpenChange }: FollowListDialogProps) {
    const [activeTab, setActiveTab] = useState<'followers' | 'following'>(initialTab);
    const [profiles, setProfiles] = useState<SocialProfile[]>([]);
    const [loading, setLoading] = useState(false);

    // Reset tab when dialog opens
    useEffect(() => {
        if (open) {
            setActiveTab(initialTab);
        }
    }, [open, initialTab]);

    // Fetch data when tab or open status changes
    useEffect(() => {
        if (!open) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                const data = activeTab === 'followers'
                    ? await getFollowers(userId)
                    : await getFollowing(userId);
                setProfiles(data);
            } catch (error) {
                console.error('Failed to fetch social lists:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [open, activeTab, userId]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md h-[80vh] flex flex-col p-0 gap-0">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle className="text-center">
                        {activeTab === 'followers' ? 'Followers' : 'Following'}
                    </DialogTitle>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full flex-1 flex flex-col">
                    <div className="px-6 border-b border-border">
                        <TabsList className="w-full grid grid-cols-2">
                            <TabsTrigger value="followers">Followers</TabsTrigger>
                            <TabsTrigger value="following">Following</TabsTrigger>
                        </TabsList>
                    </div>

                    <div className="flex-1 overflow-hidden relative">
                        {loading ? (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : profiles.length === 0 ? (
                            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
                                No users found
                            </div>
                        ) : (
                            <ScrollArea className="h-full">
                                <div className="p-4 space-y-4">
                                    {profiles.map((profile) => (
                                        <div key={profile.id} className="flex items-center justify-between group">
                                            <Link
                                                href={`/user/${profile.username}`}
                                                onClick={() => onOpenChange(false)}
                                                className="flex items-center gap-3 flex-1 min-w-0"
                                            >
                                                <Avatar className="h-10 w-10 border border-border">
                                                    <AvatarImage src={profile.avatar_url || ''} />
                                                    <AvatarFallback>{profile.display_name?.[0] || profile.username[0]}</AvatarFallback>
                                                </Avatar>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium leading-none truncate">
                                                        {profile.display_name || profile.username}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground truncate">
                                                        @{profile.username}
                                                    </p>
                                                </div>
                                            </Link>

                                            {/* Don't show follow button for self */}
                                            {/* We'll need to pass current user ID prop if we want to hide it completely contextually, 
                          but FollowButton handles its own state. 
                          Ideally we don't show it if profile.id === currentUserId 
                      */}
                                            <FollowButton
                                                targetUserId={profile.id}
                                                isFollowing={profile.is_following}
                                                className="h-8 px-3 text-xs"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        )}
                    </div>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
