'use server';

import { createClient } from '@/lib/supabase/server';
import { createError } from '@/lib/errors/ServerActionError';
import { logger } from '@/lib/logger';
import { revalidatePath } from 'next/cache';

export type NotificationType = 'FOLLOW' | 'MAP_POST' | 'COMMENT' | 'LIKE' | 'PROFILE_VIEW';

export interface Notification {
    id: string;
    recipient_id: string;
    actor_id: string;
    type: NotificationType;
    resource_id: string | null;
    read_at: string | null;
    created_at: string;
    actor?: {
        username: string;
        display_name: string | null;
        avatar_url: string | null;
    };
    resource_name?: string; // e.g., map title
}

/**
 * Get notifications for the current user
 */
export async function getNotifications(limit = 20, offset = 0): Promise<Notification[]> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw createError.authRequired('You must be logged in to view notifications');
    }

    const { data, error } = await supabase
        .from('notifications')
        .select(`
            *,
            actor:profiles!notifications_actor_id_fkey (
                username,
                display_name,
                avatar_url
            )
        `)
        .eq('recipient_id', user.id)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

    if (error) {
        logger.error('Failed to fetch notifications:', error);
        throw createError.databaseError('Failed to fetch notifications');
    }

    // Enhance with resource names if applicable (optional optimization)
    // For now, let's keep it simple. If we need map titles, we can fetch them or include them in notifications table.
    // To avoid complex joins across different tables based on type, we can do a secondary fetch or denormalize.

    return data as any as Notification[];
}

/**
 * Get unread notification count
 */
export async function getUnreadNotificationCount(): Promise<number> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return 0;

    const { count, error } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('recipient_id', user.id)
        .is('read_at', null);

    if (error) {
        logger.error('Failed to fetch unread count:', error);
        return 0;
    }

    return count || 0;
}

/**
 * Mark a notification as read
 */
export async function markNotificationAsRead(notificationId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw createError.authRequired();
    }

    const { error } = await (supabase
        .from('notifications') as any)
        .update({ read_at: new Date().toISOString() })
        .eq('id', notificationId)
        .eq('recipient_id', user.id);

    if (error) {
        logger.error('Failed to mark notification as read:', error);
        throw createError.databaseError('Failed to update notification');
    }

    revalidatePath('/', 'layout');
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsAsRead() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw createError.authRequired();
    }

    const { error } = await (supabase
        .from('notifications') as any)
        .update({ read_at: new Date().toISOString() })
        .eq('recipient_id', user.id)
        .is('read_at', null);

    if (error) {
        logger.error('Failed to mark all notifications as read:', error);
        throw createError.databaseError('Failed to update notifications');
    }

    revalidatePath('/', 'layout');
}


