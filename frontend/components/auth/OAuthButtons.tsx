'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/control-components';
import { AlertCircle } from 'lucide-react';

interface OAuthButtonsProps {
  redirectTo?: string;
}

export function OAuthButtons({ redirectTo }: OAuthButtonsProps) {
  const [loading, setLoading] = useState<'google' | 'github' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const handleOAuth = async (provider: 'google' | 'github') => {
    try {
      setLoading(provider);
      setError(null);

      const redirectUrl = redirectTo
        ? `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`
        : `${window.location.origin}/auth/callback`;

      console.log('[OAuth] Initiating OAuth flow:', { provider, redirectUrl, redirectTo });

      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: redirectUrl,
        },
      });

      if (oauthError) {
        console.error('[OAuth] Error:', oauthError);
        throw oauthError;
      }

      console.log('[OAuth] Success, should redirect to provider:', data);

      // Note: If we reach here without redirecting, there's a problem
      // OAuth should redirect the browser to the provider
    } catch (err) {
      console.error('[OAuth] Exception:', err);
      const message = err instanceof Error ? err.message : 'Failed to initiate login. Please try again.';
      setError(message);
      setLoading(null);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800 dark:text-red-200">
              Authentication Error
            </p>
            <p className="text-sm text-red-700 dark:text-red-300 mt-1">
              {error}
            </p>
            <p className="text-xs text-red-600 dark:text-red-400 mt-2">
              Check the console for more details. If this persists, verify your Supabase redirect URLs are configured correctly.
            </p>
          </div>
        </div>
      )}

      {/* Temporarily hidden Google login button */}
      <Button
        onClick={() => handleOAuth('google')}
        disabled={loading !== null}
        className="w-full flex items-center justify-center gap-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-600"
      >
        {loading === 'google' ? (
          <>
            <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
            <span>Connecting...</span>
          </>
        ) : (
          <>
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span>Continue with Google</span>
          </>
        )}
      </Button>

      <Button
        onClick={() => handleOAuth('github')}
        disabled={loading !== null}
        className="w-full flex items-center justify-center gap-3 bg-slate-900 dark:bg-slate-700 text-white hover:bg-slate-800 dark:hover:bg-slate-600"
      >
        {loading === 'github' ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>Connecting...</span>
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path
                fillRule="evenodd"
                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                clipRule="evenodd"
              />
            </svg>
            <span>Continue with GitHub</span>
          </>
        )}
      </Button>

      <p className="text-xs text-center text-slate-500 dark:text-slate-400 mt-6">
        By signing in, you agree to our Terms of Service and Privacy Policy
      </p>
    </div>
  );
}

