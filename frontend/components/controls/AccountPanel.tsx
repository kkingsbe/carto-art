'use client';

import { Button } from '@/components/ui/control-components';
import { useRouter } from 'next/navigation';
import {
  Share2,
  Compass,
  MessageCircle
} from 'lucide-react';

interface AccountPanelProps {
  onShareMap?: () => void;
  currentMapId?: string | null;
  currentMapName?: string | null;
  currentMapStatus?: {
    isSaved: boolean;
    isPublished: boolean;
    hasUnsavedChanges: boolean;
  } | null;
  onPublishSuccess?: () => void;
  onPublish?: () => void;
  onUnpublish?: () => void;
}

export function AccountPanel({
  onShareMap,
}: AccountPanelProps) {
  const router = useRouter();

  const handleShareMap = async () => {
    if (onShareMap) {
      onShareMap();
      return;
    }

    // Copy current URL to clipboard
    try {
      await navigator.clipboard.writeText(window.location.href);

      // Show temporary success message
      const button = document.querySelector('[data-share-button]');
      if (button) {
        const originalText = button.textContent;
        button.textContent = 'Link Copied!';
        setTimeout(() => {
          button.textContent = originalText || 'Share This Map';
        }, 2000);
      }
    } catch (err) {
      console.error('Failed to copy URL:', err);
      alert('Failed to copy link. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Account Status */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide">
          Account
        </h3>

        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            This is a stripped-down open source version. Authentication features are not available.
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2">
        <Button
          variant="outline"
          className="w-full justify-start gap-3"
          onClick={() => router.push('/gallery')}
        >
          <Compass className="w-4 h-4" />
          Browse Gallery
        </Button>

        <Button
          variant="outline"
          className="w-full justify-start gap-3"
          onClick={() => window.open('https://discord.gg/UVKEfcfZVc', '_blank', 'noopener,noreferrer')}
        >
          <MessageCircle className="w-4 h-4" />
          Join Discord
        </Button>

        <Button
          variant="outline"
          className="w-full justify-start gap-3"
          onClick={handleShareMap}
          data-share-button
        >
          <Share2 className="w-4 h-4" />
          Share This Map
        </Button>
      </div>

      {/* Info Section */}
      <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Create and export beautiful map posters
        </p>
      </div>
    </div>
  );
}
