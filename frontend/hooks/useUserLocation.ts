'use client';

import { useEffect, useState, useRef } from 'react';
import type { PosterLocation } from '@/types/poster';
import { reverseGeocode } from '@/lib/geocoding/nominatim';
import { TIMEOUTS, GEOLOCATION } from '@/lib/constants';
import { logger } from '@/lib/logger';

/**
 * Hook to get user's current geolocation and reverse geocode it to a PosterLocation.
 * Uses watchPosition API for better cleanup control and includes safety timeouts.
 * 
 * @param onLocationFound - Callback invoked when location is successfully found and geocoded
 * @param enabled - Whether to attempt geolocation (default: true)
 * @returns Object with error state and loading state
 * 
 * @example
 * ```tsx
 * const { error, isLoading } = useUserLocation((location) => {
 *   updateLocation(location);
 * }, shouldAutoLocate);
 * ```
 */
export function useUserLocation(onLocationFound: (location: PosterLocation) => void, enabled: boolean = true) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const watchIdRef = useRef<number | null>(null);
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined' || !navigator.geolocation) return;

    let isMounted = true;
    setIsLoading(true);

    // Use watchPosition instead of getCurrentPosition for better cleanup control
    // We'll clear it after getting the first position
    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        if (!isMounted) return;

        // Clear the watch immediately after getting first position
        if (watchIdRef.current !== null) {
          navigator.geolocation.clearWatch(watchIdRef.current);
          watchIdRef.current = null;
        }

        // Clear any pending timeout
        if (timeoutIdRef.current) {
          clearTimeout(timeoutIdRef.current);
          timeoutIdRef.current = null;
        }

        try {
          const { latitude, longitude } = position.coords;
          const location = await reverseGeocode(latitude, longitude);

          if (location && isMounted) {
            onLocationFound(location);
          }
        } catch (err) {
          if (isMounted) {
            logger.error('Failed to reverse geocode user location:', err);
            setError('Failed to resolve address');
          }
        } finally {
          if (isMounted) {
            setIsLoading(false);
          }
        }
      },
      (err) => {
        if (!isMounted) return;

        // Clear the watch on error
        if (watchIdRef.current !== null) {
          navigator.geolocation.clearWatch(watchIdRef.current);
          watchIdRef.current = null;
        }

        // Clear timeout
        if (timeoutIdRef.current) {
          clearTimeout(timeoutIdRef.current);
          timeoutIdRef.current = null;
        }

        setIsLoading(false);
        if (err.code !== err.PERMISSION_DENIED) {
          logger.warn('Geolocation error:', err.message);
          setError(err.message);
        }
      },
      { timeout: TIMEOUTS.GEOLOCATION, maximumAge: GEOLOCATION.MAX_AGE, enableHighAccuracy: GEOLOCATION.ENABLE_HIGH_ACCURACY }
    );

    watchIdRef.current = watchId;

    // Safety timeout: if we don't get a position within safety timeout, clear the watch
    timeoutIdRef.current = setTimeout(() => {
      if (watchIdRef.current !== null && isMounted) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
        setIsLoading(false);
        setError('Location request timed out');
      }
    }, TIMEOUTS.GEOLOCATION_SAFETY);

    return () => {
      isMounted = false;

      // Clear geolocation watch
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }

      // Clear timeout
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = null;
      }
    };
  }, [onLocationFound, enabled]);

  return { error, isLoading };
}

