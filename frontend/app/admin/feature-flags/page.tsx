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
    Loader2,
    Copy
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';

interface FeatureFlag {
    id: string;
    key: string;
    name: string;
    description: string;
    enabled_production: boolean;
    enabled_development: boolean;
    enabled_percentage: number;
    created_at: string;
}

export default function FeatureFlagsPage() {
    const [flags, setFlags] = useState<FeatureFlag[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [createdFlagId, setCreatedFlagId] = useState<string | null>(null);

    // Form state
    const [formName, setFormName] = useState('');
    const [formKey, setFormKey] = useState('');
    const [formDescription, setFormDescription] = useState('');
    const [formEnabledProduction, setFormEnabledProduction] = useState(false);
    const [formEnabledDevelopment, setFormEnabledDevelopment] = useState(false);
    const [formPercentage, setFormPercentage] = useState(100);

    useEffect(() => {
        fetchFlags();
    }, []);

    // Auto-generate key from name
    useEffect(() => {
        const generatedKey = formName
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .replace(/\s+/g, '_')
            .slice(0, 50);
        setFormKey(generatedKey);
    }, [formName]);

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

    const toggleFlag = async (id: string, environment: 'production' | 'development', currentState: boolean) => {
        try {
            const update = environment === 'production'
                ? { enabled_production: !currentState }
                : { enabled_development: !currentState };

            const res = await fetch('/api/admin/feature-flags', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, ...update })
            });

            if (res.ok) {
                setFlags(prev => prev.map(f => f.id === id ? { ...f, ...update } : f));
                toast.success('Flag updated');
            }
        } catch (error) {
            toast.error('Failed to update flag');
        }
    };

    const resetForm = () => {
        setFormName('');
        setFormKey('');
        setFormDescription('');
        setFormEnabledProduction(false);
        setFormEnabledDevelopment(false);
        setFormPercentage(100);
        setCreatedFlagId(null);
    };

    const openModal = () => {
        resetForm();
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        resetForm();
    };

    const createFlag = async () => {
        if (!formKey.trim() || !formName.trim()) {
            toast.error('Name and key are required');
            return;
        }

        setIsCreating(true);
        try {
            const res = await fetch('/api/admin/feature-flags', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    key: formKey,
                    name: formName,
                    description: formDescription,
                    enabled_production: formEnabledProduction,
                    enabled_development: formEnabledDevelopment,
                    enabled_percentage: formPercentage
                })
            });

            if (res.ok) {
                const data = await res.json();
                const newFlag = data.flag;
                setFlags(prev => [newFlag, ...prev]);
                setCreatedFlagId(newFlag.id);
                toast.success('Feature flag created');
            } else {
                const err = await res.json();
                toast.error(err.error || 'Failed to create flag');
            }
        } catch (error) {
            toast.error('Failed to create flag');
        } finally {
            setIsCreating(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success('Copied to clipboard');
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
                <Button className="flex items-center gap-2" onClick={openModal}>
                    <Plus className="w-4 h-4" />
                    New Flag
                </Button>
            </div>

            {/* Modal Overlay */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={closeModal}
                    />

                    {/* Modal Content */}
                    <div className="relative z-10 w-full max-w-lg mx-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl overflow-hidden">
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                    <Flag className="w-5 h-5 text-blue-500" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold">Create Feature Flag</h2>
                                    <p className="text-sm text-gray-500">Define a new feature toggle</p>
                                </div>
                            </div>
                            <button
                                onClick={closeModal}
                                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6 space-y-5">
                            {createdFlagId ? (
                                /* Success State */
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
                                        <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center shrink-0">
                                            <Check className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-green-800 dark:text-green-200">
                                                Flag created successfully!
                                            </p>
                                            <p className="text-sm text-green-600 dark:text-green-400">
                                                Use the ID below in your layout guards.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-gray-500">Flag ID</Label>
                                        <div className="flex items-center gap-2">
                                            <code className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-800 rounded-lg font-mono text-sm break-all">
                                                {createdFlagId}
                                            </code>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => copyToClipboard(createdFlagId)}
                                            >
                                                <Copy className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-gray-500">Flag Key</Label>
                                        <div className="flex items-center gap-2">
                                            <code className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-800 rounded-lg font-mono text-sm">
                                                {formKey}
                                            </code>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => copyToClipboard(formKey)}
                                            >
                                                <Copy className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 font-medium">Usage Example:</p>
                                        <pre className="text-xs bg-gray-900 text-gray-100 p-3 rounded-lg overflow-x-auto">
                                            {`// In a layout.tsx file
import { isFeatureEnabled } from '@/lib/feature-flags';

const isEnabled = await isFeatureEnabled('${formKey}');
if (!isEnabled) redirect('/');`}
                                        </pre>
                                    </div>
                                </div>
                            ) : (
                                /* Form State */
                                <>
                                    <div className="space-y-2">
                                        <Label htmlFor="flag-name">Name</Label>
                                        <Input
                                            id="flag-name"
                                            placeholder="e.g., New Dashboard Design"
                                            value={formName}
                                            onChange={(e) => setFormName(e.target.value)}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="flag-key">Key</Label>
                                        <Input
                                            id="flag-key"
                                            placeholder="e.g., new_dashboard_design"
                                            value={formKey}
                                            onChange={(e) => setFormKey(e.target.value)}
                                            className="font-mono"
                                        />
                                        <p className="text-xs text-gray-500">
                                            Auto-generated from name. Used in code to check the flag.
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="flag-description">Description (optional)</Label>
                                        <Input
                                            id="flag-description"
                                            placeholder="What does this flag control?"
                                            value={formDescription}
                                            onChange={(e) => setFormDescription(e.target.value)}
                                        />
                                    </div>

                                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                                        <div>
                                            <p className="font-medium">Enable in Production</p>
                                            <p className="text-sm text-gray-500">Active for live users</p>
                                        </div>
                                        <Switch
                                            checked={formEnabledProduction}
                                            onCheckedChange={setFormEnabledProduction}
                                        />
                                    </div>

                                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                                        <div>
                                            <p className="font-medium">Enable in Development</p>
                                            <p className="text-sm text-gray-500">Active for local dev</p>
                                        </div>
                                        <Switch
                                            checked={formEnabledDevelopment}
                                            onCheckedChange={setFormEnabledDevelopment}
                                        />
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <Label>Rollout Percentage</Label>
                                            <span className="text-sm font-semibold text-blue-600">{formPercentage}%</span>
                                        </div>
                                        <Slider
                                            value={[formPercentage]}
                                            onValueChange={(v) => setFormPercentage(v[0])}
                                            max={100}
                                            step={1}
                                            className="w-full"
                                        />
                                        <p className="text-xs text-gray-500">
                                            Percentage of users who will see this feature when enabled.
                                        </p>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 flex justify-end gap-3">
                            {createdFlagId ? (
                                <Button onClick={closeModal}>
                                    Done
                                </Button>
                            ) : (
                                <>
                                    <Button variant="outline" onClick={closeModal}>
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={createFlag}
                                        disabled={isCreating || !formKey.trim() || !formName.trim()}
                                    >
                                        {isCreating ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                Creating...
                                            </>
                                        ) : (
                                            'Create Flag'
                                        )}
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                        <tr>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Feature</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Production</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Development</th>
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
                                            <div className="flex items-center gap-2 mt-1">
                                                <code className="text-xs text-gray-400">{flag.key}</code>
                                                <button
                                                    onClick={() => copyToClipboard(flag.key)}
                                                    className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-gray-600"
                                                    title="Copy key"
                                                >
                                                    <Copy className="w-3 h-3" />
                                                </button>
                                            </div>
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
                                                checked={flag.enabled_production}
                                                onCheckedChange={() => toggleFlag(flag.id, 'production', flag.enabled_production)}
                                            />
                                            <Badge variant={flag.enabled_production ? "default" : "secondary"}>
                                                {flag.enabled_production ? "Active" : "Off"}
                                            </Badge>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <Switch
                                                checked={flag.enabled_development}
                                                onCheckedChange={() => toggleFlag(flag.id, 'development', flag.enabled_development)}
                                            />
                                            <Badge variant={flag.enabled_development ? "default" : "secondary"}>
                                                {flag.enabled_development ? "Active" : "Off"}
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
                                        <button
                                            onClick={() => copyToClipboard(flag.id)}
                                            className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                                            title="Copy ID"
                                        >
                                            <Copy className="w-4 h-4" />
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
