'use client';

import { Notification, NotificationType } from '@/lib/actions/notifications';
import { formatDistanceToNow } from 'date-fns';
import { UserPlus, Heart, MessageSquare, Map as MapIcon, Circle } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface NotificationItemProps {
    notification: Notification;
    onRead?: (id: string) => void;
}

const typeConfig: Record<NotificationType, { icon: any, color: string, label: string }> = {
    FOLLOW: {
        icon: UserPlus,
        color: 'text-blue-500',
        label: 'followed you'
    },
    LIKE: {
        icon: Heart,
        color: 'text-rose-500',
        label: 'liked your map'
    },
    COMMENT: {
        icon: MessageSquare,
        color: 'text-emerald-500',
        label: 'commented on your map'
    },
    MAP_POST: {
        icon: MapIcon,
        color: 'text-amber-500',
        label: 'published a new map'
    }
};

export function NotificationItem({ notification, onRead }: NotificationItemProps) {
    const config = typeConfig[notification.type];
    const Icon = config.icon;
    const isUnread = !notification.read_at;

    const href = notification.type === 'FOLLOW'
        ? `/user/${notification.actor?.username}`
        : `/map/${notification.resource_id}`;

    return (
        <Link
            href={href}
            onClick={() => onRead?.(notification.id)}
            className={cn(
                "flex items-start gap-3 p-4 transition-colors hover:bg-muted/50 border-b border-border/50",
                isUnread && "bg-muted/30"
            )}
        >
            <div className="relative">
                <Avatar className="h-10 w-10 border border-border">
                    <AvatarImage src={notification.actor?.avatar_url || ''} />
                    <AvatarFallback>{notification.actor?.username?.[0]?.toUpperCase() || '?'}</AvatarFallback>
                </Avatar>
                <div className={cn(
                    "absolute -bottom-1 -right-1 rounded-full p-1 bg-background border border-border shadow-sm",
                    config.color
                )}>
                    <Icon className="h-3 w-3" />
                </div>
            </div>

            <div className="flex-1 space-y-1">
                <p className="text-sm leading-none">
                    <span className="font-semibold">{notification.actor?.display_name || notification.actor?.username}</span>
                    {' '}
                    <span className="text-muted-foreground">{config.label}</span>
                </p>
                <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                </p>
            </div>

            {isUnread && (
                <div className="mt-1">
                    <Circle className="h-2 w-2 fill-blue-600 text-blue-600" />
                </div>
            )}
        </Link>
    );
}
