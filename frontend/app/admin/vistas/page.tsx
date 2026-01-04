'use client';

import { useState, useEffect } from 'react';
import {
    Plus,
    MapPin,
    MoreVertical,
    Trash2,
    Check,
    X,
    Settings,
    Loader2,
    Copy,
    ChevronUp,
    ChevronDown,
    Save,
    Map as MapIcon,
    Globe
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Vista {
    id: string;
    name: string;
    description: string;
    location: {
        name: string;
        city?: string;
        subtitle?: string;
        center: [number, number];
        bounds: [[number, number], [number, number]];
        zoom: number;
    };
    enabled: boolean;
    display_order: number;
    thumbnail_url?: string;
    created_at: string;
}

export default function VistasPage() {
    const [vistas, setVistas] = useState<Vista[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingVista, setEditingVista] = useState<Vista | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Form state
    const [formName, setFormName] = useState('');
    const [formDescription, setFormDescription] = useState('');
    const [formLocationJson, setFormLocationJson] = useState('');
    const [formEnabled, setFormEnabled] = useState(true);

    useEffect(() => {
        fetchVistas();
    }, []);

    const fetchVistas = async () => {
        try {
            const res = await fetch('/api/admin/vistas');
            if (res.ok) {
                const data = await res.json();
                setVistas(data.vistas);
            }
        } catch (error) {
            toast.error('Failed to load vistas');
        } finally {
            setIsLoading(false);
        }
    };

    const resetForm = () => {
        setFormName('');
        setFormDescription('');
        setFormLocationJson('');
        setFormEnabled(true);
        setEditingVista(null);
    };

    const openCreateModal = () => {
        resetForm();
        setIsModalOpen(true);
    };

    const openEditModal = (vista: Vista) => {
        setEditingVista(vista);
        setFormName(vista.name);
        setFormDescription(vista.description || '');
        setFormLocationJson(JSON.stringify(vista.location, null, 2));
        setFormEnabled(vista.enabled);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        resetForm();
    };

    const saveVista = async () => {
        if (!formName.trim() || !formLocationJson.trim()) {
            toast.error('Name and Location JSON are required');
            return;
        }

        let parsedLocation;
        try {
            parsedLocation = JSON.parse(formLocationJson);
            // Basic validation
            if (!parsedLocation.center || !parsedLocation.zoom) {
                throw new Error('Invalid location format: center and zoom required');
            }
        } catch (e: any) {
            toast.error(`Invalid JSON: ${e.message}`);
            return;
        }

        setIsSaving(true);
        try {
            const method = editingVista ? 'PATCH' : 'POST';
            const body = {
                id: editingVista?.id,
                name: formName,
                description: formDescription,
                location: parsedLocation,
                enabled: formEnabled
            };

            const res = await fetch('/api/admin/vistas', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                const data = await res.json();
                if (editingVista) {
                    setVistas(prev => prev.map(v => v.id === editingVista.id ? data.vista : v));
                    toast.success('Vista updated');
                } else {
                    setVistas(prev => [...prev, data.vista]);
                    toast.success('Vista created');
                }
                closeModal();
            } else {
                const err = await res.json();
                toast.error(err.error || 'Failed to save vista');
            }
        } catch (error) {
            toast.error('An error occurred while saving');
        } finally {
            setIsSaving(false);
        }
    };

    const toggleEnable = async (vista: Vista) => {
        try {
            const res = await fetch('/api/admin/vistas', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: vista.id, enabled: !vista.enabled })
            });

            if (res.ok) {
                setVistas(prev => prev.map(v => v.id === vista.id ? { ...v, enabled: !v.enabled } : v));
                toast.success(vista.enabled ? 'Vista disabled' : 'Vista enabled');
            }
        } catch (error) {
            toast.error('Failed to toggle vista status');
        }
    };

    const deleteVista = async (id: string) => {
        if (!confirm('Are you sure you want to delete this vista?')) return;

        try {
            const res = await fetch(`/api/admin/vistas?id=${id}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                setVistas(prev => prev.filter(v => v.id !== id));
                toast.success('Vista deleted');
            }
        } catch (error) {
            toast.error('Failed to delete vista');
        }
    };

    const moveOrder = async (index: number, direction: 'up' | 'down') => {
        const newVistas = [...vistas];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;

        if (targetIndex < 0 || targetIndex >= vistas.length) return;

        // Swap the items
        const temp = newVistas[index];
        newVistas[index] = newVistas[targetIndex];
        newVistas[targetIndex] = temp;

        setVistas(newVistas);

        // Update display_order in DB for BOTH items
        try {
            await Promise.all([
                fetch('/api/admin/vistas', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: newVistas[index].id, display_order: index })
                }),
                fetch('/api/admin/vistas', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: newVistas[targetIndex].id, display_order: targetIndex })
                })
            ]);
        } catch (error) {
            toast.error('Failed to update sort order');
            fetchVistas(); // Refresh to original order
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
                    <h1 className="text-2xl font-bold tracking-tight">Vista Management</h1>
                    <p className="text-gray-500 dark:text-gray-400">
                        Configure curated locations for users to explore in the editor.
                    </p>
                </div>
                <Button className="flex items-center gap-2" onClick={openCreateModal}>
                    <Plus className="w-4 h-4" />
                    New Vista
                </Button>
            </div>

            {/* Modal Overlay */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeModal} />
                    <div className="relative z-10 w-full max-w-2xl mx-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
                        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                            <h2 className="text-lg font-semibold">{editingVista ? 'Edit Vista' : 'Create New Vista'}</h2>
                            <button onClick={closeModal} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6 overflow-y-auto">
                            <div className="space-y-2">
                                <Label htmlFor="vista-name">Display Name</Label>
                                <Input
                                    id="vista-name"
                                    placeholder="e.g., Manhattan Skyline"
                                    value={formName}
                                    onChange={(e) => setFormName(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="vista-desc">Description (optional)</Label>
                                <Textarea
                                    id="vista-desc"
                                    placeholder="Brief description seen by users..."
                                    value={formDescription}
                                    onChange={(e) => setFormDescription(e.target.value)}
                                    rows={2}
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="vista-location">Location JSON</Label>
                                    <button
                                        className="text-[10px] text-blue-500 hover:underline"
                                        onClick={() => {
                                            const example = {
                                                name: "Example Location",
                                                city: "City Name",
                                                center: [-73.9857, 40.7484],
                                                bounds: [[-74.0, 40.7], [-73.9, 40.8]],
                                                zoom: 12
                                            };
                                            setFormLocationJson(JSON.stringify(example, null, 2));
                                        }}
                                    >
                                        Insert Template
                                    </button>
                                </div>
                                <div className="relative group">
                                    <Textarea
                                        id="vista-location"
                                        placeholder='{"name": "...", "center": [...], "zoom": 12}'
                                        value={formLocationJson}
                                        onChange={(e) => setFormLocationJson(e.target.value)}
                                        rows={10}
                                        className="font-mono text-xs"
                                    />
                                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Badge variant="outline" className="bg-white/80 dark:bg-gray-800/80">JSON</Badge>
                                    </div>
                                </div>
                                <p className="text-[10px] text-gray-400">
                                    Tip: You can copy the "location" object from a project export or example config.
                                </p>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                                <div>
                                    <p className="font-medium">Active Status</p>
                                    <p className="text-sm text-gray-500 text-[10px]">Show this vista in the editor gallery</p>
                                </div>
                                <Switch
                                    checked={formEnabled}
                                    onCheckedChange={setFormEnabled}
                                />
                            </div>
                        </div>

                        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3 bg-gray-50/50 dark:bg-gray-800/20">
                            <Button variant="outline" onClick={closeModal}>Cancel</Button>
                            <Button onClick={saveVista} disabled={isSaving}>
                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                                {editingVista ? 'Update Vista' : 'Create Vista'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                        <tr>
                            <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Order</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Vista</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Coordinates</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {vistas.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-gray-500 italic">
                                    No vistas configured yet.
                                </td>
                            </tr>
                        ) : (
                            vistas.map((vista, index) => (
                                <tr key={vista.id} className="group hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1">
                                            <button
                                                disabled={index === 0}
                                                onClick={() => moveOrder(index, 'up')}
                                                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded disabled:opacity-30"
                                            >
                                                <ChevronUp className="w-3 h-3" />
                                            </button>
                                            <button
                                                disabled={index === vistas.length - 1}
                                                onClick={() => moveOrder(index, 'down')}
                                                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded disabled:opacity-30"
                                            >
                                                <ChevronDown className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0">
                                                <MapPin className="w-5 h-5 text-blue-500" />
                                            </div>
                                            <div>
                                                <div className="font-semibold text-sm">{vista.name}</div>
                                                <div className="text-[10px] text-gray-500 truncate max-w-[200px]">
                                                    {vista.location.city || vista.location.subtitle || 'No city'}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-1.5 font-mono text-[9px] text-gray-400">
                                                <Globe className="w-3 h-3" />
                                                <span>{vista.location.center[1].toFixed(4)}, {vista.location.center[0].toFixed(4)}</span>
                                            </div>
                                            <div className="text-[10px] text-gray-500">
                                                Zoom {vista.location.zoom}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <Switch
                                                checked={vista.enabled}
                                                onCheckedChange={() => toggleEnable(vista)}
                                            />
                                            <Badge variant={vista.enabled ? "default" : "secondary"} className="text-[9px] uppercase font-bold py-0 h-4">
                                                {vista.enabled ? "Active" : "Disabled"}
                                            </Badge>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <Button variant="ghost" size="icon" onClick={() => openEditModal(vista)}>
                                                <Settings className="w-4 h-4 text-gray-400 hover:text-blue-500" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => deleteVista(vista.id)}>
                                                <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500" />
                                            </Button>
                                        </div>
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

