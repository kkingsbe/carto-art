'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import { Button } from '@/components/ui/control-components';
import { useRouter } from 'next/navigation';

export function AuthButton() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
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

  if (loading) {
    return (
      <Button variant="ghost" disabled>
        Loading...
      </Button>
    );
  }

  if (user) {
    return (
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={() => router.push('/profile')}
          className="text-sm"
        >
          My Maps
        </Button>
        <Button
          variant="ghost"
          onClick={handleSignOut}
          className="text-sm"
        >
          Sign Out
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant="outline"
      onClick={() => router.push('/login')}
      className="text-sm"
    >
      Sign In
    </Button>
  );
}

