'use client';

import { useState, useEffect } from 'react';
import { Loader2, Plus, Trash2, Key, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { logger } from '@/lib/logger';

interface ApiKey {
    id: string;
    name: string;
    key_prefix: string;
    created_at: string;
    last_used_at: string | null;
    tier: string;
}

export function KeyManager() {
    const [keys, setKeys] = useState<ApiKey[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [newKeyName, setNewKeyName] = useState('');
    const [createdKey, setCreatedKey] = useState<string | null>(null);

    // Fetch Keys
    useEffect(() => {
        fetchKeys();
    }, []);

    const fetchKeys = async () => {
        try {
            const res = await fetch('/api/v1/auth/keys');
            if (res.ok) {
                const data = await res.json();
                setKeys(data.keys);
            }
        } catch (error) {
            logger.error('Failed to load keys', { error });
        } finally {
            setIsLoading(false);
        }
    };

    const createKey = async () => {
        if (!newKeyName.trim()) return;
        setIsCreating(true);
        try {
            const res = await fetch('/api/v1/auth/keys', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newKeyName })
            });

            if (res.ok) {
                const data = await res.json();
                // Add optimistic update or fetch
                fetchKeys();
                setCreatedKey(data.key.token); // Show the full token
                setNewKeyName('');
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsCreating(false);
        }
    };

    const deleteKey = async (id: string) => {
        if (!confirm('Are you sure you want to revoke this API key? This cannot be undone.')) return;

        try {
            const res = await fetch(`/api/v1/auth/keys/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setKeys(keys.filter(k => k.id !== id));
            }
        } catch (error) {
            console.error(error);
        }
    };

    if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="space-y-8">

            {/* Creation Form */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium mb-4">Create New API Key</h3>
                <div className="flex gap-4">
                    <Input
                        placeholder="Key Name (e.g. Website Integration)"
                        value={newKeyName}
                        onChange={(e) => setNewKeyName(e.target.value)}
                        className="max-w-md"
                    />
                    <Button onClick={createKey} disabled={isCreating || !newKeyName.trim()}>
                        {isCreating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                        Generate Key
                    </Button>
                </div>

                {/* Success State */}
                {createdKey && (
                    <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
                        <p className="text-sm text-green-800 dark:text-green-300 font-medium mb-2">
                            API Key Generated Successfully
                        </p>
                        <p className="text-xs text-green-700 dark:text-green-400 mb-2">
                            Please copy this key now. You will not be able to see it again.
                        </p>
                        <div className="flex items-center gap-2">
                            <code className="bg-white dark:bg-black/50 px-3 py-2 rounded border border-green-200 dark:border-green-800 font-mono text-sm flex-1">
                                {createdKey}
                            </code>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => {
                                    navigator.clipboard.writeText(createdKey);
                                    // Toast or something
                                }}
                            >
                                <Copy className="w-4 h-4" />
                            </Button>
                        </div>
                        <Button variant="ghost" size="sm" className="mt-2" onClick={() => setCreatedKey(null)}>
                            Done
                        </Button>
                    </div>
                )}
            </div>

            {/* Keys List */}
            <div>
                <h3 className="text-lg font-medium mb-4">Your API Keys</h3>
                {keys.length === 0 ? (
                    <p className="text-gray-500 italic">No active API keys found.</p>
                ) : (
                    <div className="space-y-4">
                        {keys.map(key => (
                            <div key={key.id} className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                                <div className="flex items-start gap-4">
                                    <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-full text-blue-600 dark:text-blue-400">
                                        <Key className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-gray-900 dark:text-white">{key.name}</h4>
                                        <p className="text-sm font-mono text-gray-500 mt-1">
                                            {key.key_prefix}*************************
                                        </p>
                                        <div className="flex gap-4 mt-2 text-xs text-gray-500">
                                            <span>Created: {new Date(key.created_at).toLocaleDateString()}</span>
                                            <span>Last Used: {key.last_used_at ? new Date(key.last_used_at).toLocaleDateString() : 'Never'}</span>
                                        </div>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-gray-400 hover:text-red-500"
                                    onClick={() => deleteKey(key.id)}
                                >
                                    <Trash2 className="w-5 h-5" />
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
