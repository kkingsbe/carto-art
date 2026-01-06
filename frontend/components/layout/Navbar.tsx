"use client";

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { AuthButton } from '@/components/auth/AuthButton';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { cn } from '@/lib/utils';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { ChangelogModal } from '@/components/landing/ChangelogModal';

import { useAdmin } from '@/hooks/useAdmin';

export function Navbar() {
    const pathname = usePathname();
    const isMapDetailPage = pathname?.startsWith('/map/');
    const { isAdmin } = useAdmin();

    const navLinks = [
        { href: '/', label: 'Home' },
        { href: '/gallery', label: 'Gallery' },
        { href: '/editor', label: 'Editor' },
        { href: '/developer', label: 'Developers' },
    ];

    if (isAdmin) {
        navLinks.push({ href: '/admin', label: 'Admin' });
    }

    return (
        <nav className="sticky top-0 z-50 w-full border-b border-border bg-background">
            <div className="w-full flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
                <div className="flex items-center gap-8 md:gap-12">
                    <Link href="/" className="flex items-center space-x-2.5 group">
                        <div className="relative h-8 w-8 transition-transform duration-300 group-hover:scale-105">
                            <Image
                                src="/logo.svg"
                                alt="Carto-Art Logo"
                                fill
                                className="object-contain dark:invert"
                                priority
                            />
                        </div>
                        <span className="text-lg font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
                            CartoArt
                        </span>
                    </Link>
                    <div className="hidden md:flex items-center gap-8">
                        {isMapDetailPage && (
                            <Link
                                href="/gallery"
                                className={cn(
                                    "relative py-1 text-sm font-medium transition-all duration-200 hover:text-foreground group inline-flex items-center gap-1.5",
                                    "text-foreground/60"
                                )}
                            >
                                <ArrowLeft className="w-3.5 h-3.5" />
                                Back to Gallery
                            </Link>
                        )}
                        {navLinks.map((link) => {
                            const isActive = pathname === link.href;
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={cn(
                                        "relative py-1 text-sm font-medium transition-all duration-200 hover:text-foreground group",
                                        isActive ? "text-foreground" : "text-foreground/60"
                                    )}
                                >
                                    {link.label}
                                    <span className={cn(
                                        "absolute -bottom-1 left-0 h-0.5 w-full bg-blue-500 rounded-full transition-all duration-300 origin-left",
                                        isActive ? "scale-x-100 opacity-100" : "scale-x-0 opacity-0 group-hover:scale-x-100 group-hover:opacity-50"
                                    )} />
                                </Link>
                            );
                        })}
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <ChangelogModal
                        trigger={
                            <button className="p-2 text-foreground/60 hover:text-foreground transition-colors relative group">
                                <Sparkles className="w-5 h-5" />
                                <span className="absolute -top-1 -right-1 flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                                </span>
                            </button>
                        }
                    />
                    <NotificationBell />
                    <div className="flex items-center pl-2 border-l border-border/50">
                        <AuthButton />
                    </div>
                </div>
            </div>
        </nav>
    );
}
