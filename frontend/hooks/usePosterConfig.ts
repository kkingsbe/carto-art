'use client';

import { useReducer, useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import type { PosterConfig, PosterLocation, PosterStyle, ColorPalette } from '@/types/poster';
import { DEFAULT_CONFIG } from '@/lib/config/defaults';
import { getRandomVista } from '@/lib/config/vistas';
import { useUserLocation } from './useUserLocation';
import { encodeConfig, decodeConfig } from '@/lib/config/url-state';
import { cloneConfig, isConfigEqual } from '@/lib/utils/configComparison';
import { MAP, HISTORY, TIMEOUTS } from '@/lib/constants';

type PosterAction =
  | { type: 'UPDATE_LOCATION'; payload: Partial<PosterLocation> }
  | { type: 'UPDATE_STYLE'; payload: PosterStyle }
  | { type: 'UPDATE_PALETTE'; payload: ColorPalette }
  | { type: 'UPDATE_TYPOGRAPHY'; payload: Partial<PosterConfig['typography']> }
  | { type: 'UPDATE_FORMAT'; payload: Partial<PosterConfig['format']> }
  | { type: 'UPDATE_LAYERS'; payload: Partial<PosterConfig['layers']> }
  | { type: 'UPDATE_RENDERING'; payload: Partial<NonNullable<PosterConfig['rendering']>> }
  | { type: 'SET_LOCATION'; payload: PosterLocation }
  | { type: 'SET_CONFIG'; payload: PosterConfig };

function posterReducer(state: PosterConfig, action: PosterAction): PosterConfig {
  switch (action.type) {
    case 'SET_CONFIG':
      return action.payload;
    case 'UPDATE_LOCATION':
      const zoom = action.payload.zoom !== undefined
        ? Math.min(MAP.MAX_ZOOM_CLAMPED, Math.max(MAP.MIN_ZOOM_CLAMPED, action.payload.zoom))
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
          zoom: Math.min(MAP.MAX_ZOOM_CLAMPED, Math.max(MAP.MIN_ZOOM_CLAMPED, action.payload.zoom))
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
    case 'UPDATE_RENDERING':
      return {
        ...state,
        rendering: { ...state.rendering, ...action.payload },
      };
    default:
      return state;
  }
}

/**
 * Main hook for managing poster configuration state.
 * Handles state management, URL synchronization, undo/redo history, and auto-location.
 * 
 * @returns Object containing:
 * - config: Current poster configuration
 * - updateLocation: Update location (center, zoom, bounds)
 * - updateStyle: Change map style
 * - updatePalette: Change color palette
 * - updateTypography: Update typography settings
 * - updateFormat: Update format/aspect ratio settings
 * - updateLayers: Toggle map layers
 * - setConfig: Replace entire config (used for loading saved projects)
 * - undo: Undo last change
 * - redo: Redo last undone change
 * - canUndo: Whether undo is available
 * - canRedo: Whether redo is available
 * 
 * @example
 * ```tsx
 * const { config, updateLocation, updateStyle } = usePosterConfig();
 * updateLocation({ center: [lng, lat], zoom: 10 });
 * ```
 */
export function usePosterConfig() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isInitialized = useRef(false);
  const historyRef = useRef<PosterConfig[]>([]);
  const historyIndexRef = useRef(-1);
  const isUndoRedoRef = useRef(false);
  const isUpdatingUrlRef = useRef(false);
  const urlUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [config, dispatch] = useReducer(posterReducer, DEFAULT_CONFIG);
  const [shouldAutoLocate, setShouldAutoLocate] = useState(() => {
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location.search);
    // Don't auto-locate if we're loading a specific map or state
    return !params.has('s') && !params.has('map') && !params.has('mapId') && !params.has('remix');
  });

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
    } else if (!searchParams.has('map') && !searchParams.has('mapId') && !searchParams.has('remix')) {
      // Initialize with a random vista if no state or map ID is provided
      const randomVista = getRandomVista();
      dispatch({ type: 'UPDATE_LOCATION', payload: randomVista.location });
    }
    isInitialized.current = true;
  }, [searchParams]);

  // Debounced history update function
  const pendingHistoryUpdateRef = useRef<NodeJS.Timeout | null>(null);
  const lastConfigRef = useRef<PosterConfig | null>(null);

  // Add to history when config changes (but not during undo/redo)
  // Debounced to avoid adding history on every rapid change
  // Track history state for UI (undo/redo buttons)
  // We use this instead of deriving from config in useEffect to avoid infinite loops
  const [historyState, setHistoryState] = useState({ index: -1, length: 0 });

  // Add to history when config changes (but not during undo/redo)
  // Debounced to avoid adding history on every rapid change
  useEffect(() => {
    if (!isInitialized.current || isUndoRedoRef.current) {
      isUndoRedoRef.current = false;
      return;
    }

    // Clear any pending history update
    if (pendingHistoryUpdateRef.current) {
      clearTimeout(pendingHistoryUpdateRef.current);
      pendingHistoryUpdateRef.current = null;
    }

    // Store current config for debounced update
    lastConfigRef.current = config;

    // Debounce history updates (500ms of inactivity)
    pendingHistoryUpdateRef.current = setTimeout(() => {
      const configToSave = lastConfigRef.current;
      if (!configToSave) return;

      // Don't add duplicate states using optimized comparison
      const lastState = historyRef.current[historyIndexRef.current];
      if (lastState && isConfigEqual(lastState, configToSave)) {
        return;
      }

      // Remove any states after current index (when undoing and then making a new change)
      historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);

      // Add new state using optimized clone
      historyRef.current.push(cloneConfig(configToSave));
      historyIndexRef.current = historyRef.current.length - 1;

      // Limit history size
      if (historyRef.current.length > HISTORY.MAX_SIZE) {
        historyRef.current.shift();
        historyIndexRef.current = HISTORY.MAX_SIZE - 1;
      }

      // Update UI state
      setHistoryState({
        index: historyIndexRef.current,
        length: historyRef.current.length
      });
    }, TIMEOUTS.HISTORY_UPDATE_DEBOUNCE);

    // Cleanup timeout on unmount or config change
    return () => {
      if (pendingHistoryUpdateRef.current) {
        clearTimeout(pendingHistoryUpdateRef.current);
        pendingHistoryUpdateRef.current = null;
      }
    };
  }, [config]);

  // Sync state to URL (debounced to prevent race conditions)
  useEffect(() => {
    if (!isInitialized.current || isUpdatingUrlRef.current) return;

    // Clear any pending URL update
    if (urlUpdateTimeoutRef.current) {
      clearTimeout(urlUpdateTimeoutRef.current);
      urlUpdateTimeoutRef.current = null;
    }

    // Debounce URL updates to prevent infinite loops
    urlUpdateTimeoutRef.current = setTimeout(() => {
      const encoded = encodeConfig(config);
      const params = new URLSearchParams(searchParams.toString());

      // Only update if the encoded state is different from what's in the URL
      if (params.get('s') !== encoded) {
        isUpdatingUrlRef.current = true;
        params.set('s', encoded);
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });

        // Reset flag after a short delay to allow router to update
        setTimeout(() => {
          isUpdatingUrlRef.current = false;
        }, TIMEOUTS.URL_UPDATE_RESET);
      }
    }, TIMEOUTS.URL_SYNC_DEBOUNCE);

    // Cleanup timeout on unmount or config change
    return () => {
      if (urlUpdateTimeoutRef.current) {
        clearTimeout(urlUpdateTimeoutRef.current);
        urlUpdateTimeoutRef.current = null;
      }
    };
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

  const updateRendering = useCallback((rendering: Partial<NonNullable<PosterConfig['rendering']>>) => {
    dispatch({ type: 'UPDATE_RENDERING', payload: rendering });
  }, []);

  const undo = useCallback(() => {
    if (historyIndexRef.current > 0) {
      historyIndexRef.current--;
      isUndoRedoRef.current = true;
      dispatch({ type: 'SET_CONFIG', payload: cloneConfig(historyRef.current[historyIndexRef.current]) });
      setShouldAutoLocate(false);

      setHistoryState({
        index: historyIndexRef.current,
        length: historyRef.current.length
      });
    }
  }, []);

  const redo = useCallback(() => {
    if (historyIndexRef.current < historyRef.current.length - 1) {
      historyIndexRef.current++;
      isUndoRedoRef.current = true;
      dispatch({ type: 'SET_CONFIG', payload: cloneConfig(historyRef.current[historyIndexRef.current]) });
      setShouldAutoLocate(false);

      setHistoryState({
        index: historyIndexRef.current,
        length: historyRef.current.length
      });
    }
  }, []);

  return {
    config,
    updateLocation,
    updateStyle,
    updatePalette,
    updateTypography,
    updateFormat,
    updateLayers,
    updateRendering,
    setConfig,
    undo,
    redo,
    canUndo: historyState.index > 0,
    canRedo: historyState.index < historyState.length - 1,
  };
}
