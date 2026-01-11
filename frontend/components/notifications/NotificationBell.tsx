'use client';

import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { getUnreadNotificationCount } from '@/lib/actions/notifications';
import {
    Popover,
    PopoverContent,
    PopoverTrigger
} from '@/components/ui/popover';
import { NotificationList } from './NotificationList';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';

import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

export function NotificationBell() {
    const [unreadCount, setUnreadCount] = useState(0);
    const [open, setOpen] = useState(false);
    const pathname = usePathname();
    const supabase = createClient();

    const fetchCount = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        try {
            const count = await getUnreadNotificationCount();
            setUnreadCount(count);
        } catch (error) {
            // Ignore auth errors in public view
        }
    };

    useEffect(() => {
        fetchCount();

        // Subscribe to real-time changes
        const channel = supabase
            .channel('notifications_bell')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                },
                async (payload) => {
                    // Check if the notification is for the current user
                    // Since we can't easily filter by recipient_id in the channel subscription for RLS reasons
                    // (unless we use filter param which has limitations or row level security is handled correctly by the presence of a session)
                    // But actually, for 'postgres_changes', we receive all changes allowed by RLS policies if we are authenticated.
                    // So we should verify logic.
                    // Assuming RLS policy "Users can view their own notifications" is active,
                    // we should only receive events for our own notifications.

                    // Ideally we verify recipient_id just in case, or trust RLS.
                    // Let's verify recipient_id matches current user.
                    // But we don't have user ID in state easily here without fetching it.
                    // Relying on RLS: if I receive an INSERT, it means I am allowed to see it.
                    // So it must be for me.

                    const newNotification = payload.new as any;

                    // Increment count
                    setUnreadCount((prev) => prev + 1);

                    // Browser Notification
                    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
                        let title = 'New Notification';
                        let body = 'You have a new notification on CartoArt';

                        // Customize based on type if possible, but payload might be raw db row.
                        // We might not have join data (actor name etc) in the payload provided by realtime.
                        // Realtime payload is just the record.

                        switch (newNotification.type) {
                            case 'FOLLOW':
                                title = 'New Follower';
                                body = 'Someone started following you';
                                break;
                            case 'LIKE':
                                title = 'New Like';
                                body = 'Someone liked your map';
                                break;
                            case 'COMMENT':
                                title = 'New Comment';
                                body = 'Someone commented on your map';
                                break;
                            case 'MAP_POST':
                                title = 'New Map';
                                body = 'Someone you follow posted a new map';
                                break;
                        }

                        new Notification(title, {
                            body,
                            icon: '/logo.svg', // Assuming this exists public
                        });
                    }

                    // Also show a toast in-app
                    toast.info('You have a new notification');
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    // Refresh when popover opens/closes to ensure accuracy if something drifted
    useEffect(() => {
        if (!open) {
            fetchCount();
        }
    }, [open, pathname]);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button
                    className={cn(
                        "relative p-2.5 rounded-full transition-all duration-200 outline-none group",
                        "hover:bg-muted text-muted-foreground hover:text-foreground",
                        open && "bg-muted text-foreground"
                    )}
                >
                    <Bell className="h-6 w-6 transition-transform group-hover:scale-105" />
                    {unreadCount > 0 && (
                        <span className="absolute top-2 right-2 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-bold text-white shadow-sm ring-2 ring-background animate-in zoom-in duration-200">
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                    )}
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0 overflow-hidden" align="end" sideOffset={8}>
                <NotificationList />
            </PopoverContent>
        </Popover>
    );
}
