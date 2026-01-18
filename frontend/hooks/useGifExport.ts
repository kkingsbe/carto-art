// Stub hook for GIF export - no-op for anonymous version (PNG only)
'use client';

import { useRef, useCallback } from 'react';

export interface GifExportOptions {
  resolution?: string;
  duration?: number;
  totalRotation?: number;
  fps?: number;
  animationMode?: 'orbit' | 'cinematic' | 'spiral' | 'swoopIn' | 'rocketOut' | 'rise' | 'dive' | 'flyover';
}

export function useGifExport() {
  const isExportingRef = useRef(false);
  
  const exportToGif = useCallback(async (options?: GifExportOptions) => {
    // No-op for anonymous version - PNG only
    console.log('[GifExport] Export to GIF not available in anonymous version');
    throw new Error('GIF export not available in anonymous version');
  }, []);

  return {
    isExporting: false,
    isExportingRef,
    exportToGif,
  };
}
