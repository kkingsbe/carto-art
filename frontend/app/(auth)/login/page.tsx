import { OAuthButtons } from '@/components/auth/OAuthButtons';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import LoginContent from './LoginContent';

export const metadata = {
  title: 'Login | CartoArt',
  description: 'Sign in to save and share your map posters',
};

export const dynamic = 'force-dynamic';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string; error?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Await searchParams (Next.js 15 requirement)
  const params = await searchParams;

  // If already logged in, redirect
  if (user) {
    redirect(params.redirect || '/profile');
  }

  return <LoginContent error={params.error} redirectPath={params.redirect} />;
}
