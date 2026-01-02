import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/profile';

  console.log('[Auth Callback] Received callback request:', {
    code: code ? `${code.substring(0, 10)}...` : null,
    next,
    origin,
    url: request.url
  });

  if (code) {
    const supabase = await createClient();
    console.log('[Auth Callback] Exchanging code for session...');

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      console.log('[Auth Callback] Successfully exchanged code for session');

      const forwardedHost = request.headers.get('x-forwarded-host'); // original origin before load balancer
      const isLocalEnv = process.env.NODE_ENV === 'development';

      const redirectUrl = isLocalEnv
        ? `${origin}${next}`
        : forwardedHost
          ? `https://${forwardedHost}${next}`
          : `${origin}${next}`;

      console.log('[Auth Callback] Redirecting to:', redirectUrl);

      return NextResponse.redirect(redirectUrl);
    } else {
      console.error('[Auth Callback] Error exchanging code for session:', error);
    }
  } else {
    console.error('[Auth Callback] No code parameter found in callback URL');
  }

  // Return the user to an error page with instructions
  console.log('[Auth Callback] Redirecting to login with error');
  return NextResponse.redirect(`${origin}/login?error=Could not authenticate user`);
}

