'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import { Button } from '@/components/ui/control-components';
import { useRouter } from 'next/navigation';
import {
  LogIn,
  LogOut,
  User as UserIcon,
  Map,
  Share2,
  Compass,
  Settings,
  Upload,
  EyeOff,
  MessageCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PublishModal } from '@/components/profile/PublishModal';
import { publishMap, unpublishMap } from '@/lib/actions/maps';

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
}

export function AccountPanel({
  onShareMap,
  currentMapId,
  currentMapName,
  currentMapStatus,
  onPublishSuccess
}: AccountPanelProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

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

  const handlePublish = async (subtitle?: string) => {
    if (!currentMapId) {
      return;
    }

    try {
      await publishMap(currentMapId, subtitle);
      onPublishSuccess?.();
      setShowPublishModal(false);
    } catch (error: any) {
      console.error('Failed to publish map:', error);
      throw error; // Let modal handle the error
    }
  };

  const handleUnpublish = async () => {
    if (!currentMapId) return;

    if (!confirm('Are you sure you want to unpublish this map?')) return;

    try {
      await unpublishMap(currentMapId);
      onPublishSuccess?.();
    } catch (error: any) {
      console.error('Failed to unpublish map:', error);
      alert('Failed to unpublish map. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick Actions - Prominent section at top when editing a map */}
      {currentMapId && currentMapStatus && user && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide">
            Quick Actions
          </h3>

          <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800 shadow-sm">
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Current Map
                </p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {currentMapName}
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {currentMapStatus.isPublished && (
                  <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium rounded">
                    Published
                  </span>
                )}
                {currentMapStatus.hasUnsavedChanges && (
                  <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-xs font-medium rounded">
                    Unsaved Changes
                  </span>
                )}
              </div>

              {currentMapStatus.isPublished ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-center gap-2 bg-white dark:bg-gray-800"
                  onClick={handleUnpublish}
                >
                  <EyeOff className="w-4 h-4" />
                  Unpublish from Feed
                </Button>
              ) : (
                <Button
                  variant="default"
                  size="sm"
                  className="w-full justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => setShowPublishModal(true)}
                >
                  <Upload className="w-4 h-4" />
                  Publish to Feed
                </Button>
              )}

              {currentMapStatus.hasUnsavedChanges && !currentMapStatus.isPublished && (
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">
                  💡 Publishing will share the last saved version. Save your changes first!
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Account Status */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide">
          Account
        </h3>

        {user ? (
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-full">
                <UserIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Signed in
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 truncate mt-0.5">
                  {user.email}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Sign in to save your maps and share them with others
            </p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="space-y-2">
        {user ? (
          <>
            <Button
              variant="default"
              className="w-full justify-start gap-3"
              onClick={() => router.push('/profile')}
            >
              <Map className="w-4 h-4" />
              My Maps
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start gap-3"
              onClick={() => router.push('/feed')}
            >
              <Compass className="w-4 h-4" />
              Browse Feed
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

            <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 text-gray-600 dark:text-gray-400"
                onClick={handleSignOut}
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </Button>
            </div>
          </>
        ) : (
          <>
            <Button
              variant="default"
              className="w-full justify-start gap-3"
              onClick={() => router.push('/login')}
            >
              <LogIn className="w-4 h-4" />
              Sign In
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start gap-3"
              onClick={() => router.push('/feed')}
            >
              <Compass className="w-4 h-4" />
              Browse Feed
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
          </>
        )}
      </div>

      {/* Info Section */}
      <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {user
            ? 'Your maps are automatically saved to your account'
            : 'Sign in to save unlimited maps and access them from any device'
          }
        </p>
      </div>

      {/* Publish Modal */}
      {showPublishModal && currentMapId && currentMapName && (
        <PublishModal
          isOpen={showPublishModal}
          onClose={() => setShowPublishModal(false)}
          mapTitle={currentMapName}
          currentSubtitle={undefined}
          onPublish={handlePublish}
        />
      )}
    </div>
  );
}
