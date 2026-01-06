'use client';

import { useState, useEffect } from 'react';
import { Settings, Loader2, Save, Download, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface SiteConfig {
    key: string;
    value: number;
    description: string | null;
    updated_at: string;
}

const CONFIG_LABELS: Record<string, { label: string; icon: React.ReactNode; description: string }> = {
    'free_tier_daily_export_limit': {
        label: 'Daily Export Limit',
        icon: <Download className="w-4 h-4" />,
        description: 'Maximum exports per 24-hour rolling window for free tier users',
    },
    'free_tier_project_limit': {
        label: 'Project Limit',
        icon: <FolderOpen className="w-4 h-4" />,
        description: 'Maximum saved projects (maps) for free tier users',
    },
    'anon_daily_export_limit': {
        label: 'Anon Daily Export Limit',
        icon: <Download className="w-4 h-4" />,
        description: 'Maximum exports per 24-hour rolling window for anonymous users',
    },
};

export default function SettingsPage() {
    const [configs, setConfigs] = useState<SiteConfig[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState<string | null>(null);
    const [editedValues, setEditedValues] = useState<Record<string, string>>({});

    useEffect(() => {
        fetchConfigs();
    }, []);

    const fetchConfigs = async () => {
        try {
            const res = await fetch('/api/admin/settings');
            if (res.ok) {
                const data = await res.json();
                setConfigs(data.configs || []);
                // Initialize edited values
                const values: Record<string, string> = {};
                (data.configs || []).forEach((config: SiteConfig) => {
                    values[config.key] = String(config.value);
                });
                setEditedValues(values);
            }
        } catch (error) {
            toast.error('Failed to load settings');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async (key: string) => {
        const value = parseInt(editedValues[key], 10);
        if (isNaN(value) || value < 0) {
            toast.error('Value must be a positive number');
            return;
        }

        setIsSaving(key);
        try {
            const res = await fetch('/api/admin/settings', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key, value }),
            });

            if (res.ok) {
                toast.success('Setting saved');
                fetchConfigs(); // Refresh
            } else {
                const err = await res.json();
                toast.error(err.error || 'Failed to save');
            }
        } catch (error) {
            toast.error('Failed to save setting');
        } finally {
            setIsSaving(null);
        }
    };

    const hasChanged = (key: string) => {
        const config = configs.find(c => c.key === key);
        if (!config) return false;
        return String(config.value) !== editedValues[key];
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
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
                <p className="text-gray-500 dark:text-gray-400">
                    Configure free tier limits and site-wide settings.
                </p>
            </div>

            {/* Free Tier Limits Section */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                            <Settings className="w-5 h-5 text-blue-500" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold">Free Tier Limits</h2>
                            <p className="text-sm text-gray-500">
                                Control usage limits for free tier users. Carto Plus users have unlimited access.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                    {configs
                        .filter(config => config.key in CONFIG_LABELS)
                        .map(config => {
                            const meta = CONFIG_LABELS[config.key] || {
                                label: config.key,
                                icon: <Settings className="w-4 h-4" />,
                                description: config.description || '',
                            };

                            return (
                                <div key={config.key} className="px-6 py-5">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-start gap-3">
                                            <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 mt-0.5">
                                                {meta.icon}
                                            </div>
                                            <div>
                                                <Label className="text-base font-medium">
                                                    {meta.label}
                                                </Label>
                                                <p className="text-sm text-gray-500 mt-0.5">
                                                    {meta.description}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Input
                                                type="number"
                                                min="0"
                                                className="w-24 text-right font-mono"
                                                value={editedValues[config.key] || ''}
                                                onChange={(e) => setEditedValues(prev => ({
                                                    ...prev,
                                                    [config.key]: e.target.value,
                                                }))}
                                            />
                                            <Button
                                                size="sm"
                                                onClick={() => handleSave(config.key)}
                                                disabled={isSaving === config.key || !hasChanged(config.key)}
                                            >
                                                {isSaving === config.key ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <Save className="w-4 h-4" />
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                    {configs.filter(c => c.key in CONFIG_LABELS).length === 0 && (
                        <div className="px-6 py-12 text-center text-gray-500">
                            <p>No settings configured yet.</p>
                            <p className="text-sm mt-1">Run the database migration to add default settings.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
