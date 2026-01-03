'use server';

import { createAnonymousClient, createServiceRoleClient } from '@/lib/supabase/server';
import { unstable_cache } from 'next/cache';

export interface SiteStats {
  totalMaps: number; // Keeping for compatibility, but populated with exports count if requested? No, let's add totalExports
  totalExports: number;
  totalUsers: number;
  totalPublishedMaps: number;
  recentMapsCount: number; // Last 30 days
}

/**
 * Fetches site-wide usage statistics from the database
 * with 1-hour caching to reduce database load
 */
async function fetchSiteStats(): Promise<SiteStats> {
  const fallbackStats: SiteStats = {
    totalMaps: 1200,
    totalExports: 5000,
    totalUsers: 450,
    totalPublishedMaps: 180,
    recentMapsCount: 85,
  };

  try {
    const supabaseAnon = createAnonymousClient();
    const supabaseAdmin = createServiceRoleClient(); // Needed for page_events

    // Run all queries in parallel for better performance
    const [
      { count: totalMaps, error: mapsError },
      { count: totalProfiles, error: usersError },
      { count: totalPublishedMaps, error: publishedError },
      { count: recentMapsCount, error: recentError },
      { count: totalExports, error: exportsError }
    ] = await Promise.all([
      // Total maps created (legacy metric, keeping for potential other uses)
      supabaseAnon
        .from('maps')
        .select('*', { count: 'exact', head: true }),

      // Total users (profiles)
      supabaseAnon
        .from('profiles')
        .select('*', { count: 'exact', head: true }),

      // Published maps
      supabaseAnon
        .from('maps')
        .select('*', { count: 'exact', head: true })
        .eq('is_published', true),

      // Maps created in last 30 days
      supabaseAnon
        .from('maps')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),

      // Total exports (from page_events)
      supabaseAdmin
        .from('page_events')
        .select('*', { count: 'exact', head: true })
        .eq('event_type', 'poster_export')
    ]);

    // Check for errors
    if (mapsError || usersError || publishedError || recentError || exportsError) {
      console.error('Error fetching site stats:', {
        mapsError,
        usersError,
        publishedError,
        recentError,
        exportsError
      });
      return fallbackStats;
    }

    return {
      totalMaps: totalMaps ?? 0,
      totalExports: totalExports ?? 0,
      totalUsers: totalProfiles ?? 0,
      totalPublishedMaps: totalPublishedMaps ?? 0,
      recentMapsCount: recentMapsCount ?? 0,
    };
  } catch (error) {
    console.error('Failed to fetch site stats:', error);
    return fallbackStats;
  }
}

/**
 * Get site-wide statistics with 1-hour caching
 */
export const getSiteStats = unstable_cache(
  fetchSiteStats,
  ['site-stats'],
  {
    revalidate: 3600, // 1 hour in seconds
    tags: ['site-stats'],
  }
);
