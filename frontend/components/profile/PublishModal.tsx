// Stub component for publish modal - no-op for anonymous version
'use client';

import { ReactNode } from 'react';

interface PublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  mapId?: string;
}

export function PublishModal({ isOpen, onClose, mapId }: PublishModalProps) {
  // In anonymous version, don't show publish modal
  return null;
}
