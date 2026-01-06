'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { checkExportLimit, checkProjectLimit } from '@/lib/actions/usage';
import type { ExportUsageResult, ProjectUsageResult } from '@/lib/actions/usage';

/**
 * Hook to track user's usage limits for exports and projects
 */
export function useUsageLimits(subscriptionTier: 'free' | 'carto_plus' = 'free') {
    const [userId, setUserId] = useState<string | null>(null);
    const [exportUsage, setExportUsage] = useState<ExportUsageResult | null>(null);
    const [projectUsage, setProjectUsage] = useState<ProjectUsageResult | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch user ID on mount
    useEffect(() => {
        const fetchUser = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            setUserId(user?.id ?? null);
        };
        fetchUser();
    }, []);

    const fetchUsage = useCallback(async () => {
        if (userId === null && subscriptionTier === 'free') {
            // Still loading userId
            return;
        }
        try {
            const [exportResult, projectResult] = await Promise.all([
                checkExportLimit(userId, subscriptionTier),
                checkProjectLimit(userId, subscriptionTier),
            ]);
            setExportUsage(exportResult);
            setProjectUsage(projectResult);
        } catch (error) {
            console.error('Failed to fetch usage limits:', error);
        } finally {
            setIsLoading(false);
        }
    }, [userId, subscriptionTier]);

    useEffect(() => {
        fetchUsage();
    }, [fetchUsage]);

    // Refresh usage after an export
    const refreshExportUsage = useCallback(async () => {
        try {
            const result = await checkExportLimit(userId, subscriptionTier);
            setExportUsage(result);
        } catch (error) {
            console.error('Failed to refresh export usage:', error);
        }
    }, [userId, subscriptionTier]);

    // Refresh usage after saving a project
    const refreshProjectUsage = useCallback(async () => {
        try {
            const result = await checkProjectLimit(userId, subscriptionTier);
            setProjectUsage(result);
        } catch (error) {
            console.error('Failed to refresh project usage:', error);
        }
    }, [userId, subscriptionTier]);

    return {
        exportUsage,
        projectUsage,
        isLoading,
        refreshExportUsage,
        refreshProjectUsage,
    };
}

