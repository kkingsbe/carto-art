"use client";

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { AuthButton } from '@/components/auth/AuthButton';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { cn } from '@/lib/utils';
import { ArrowLeft, Sparkles, Menu } from 'lucide-react';
import { ChangelogModal } from '@/components/landing/ChangelogModal';
import { MobileMenu } from './MobileMenu';
import { ModeToggle } from '@/components/mode-toggle';
import { useState, useEffect } from 'react';

import { useAdmin } from '@/hooks/useAdmin';

export function Navbar() {
    const pathname = usePathname();
    const isMapDetailPage = pathname?.startsWith('/map/');
    const { isAdmin } = useAdmin();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const navLinks = [
        { href: '/', label: 'Home' },
        { href: '/gallery', label: 'Gallery' },
        { href: '/editor', label: 'Editor' },
        { href: '/developer', label: 'Developers' },
    ];

    // Close mobile menu on path change
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [pathname]);

    return (
        <>
            <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
                <div className="w-full flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-8 md:gap-12">
                        <Link href="/" className="flex items-center space-x-2.5 group">
                            <div className="relative h-8 w-8 transition-transform duration-300 group-hover:scale-110">
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
                        <div className="hidden md:flex items-center gap-2">
                            {isMapDetailPage && (
                                <Link
                                    href="/gallery"
                                    className={cn(
                                        "relative py-1.5 px-3 text-sm font-medium transition-all duration-200 rounded-full hover:bg-muted/50 group inline-flex items-center gap-1.5",
                                        "text-foreground/60 hover:text-foreground"
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
                                            "relative px-3.5 py-1.5 text-sm font-medium transition-all duration-300 rounded-full",
                                            isActive
                                                ? "text-primary bg-primary/10 shadow-sm shadow-primary/5"
                                                : "text-foreground/60 hover:text-foreground hover:bg-foreground/5"
                                        )}
                                    >
                                        {link.label}
                                    </Link>
                                );
                            })}
                            {isAdmin && (
                                <Link
                                    href="/admin"
                                    className="relative px-3.5 py-1.5 text-sm font-medium transition-all duration-300 rounded-full text-foreground/60 hover:text-red-500 hover:bg-red-500/10"
                                >
                                    Admin
                                </Link>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-3 sm:gap-4">
                        <div className="hidden sm:flex items-center gap-2">
                            <ModeToggle className="h-9 w-9 px-0 text-foreground/60 hover:text-foreground hover:bg-muted/50" />
                            <ChangelogModal
                                trigger={
                                    <button className="p-2 text-foreground/60 hover:text-foreground hover:bg-muted/50 rounded-full transition-all relative group">
                                        <Sparkles className="w-5 h-5" />
                                        <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                                        </span>
                                    </button>
                                }
                            />
                            <NotificationBell />
                        </div>

                        <div className="flex items-center pl-2 sm:border-l sm:border-border/50 sm:ml-2">
                            <AuthButton />
                        </div>

                        {/* Mobile Menu Toggle */}
                        <button
                            className="md:hidden p-2 -mr-2 text-foreground/70 hover:text-foreground"
                            onClick={() => setIsMobileMenuOpen(true)}
                        >
                            <Menu className="h-6 w-6" />
                        </button>
                    </div>
                </div>
            </nav>

            <MobileMenu
                isOpen={isMobileMenuOpen}
                onClose={() => setIsMobileMenuOpen(false)}
                links={navLinks}
                isAdmin={isAdmin}
            />
        </>
    );
}
