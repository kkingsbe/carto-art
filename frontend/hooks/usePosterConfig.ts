'use client';

import { useReducer, useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import type { PosterConfig, PosterLocation, PosterStyle, ColorPalette } from '@/types/poster';
import { DEFAULT_CONFIG } from '@/lib/config/defaults';
import { useUserLocation } from './useUserLocation';
import { encodeConfig, decodeConfig } from '@/lib/config/url-state';

type PosterAction =
  | { type: 'UPDATE_LOCATION'; payload: Partial<PosterLocation> }
  | { type: 'UPDATE_STYLE'; payload: PosterStyle }
  | { type: 'UPDATE_PALETTE'; payload: ColorPalette }
  | { type: 'UPDATE_TYPOGRAPHY'; payload: Partial<PosterConfig['typography']> }
  | { type: 'UPDATE_FORMAT'; payload: Partial<PosterConfig['format']> }
  | { type: 'UPDATE_LAYERS'; payload: Partial<PosterConfig['layers']> }
  | { type: 'SET_LOCATION'; payload: PosterLocation }
  | { type: 'SET_CONFIG'; payload: PosterConfig };

function posterReducer(state: PosterConfig, action: PosterAction): PosterConfig {
  switch (action.type) {
    case 'SET_CONFIG':
      return action.payload;
    case 'UPDATE_LOCATION':
      const zoom = action.payload.zoom !== undefined 
        ? Math.min(14.9, Math.max(1, action.payload.zoom))
        : undefined;
      return {
        ...state,
        location: { 
          ...state.location, 
          ...action.payload,
          ...(zoom !== undefined ? { zoom } : {})
        },
      };
    case 'SET_LOCATION':
      return {
        ...state,
        location: {
          ...action.payload,
          zoom: Math.min(14.9, Math.max(1, action.payload.zoom))
        },
      };
    case 'UPDATE_STYLE':
      return {
        ...state,
        style: action.payload,
        palette: action.payload.defaultPalette,
        typography: {
          ...state.typography,
          titleFont: action.payload.recommendedFonts[0] || state.typography.titleFont,
          subtitleFont: action.payload.recommendedFonts[0] || state.typography.subtitleFont,
        },
      };
    case 'UPDATE_PALETTE':
      return { ...state, palette: action.payload };
    case 'UPDATE_TYPOGRAPHY':
      return {
        ...state,
        typography: { ...state.typography, ...action.payload },
      };
    case 'UPDATE_FORMAT':
      return {
        ...state,
        format: { ...state.format, ...action.payload },
      };
    case 'UPDATE_LAYERS':
      return {
        ...state,
        layers: { ...state.layers, ...action.payload },
      };
    default:
      return state;
  }
}

export function usePosterConfig() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isInitialized = useRef(false);

  const [config, dispatch] = useReducer(posterReducer, DEFAULT_CONFIG);
  const [shouldAutoLocate, setShouldAutoLocate] = useState(() => !searchParams.has('s'));

  // Initialize from URL on mount
  useEffect(() => {
    if (isInitialized.current) return;
    
    const stateParam = searchParams.get('s');
    if (stateParam) {
      const decoded = decodeConfig(stateParam);
      if (decoded) {
        setShouldAutoLocate(false);
        dispatch({ type: 'SET_CONFIG', payload: { ...DEFAULT_CONFIG, ...decoded } });
      }
    }
    isInitialized.current = true;
  }, [searchParams]);

  // Sync state to URL
  useEffect(() => {
    if (!isInitialized.current) return;

    const encoded = encodeConfig(config);
    const params = new URLSearchParams(searchParams.toString());
    
    // Only update if the encoded state is different from what's in the URL
    if (params.get('s') !== encoded) {
      params.set('s', encoded);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
  }, [config, pathname, router, searchParams]);

  const setConfig = useCallback((config: PosterConfig) => {
    setShouldAutoLocate(false);
    dispatch({ type: 'SET_CONFIG', payload: config });
  }, []);

  const handleUserLocationFound = useCallback((location: PosterLocation) => {
    if (shouldAutoLocate) {
      dispatch({ type: 'SET_LOCATION', payload: location });
      setShouldAutoLocate(false); // Only auto-locate once
    }
  }, [shouldAutoLocate]);

  // Isolate geolocation side effect
  useUserLocation(handleUserLocationFound, shouldAutoLocate);

  const updateLocation = useCallback((location: Partial<PosterLocation>) => {
    setShouldAutoLocate(false);
    dispatch({ type: 'UPDATE_LOCATION', payload: location });
  }, []);

  const updateStyle = useCallback((style: PosterStyle) => {
    dispatch({ type: 'UPDATE_STYLE', payload: style });
  }, []);

  const updatePalette = useCallback((palette: ColorPalette) => {
    dispatch({ type: 'UPDATE_PALETTE', payload: palette });
  }, []);

  const updateTypography = useCallback((typography: Partial<PosterConfig['typography']>) => {
    dispatch({ type: 'UPDATE_TYPOGRAPHY', payload: typography });
  }, []);

  const updateFormat = useCallback((format: Partial<PosterConfig['format']>) => {
    dispatch({ type: 'UPDATE_FORMAT', payload: format });
  }, []);

  const updateLayers = useCallback((layers: Partial<PosterConfig['layers']>) => {
    dispatch({ type: 'UPDATE_LAYERS', payload: layers });
  }, []);

  return {
    config,
    updateLocation,
    updateStyle,
    updatePalette,
    updateTypography,
    updateFormat,
    updateLayers,
    setConfig,
  };
}
