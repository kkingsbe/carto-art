// Stub hook for video export - no-op for anonymous version (PNG only)
'use client';

import { useRef, useCallback } from 'react';

export interface VideoExportOptions {
  resolution?: string;
  duration?: number;
  totalRotation?: number;
  fps?: number;
  animationMode?: 'orbit' | 'cinematic' | 'spiral' | 'swoopIn' | 'rocketOut' | 'rise' | 'dive' | 'flyover';
}

export function useVideoExport() {
  const isExportingRef = useRef(false);
  
  const exportToVideo = useCallback(async (options?: VideoExportOptions) => {
    // No-op for anonymous version - PNG only
    console.log('[VideoExport] Export to video not available in anonymous version');
    throw new Error('Video export not available in anonymous version');
  }, []);

  return {
    isExporting: false,
    isExportingRef,
    exportToVideo,
  };
}
