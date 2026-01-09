import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { X, ChevronRight, LayoutDashboard, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { usePathname } from 'next/navigation';
import { ModeToggle } from '@/components/mode-toggle';

interface NavLink {
    href: string;
    label: string;
}

interface MobileMenuProps {
    isOpen: boolean;
    onClose: () => void;
    links: NavLink[];
    isAdmin?: boolean;
}

export function MobileMenu({ isOpen, onClose, links, isAdmin }: MobileMenuProps) {
    const pathname = usePathname();

    // Prevent body scroll when menu is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed inset-y-0 right-0 z-[70] w-full max-w-sm border-l border-border bg-background shadow-2xl"
                    >
                        <div className="flex h-full flex-col">
                            {/* Header */}
                            <div className="flex items-center justify-between border-b px-6 py-4">
                                <span className="text-lg font-bold">Menu</span>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={onClose}
                                    className="h-9 w-9 rounded-full hover:bg-muted"
                                >
                                    <X className="h-5 w-5" />
                                </Button>
                            </div>

                            {/* Content */}
                            <nav className="flex-1 overflow-y-auto px-6 py-6 font-medium">
                                <ul className="space-y-2">
                                    {links.map((link) => {
                                        const isActive = pathname === link.href;
                                        return (
                                            <li key={link.href}>
                                                <Link
                                                    href={link.href}
                                                    onClick={onClose}
                                                    className={cn(
                                                        "flex items-center justify-between rounded-md p-3 transition-colors",
                                                        isActive
                                                            ? "bg-primary/10 text-primary"
                                                            : "hover:bg-muted text-foreground/80 hover:text-foreground"
                                                    )}
                                                >
                                                    <span>{link.label}</span>
                                                    <ChevronRight className={cn("h-4 w-4 opacity-50", isActive && "opacity-100")} />
                                                </Link>
                                            </li>
                                        );
                                    })}

                                    <li className="flex items-center justify-between rounded-md p-3 text-foreground/80 hover:bg-muted hover:text-foreground transition-colors">
                                        <span>Appearance</span>
                                        <ModeToggle className="h-8 w-8 p-0 bg-transparent hover:bg-transparent" />
                                    </li>

                                    {isAdmin && (
                                        <>
                                            <li className="my-4 border-t border-border/50" />
                                            <li>
                                                <Link
                                                    href="/admin"
                                                    onClick={onClose}
                                                    className="flex items-center gap-3 rounded-md p-3 text-red-500 hover:bg-red-500/10 transition-colors"
                                                >
                                                    <LayoutDashboard className="h-5 w-5" />
                                                    <span>Admin Dashboard</span>
                                                </Link>
                                            </li>
                                        </>
                                    )}
                                </ul>

                                <div className="mt-8 rounded-xl bg-muted/50 p-4">
                                    <h4 className="mb-2 text-sm font-semibold text-muted-foreground">Quick Actions</h4>
                                    <div className="grid gap-2">
                                        <Link
                                            href="/profile"
                                            onClick={onClose}
                                            className="flex items-center gap-2 text-sm hover:underline"
                                        >
                                            <Settings className="h-4 w-4" />
                                            Account Settings
                                        </Link>
                                    </div>
                                </div>
                            </nav>


                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
