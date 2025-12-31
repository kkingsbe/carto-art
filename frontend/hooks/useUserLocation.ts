'use client';

import { useEffect, useState } from 'react';
import type { PosterLocation } from '@/types/poster';
import { reverseGeocode, nominatimResultToPosterLocation } from '@/lib/geocoding/nominatim';

export function useUserLocation(onLocationFound: (location: PosterLocation) => void, enabled: boolean = true) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined' || !navigator.geolocation) return;

    let isMounted = true;
    setIsLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        if (!isMounted) return;

        try {
          const { latitude, longitude } = position.coords;
          const result = await reverseGeocode(latitude, longitude);
          
          if (result && isMounted) {
            const location = nominatimResultToPosterLocation(result);
            if (location) {
              onLocationFound(location);
            }
          }
        } catch (err) {
          if (isMounted) {
            console.error('Failed to reverse geocode user location:', err);
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
        setIsLoading(false);
        if (err.code !== err.PERMISSION_DENIED) {
          console.warn('Geolocation error:', err.message);
          setError(err.message);
        }
      },
      { timeout: 10000 }
    );

    return () => {
      isMounted = false;
    };
  }, [onLocationFound, enabled]);

  return { error, isLoading };
}

