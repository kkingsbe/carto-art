'use client';

import { useState, useEffect } from 'react';
import {
    Users,
    Shield,
    ShieldAlert,
    MoreVertical,
    Search,
    Loader2,
    Calendar,
    Mail,
    Sparkles,
    ArrowUpDown,
    ChevronUp,
    ChevronDown
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface Profile {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
    created_at: string;
    is_admin: boolean;
    last_active_at?: string;
    first_map_at?: string;
    first_export_at?: string;
    subscription_tier?: 'free' | 'carto_plus';
    subscription_status?: string;
    saved_projects_count?: number;
    total_exports?: number;
    top_export_format?: string | null;
}

type SortField = keyof Profile | 'status';
type SortOrder = 'asc' | 'desc';

export default function UsersPage() {
    const [users, setUsers] = useState<Profile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortConfig, setSortConfig] = useState<{ field: SortField; order: SortOrder }>({
        field: 'created_at',
        order: 'desc'
    });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await fetch('/api/admin/users');
            if (res.ok) {
                const data = await res.json();
                setUsers(data.users);
            }
        } catch (error) {
            toast.error('Failed to load users');
        } finally {
            setIsLoading(false);
        }
    };

    const getChurnRisk = (lastActive?: string) => {
        if (!lastActive) return 'unknown';
        const days = (Date.now() - new Date(lastActive).getTime()) / (1000 * 60 * 60 * 24);
        if (days > 30) return 'churned';
        if (days > 7) return 'at-risk';
        return 'active';
    };

    const toggleAdmin = async (userId: string, currentStatus: boolean) => {
        if (!confirm(`Are you sure you want to ${currentStatus ? 'remove' : 'grant'} admin privileges?`)) return;

        try {
            const res = await fetch(`/api/admin/users/${userId}/role`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_admin: !currentStatus })
            });

            if (res.ok) {
                setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_admin: !currentStatus } : u));
                toast.success('User role updated');
            }
        } catch (error) {
            toast.error('Failed to update user role');
        }
    };

    const handleSort = (field: SortField) => {
        setSortConfig(prev => ({
            field,
            order: prev.field === field && prev.order === 'asc' ? 'desc' : 'asc'
        }));
    };

    const filteredUsers = users.filter(u =>
        u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.display_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const sortedUsers = [...filteredUsers].sort((a, b) => {
        let aValue: any = a[sortConfig.field as keyof Profile];
        let bValue: any = b[sortConfig.field as keyof Profile];

        if (sortConfig.field === 'status') {
            const statusOrder: any = { 'active': 3, 'at-risk': 2, 'churned': 1, 'unknown': 0 };
            aValue = statusOrder[getChurnRisk(a.last_active_at)];
            bValue = statusOrder[getChurnRisk(b.last_active_at)];
        } else if (sortConfig.field === 'username') {
            // Sort by display_name if available, else username
            aValue = (a.display_name || a.username).toLowerCase();
            bValue = (b.display_name || b.username).toLowerCase();
        }

        if (aValue === bValue) return 0;
        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;

        const comparison = aValue > bValue ? 1 : -1;
        return sortConfig.order === 'asc' ? comparison : -comparison;
    });

    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
        );
    }

    const SortIcon = ({ field }: { field: SortField }) => {
        if (sortConfig.field !== field) return <ArrowUpDown className="w-3.5 h-3.5 ml-1 opacity-0 group-hover/head:opacity-100 transition-opacity" />;
        return sortConfig.order === 'asc' ? <ChevronUp className="w-3.5 h-3.5 ml-1 text-indigo-600" /> : <ChevronDown className="w-3.5 h-3.5 ml-1 text-indigo-600" />;
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
                <p className="text-gray-500 dark:text-gray-400">
                    Manage platform users and permissions.
                </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1 max-w-md w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                        className="pl-10"
                        placeholder="Search users..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                            <tr>
                                <th
                                    className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase cursor-pointer hover:text-gray-900 group/head transition-colors"
                                    onClick={() => handleSort('username')}
                                >
                                    <div className="flex items-center">
                                        User <SortIcon field="username" />
                                    </div>
                                </th>
                                <th
                                    className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase cursor-pointer hover:text-gray-900 group/head transition-colors"
                                    onClick={() => handleSort('is_admin')}
                                >
                                    <div className="flex items-center">
                                        Role <SortIcon field="is_admin" />
                                    </div>
                                </th>
                                <th
                                    className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase cursor-pointer hover:text-gray-900 group/head transition-colors"
                                    onClick={() => handleSort('subscription_tier')}
                                >
                                    <div className="flex items-center">
                                        Subscription <SortIcon field="subscription_tier" />
                                    </div>
                                </th>
                                <th
                                    className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase cursor-pointer hover:text-gray-900 group/head transition-colors"
                                    onClick={() => handleSort('status')}
                                >
                                    <div className="flex items-center">
                                        Status <SortIcon field="status" />
                                    </div>
                                </th>
                                <th
                                    className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase cursor-pointer hover:text-gray-900 group/head transition-colors"
                                    onClick={() => handleSort('total_exports')}
                                >
                                    <div className="flex items-center">
                                        Exports <SortIcon field="total_exports" />
                                    </div>
                                </th>
                                <th
                                    className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase cursor-pointer hover:text-gray-900 group/head transition-colors"
                                    onClick={() => handleSort('saved_projects_count')}
                                >
                                    <div className="flex items-center">
                                        Projects <SortIcon field="saved_projects_count" />
                                    </div>
                                </th>
                                <th
                                    className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase cursor-pointer hover:text-gray-900 group/head transition-colors"
                                    onClick={() => handleSort('created_at')}
                                >
                                    <div className="flex items-center">
                                        Joined <SortIcon field="created_at" />
                                    </div>
                                </th>
                                <th className="px-6 py-4 text-right"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {sortedUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                                        No users found matching your search.
                                    </td>
                                </tr>
                            ) : (
                                sortedUsers.map((user) => (
                                    <tr key={user.id} className="group hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center overflow-hidden">
                                                    {user.avatar_url ? (
                                                        <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <Users className="w-5 h-5 text-gray-400" />
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-sm">
                                                        {user.display_name || user.username}
                                                    </div>
                                                    <div className="text-xs text-gray-500">@{user.username}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {user.is_admin ? (
                                                <Badge className="bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800 gap-1">
                                                    <Shield className="w-3 h-3" />
                                                    Admin
                                                </Badge>
                                            ) : (
                                                <Badge variant="secondary">User</Badge>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {user.subscription_tier === 'carto_plus' ? (
                                                <Badge className="bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-800 gap-1">
                                                    <Sparkles className="w-3 h-3" />
                                                    Plus
                                                </Badge>
                                            ) : (
                                                <span className="text-sm text-gray-500">Free</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {(() => {
                                                const risk = getChurnRisk(user.last_active_at);
                                                return (
                                                    <Badge variant="secondary" className={
                                                        risk === 'active' ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' :
                                                            risk === 'at-risk' ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400' :
                                                                risk === 'churned' ? 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400' :
                                                                    ''
                                                    }>
                                                        {risk === 'active' ? 'Active' :
                                                            risk === 'at-risk' ? 'At Risk' :
                                                                risk === 'churned' ? 'Inactive' : 'Unknown'}
                                                    </Badge>
                                                );
                                            })()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium">{user.total_exports || 0}</div>
                                            {user.top_export_format && (
                                                <div className="text-xs text-gray-500 max-w-[120px] truncate" title={user.top_export_format}>
                                                    Top: {user.top_export_format}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium">{user.saved_projects_count || 0}</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-3.5 h-3.5" />
                                                {new Date(user.created_at).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => toggleAdmin(user.id, user.is_admin)}
                                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                {user.is_admin ? 'Demote' : 'Promote'}
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
