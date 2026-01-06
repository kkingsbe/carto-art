import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

export interface AnalyticsReport {
    views: number;
    sessions: number;
    activeUsers: number;
    topPages: Array<{ url: string; views: number }>;
}

export interface RealtimeAnalyticsReport {
    activeUsers: number;
    pages: Array<{ path: string; activeUsers: number }>;
}

/**
 * Fetch core metrics for the last 30 days using internal page_events.
 */
export async function getCoreTrafficStats(): Promise<AnalyticsReport> {
    try {
        const supabase = await createClient();

        const { data, error } = await supabase.rpc('get_analytics_summary', {
            interval_days: 30
        } as any);

        if (error) {
            logger.error('Failed to fetch analytics summary:', error);
            throw new Error(`Analytics Error: ${error.message}`);
        }

        // Handle case where RPC might return null or missing fields
        return {
            views: Number(data?.views || 0),
            sessions: Number(data?.sessions || 0),
            activeUsers: Number(data?.activeUsers || 0),
            topPages: data?.topPages || []
        };
    } catch (error) {
        logger.error('Error in getCoreTrafficStats:', error);
        // Fallback to zeros if everything fails
        return {
            views: 0,
            sessions: 0,
            activeUsers: 0,
            topPages: []
        };
    }
}

/**
 * Fetch real-time active users for the last 5 minutes using internal page_events.
 */
export async function getRealtimeActiveUsers(): Promise<RealtimeAnalyticsReport> {
    try {
        const supabase = await createClient();

        const { data, error } = await supabase.rpc('get_realtime_analytics', {
            minutes: 5
        } as any);

        if (error) {
            logger.error('Failed to fetch realtime analytics:', error);
            throw new Error(`Realtime Analytics Error: ${error.message}`);
        }

        return {
            activeUsers: Number(data?.activeUsers || 0),
            pages: data?.pages || []
        };
    } catch (error) {
        logger.error('Error in getRealtimeActiveUsers:', error);
        return {
            activeUsers: 0,
            pages: []
        };
    }
}
