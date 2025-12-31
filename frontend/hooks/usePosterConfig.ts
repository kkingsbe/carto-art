'use client';

import { useReducer, useCallback } from 'react';
import type { PosterConfig, PosterLocation, PosterStyle, ColorPalette } from '@/types/poster';
import { DEFAULT_CONFIG } from '@/lib/config/defaults';
import { useUserLocation } from './useUserLocation';

type PosterAction =
  | { type: 'UPDATE_LOCATION'; payload: Partial<PosterLocation> }
  | { type: 'UPDATE_STYLE'; payload: PosterStyle }
  | { type: 'UPDATE_PALETTE'; payload: ColorPalette }
  | { type: 'UPDATE_TYPOGRAPHY'; payload: Partial<PosterConfig['typography']> }
  | { type: 'UPDATE_FORMAT'; payload: Partial<PosterConfig['format']> }
  | { type: 'UPDATE_LAYERS'; payload: Partial<PosterConfig['layers']> }
  | { type: 'SET_LOCATION'; payload: PosterLocation };

function posterReducer(state: PosterConfig, action: PosterAction): PosterConfig {
  switch (action.type) {
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
  const [config, dispatch] = useReducer(posterReducer, DEFAULT_CONFIG);

  const setLocation = useCallback((location: PosterLocation) => {
    dispatch({ type: 'SET_LOCATION', payload: location });
  }, []);

  // Isolate geolocation side effect
  useUserLocation(setLocation);

  const updateLocation = useCallback((location: Partial<PosterLocation>) => {
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
  };
}
