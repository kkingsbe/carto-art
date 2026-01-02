'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import { Button } from '@/components/ui/control-components';
import { useRouter } from 'next/navigation';
import { User as UserIcon, LogOut, LayoutDashboard, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export function AuthButton() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
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

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      subscription.unsubscribe();
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [supabase]);

  const handleSignOut = async () => {
    setLoading(true); // Optional: show loading state during sign out
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
    setIsOpen(false);
  };

  if (loading) {
    return (
      <div className="h-9 w-9 rounded-full bg-muted/50 animate-pulse" />
    );
  }

  if (user) {
    const initials = user.email?.substring(0, 2).toUpperCase() || 'U';

    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 rounded-full border border-border/50 bg-background p-1 pl-3 pr-2 transition-all hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="text-sm font-medium hidden sm:inline-block max-w-[100px] truncate opacity-80">
            {user.email?.split('@')[0]}
          </span>
          <div className="h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shadow-sm">
            {initials}
          </div>
          <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform duration-200", isOpen && "rotate-180")} />
        </button>

        {isOpen && (
          <div className="absolute right-0 top-full mt-2 w-56 rounded-lg border bg-popover text-popover-foreground shadow-lg shadow-black/5 animate-in fade-in-0 zoom-in-95 data-[side=bottom]:slide-in-from-top-2 overflow-hidden z-50">
            <div className="p-3 border-b bg-muted/30">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-0.5">Signed in as</p>
              <p className="text-sm font-medium truncate">{user.email}</p>
            </div>
            <div className="p-1">
              <Link href="/profile" onClick={() => setIsOpen(false)}>
                <div className="flex items-center gap-2 rounded-md px-2 py-2 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground cursor-pointer">
                  <LayoutDashboard className="h-4 w-4" />
                  <span>My Profile</span>
                </div>
              </Link>
            </div>
            <div className="border-t p-1">
              <div
                onClick={handleSignOut}
                className="flex items-center gap-2 rounded-md px-2 py-2 text-sm outline-none transition-colors hover:bg-destructive/10 hover:text-destructive cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        onClick={() => router.push('/login')}
        className="text-sm font-medium"
      >
        Sign In
      </Button>
      <Button
        onClick={() => router.push('/login?view=sign_up')}
        className="text-sm hidden sm:inline-flex"
      >
        Sign Up
      </Button>
    </div>
  );
}
