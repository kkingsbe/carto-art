import { ReactNode } from 'react';
import Link from 'next/link';
import { protectAdminPage } from '@/lib/admin-auth';
import {
    LayoutDashboard,
    Flag,
    Users,
    BarChart3,
    Settings,
    Activity,
    MessageSquare,
    ExternalLink,
    Download
} from 'lucide-react';

interface AdminLayoutProps {
    children: ReactNode;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
    await protectAdminPage();

    const navItems = [
        { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
        { label: 'Exports', href: '/admin/exports', icon: Download },
        { label: 'Feature Flags', href: '/admin/feature-flags', icon: Flag },
        { label: 'Users', href: '/admin/users', icon: Users },
        { label: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
        { label: 'Activity', href: '/admin/activity', icon: Activity },
        { label: 'Feedback', href: '/admin/feedback', icon: MessageSquare },
    ];

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden">
            {/* Sidebar */}
            <aside className="w-64 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex flex-col h-full">
                <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
                    <div className="w-8 h-8 bg-black dark:bg-white rounded flex items-center justify-center">
                        <span className="text-white dark:text-black font-bold">C</span>
                    </div>
                    <span className="font-bold text-lg tracking-tight">Admin</span>
                </div>

                <nav className="flex-1 overflow-y-auto p-4 space-y-1">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-colors"
                        >
                            <item.icon className="w-4 h-4" />
                            {item.label}
                        </Link>
                    ))}
                </nav>

                <div className="p-4 border-t border-gray-100 dark:border-gray-800">
                    <Link
                        href="/"
                        className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                        <ExternalLink className="w-4 h-4" />
                        Back to Site
                    </Link>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-black/20">
                <header className="h-16 border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md sticky top-0 z-10 flex items-center px-8">
                    <div className="flex-1">
                        <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            Carto-Art Admin
                        </h2>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-800" />
                    </div>
                </header>

                <div className="p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
