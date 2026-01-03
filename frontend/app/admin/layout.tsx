import { ReactNode } from 'react';
import { protectAdminPage } from '@/lib/admin-auth';
import { AdminSidebarLayout } from '@/components/admin/AdminSidebarLayout';

interface AdminLayoutProps {
    children: ReactNode;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
    await protectAdminPage();

    return (
        <AdminSidebarLayout>
            {children}
        </AdminSidebarLayout>
    );
}
