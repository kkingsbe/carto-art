'use client';

import { useState, useEffect } from 'react';
import {
    Plus,
    Flag,
    MoreVertical,
    Trash2,
    Check,
    X,
    Settings,
    Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

interface FeatureFlag {
    id: string;
    key: string;
    name: string;
    description: string;
    enabled: boolean;
    enabled_percentage: number;
    created_at: string;
}

export default function FeatureFlagsPage() {
    const [flags, setFlags] = useState<FeatureFlag[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchFlags();
    }, []);

    const fetchFlags = async () => {
        try {
            const res = await fetch('/api/admin/feature-flags');
            if (res.ok) {
                const data = await res.json();
                setFlags(data.flags);
            }
        } catch (error) {
            toast.error('Failed to load feature flags');
        } finally {
            setIsLoading(false);
        }
    };

    const toggleFlag = async (id: string, currentState: boolean) => {
        try {
            const res = await fetch('/api/admin/feature-flags', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, enabled: !currentState })
            });

            if (res.ok) {
                setFlags(prev => prev.map(f => f.id === id ? { ...f, enabled: !currentState } : f));
                toast.success('Flag updated');
            }
        } catch (error) {
            toast.error('Failed to update flag');
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Feature Flags</h1>
                    <p className="text-gray-500 dark:text-gray-400">
                        Manage gradual rollouts and feature toggles.
                    </p>
                </div>
                <Button className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    New Flag
                </Button>
            </div>

            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                        <tr>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Feature</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Rollout</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Created</th>
                            <th className="px-6 py-4 text-right"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {flags.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                    No feature flags created yet.
                                </td>
                            </tr>
                        ) : (
                            flags.map((flag) => (
                                <tr key={flag.id} className="group hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-sm">{flag.name}</span>
                                            <code className="text-xs text-gray-400 mt-1">{flag.key}</code>
                                            {flag.description && (
                                                <p className="text-xs text-gray-500 mt-1 max-w-sm truncate">
                                                    {flag.description}
                                                </p>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <Switch
                                                checked={flag.enabled}
                                                onCheckedChange={() => toggleFlag(flag.id, flag.enabled)}
                                            />
                                            <Badge variant={flag.enabled ? "default" : "secondary"}>
                                                {flag.enabled ? "Active" : "Disabled"}
                                            </Badge>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1 w-32">
                                            <div className="flex justify-between text-[10px] text-gray-500">
                                                <span>{flag.enabled_percentage}%</span>
                                                <span>Rollout</span>
                                            </div>
                                            <div className="w-full bg-gray-100 dark:bg-gray-800 h-1 rounded-full overflow-hidden">
                                                <div
                                                    className="bg-blue-500 h-full transition-all"
                                                    style={{ width: `${flag.enabled_percentage}%` }}
                                                />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {new Date(flag.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                                            <MoreVertical className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
