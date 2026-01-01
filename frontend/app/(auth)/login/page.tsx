import { OAuthButtons } from '@/components/auth/OAuthButtons';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export const metadata = {
  title: 'Login | CartoArt',
  description: 'Sign in to save and share your map posters',
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              Welcome to CartoArt
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Sign in to save, publish, and share your map posters
            </p>
          </div>
          <OAuthButtons redirectTo={params.redirect} />
        </div>
      </div>
    </div>
  );
}

