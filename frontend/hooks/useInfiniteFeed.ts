'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { getFeed } from '@/lib/actions/feed';
import type { FeedMap } from '@/lib/actions/feed';

const INITIAL_PAGE = 0;
const PAGE_SIZE = 24;

export function useInfiniteFeed(sortParameter: 'fresh' | 'top' | 'following', styleIds?: string[]) {
  const [maps, setMaps] = useState<FeedMap[]>([]);
  const [page, setPage] = useState(INITIAL_PAGE);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pageRef = useRef(INITIAL_PAGE);
  const sortRef = useRef(sortParameter);
  const styleIdsRef = useRef(styleIds);

  // Update refs when values change
  useEffect(() => {
    sortRef.current = sortParameter;
  }, [sortParameter]);

  useEffect(() => {
    styleIdsRef.current = styleIds;
  }, [styleIds]);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    setError(null);

    try {
      const currentPage = pageRef.current;
      const currentSortParam = sortRef.current;
      const currentStyleIds = styleIdsRef.current;

      // Map the UI sort parameter to API args
      let apiSort: 'fresh' | 'top' = 'fresh';
      let apiFilter: 'all' | 'following' = 'all';

      if (currentSortParam === 'following') {
        apiSort = 'fresh';
        apiFilter = 'following';
      } else {
        apiSort = currentSortParam;
      }

      const newMaps = await getFeed(apiSort, currentPage, PAGE_SIZE, apiFilter, currentStyleIds);

      if (newMaps.length === 0) {
        setHasMore(false);
      } else {
        setMaps(prev => {
          // Avoid duplicates by checking IDs
          const existingIds = new Set(prev.map(m => m.id));
          const uniqueNewMaps = newMaps.filter(m => !existingIds.has(m.id));
          return [...prev, ...uniqueNewMaps];
        });

        // If we got fewer than PAGE_SIZE, there are no more
        if (newMaps.length < PAGE_SIZE) {
          setHasMore(false);
        }
      }

      pageRef.current = currentPage + 1;
      setPage(currentPage + 1);
    } catch (err: any) {
      setError(err.message || 'Failed to load maps. Please try again.');
      console.error('Error loading feed:', err);
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }, [loading, hasMore]);

  const reset = useCallback(() => {
    setMaps([]);
    pageRef.current = INITIAL_PAGE;
    setPage(INITIAL_PAGE);
    setHasMore(true);
    setError(null);
    setInitialLoading(true);
  }, []);

  // Reset when sort or styleIds change
  useEffect(() => {
    setMaps([]);
    pageRef.current = INITIAL_PAGE;
    setPage(INITIAL_PAGE);
    setHasMore(true);
    setError(null);
    setInitialLoading(true);
  }, [sortParameter, styleIds]);

  // Load initial page
  useEffect(() => {
    if (initialLoading && page === INITIAL_PAGE && hasMore && !loading) {
      loadMore();
    }
  }, [initialLoading, page, hasMore, loading, loadMore]);

  return {
    maps,
    loadMore,
    hasMore,
    loading,
    initialLoading,
    error,
    reset,
  };
}

