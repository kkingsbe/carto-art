'use client';

import { useEffect, useState } from 'react';
import {
    Notification as NotificationData,
    getNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead
} from '@/lib/actions/notifications';
import { NotificationItem } from './NotificationItem';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCheck, BellOff, Bell } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface NotificationListProps {
    initialNotifications?: NotificationData[];
}

export function NotificationList({ initialNotifications }: NotificationListProps) {
    const [notifications, setNotifications] = useState<NotificationData[]>(initialNotifications || []);
    const [loading, setLoading] = useState(!initialNotifications);

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const data = await getNotifications();
                setNotifications(data);
            } catch (error) {
                console.error('Failed to fetch notifications:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchNotifications();
    }, []);

    const handleRead = async (id: string) => {
        // Optimistic update
        setNotifications(prev =>
            prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n)
        );
        await markNotificationAsRead(id);
    };

    const handleMarkAllRead = async () => {
        // Optimistic update
        setNotifications(prev =>
            prev.map(n => ({ ...n, read_at: new Date().toISOString() }))
        );
        await markAllNotificationsAsRead();
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-muted-foreground gap-2">
                <Loader2 className="h-6 w-6 animate-spin" />
                <p className="text-sm">Loading notifications...</p>
            </div>
        );
    }

    const unreadCount = notifications.filter(n => !n.read_at).length;

    return (
        <div className="flex flex-col h-[450px]">
            <div className="flex items-center justify-between px-4 py-2 border-b border-border shadow-sm">
                <h3 className="font-semibold text-sm">Notifications</h3>
                <div className="flex items-center gap-2">
                    {typeof Notification !== 'undefined' && Notification.permission === 'default' && (
                        <Button
                            variant="outline"
                            size="sm"
                            className="text-xs h-8 gap-1.5"
                            onClick={async () => {
                                const permission = await Notification.requestPermission();
                                if (permission !== 'default') {
                                    window.location.reload();
                                }
                            }}
                        >
                            <Bell className="h-3.5 w-3.5" />
                            Enable Desktop Notifications
                        </Button>
                    )}
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs h-8 gap-1.5 text-muted-foreground hover:text-foreground"
                            onClick={handleMarkAllRead}
                        >
                            <CheckCheck className="h-3.5 w-3.5" />
                            Mark all as read
                        </Button>
                    )}
                </div>
            </div>

            <ScrollArea className="flex-1">
                {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 text-muted-foreground gap-3 text-center h-full">
                        <div className="rounded-full bg-muted p-3">
                            <BellOff className="h-6 w-6" />
                        </div>
                        <div className="space-y-1">
                            <p className="font-semibold text-foreground">No notifications yet</p>
                            <p className="text-sm">We'll let you know when something happens!</p>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col">
                        {notifications.map((notification) => (
                            <NotificationItem
                                key={notification.id}
                                notification={notification}
                                onRead={handleRead}
                            />
                        ))}
                    </div>
                )}
            </ScrollArea>
        </div>
    );
}
