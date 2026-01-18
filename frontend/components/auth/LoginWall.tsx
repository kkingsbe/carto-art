// Stub component for login wall - no-op for anonymous version
'use client';

import { ReactNode } from 'react';

interface LoginWallProps {
  children: ReactNode;
}

export function LoginWall({ children }: LoginWallProps) {
  // In anonymous version, just render children without login wall
  return <>{children}</>;
}
