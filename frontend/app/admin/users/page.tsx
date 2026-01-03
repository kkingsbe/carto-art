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
    Mail
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
}

export default function UsersPage() {
    const [users, setUsers] = useState<Profile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

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

    const filteredUsers = users.filter(u =>
        u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.display_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
        );
    }

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
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">User</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Role</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Joined</th>
                                <th className="px-6 py-4 text-right"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                                        No users found matching your search.
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((user) => (
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
