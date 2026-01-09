'use client';

import { useState, useEffect } from 'react';
import {
    getAllFeaturedMaps,
    createFeaturedMap,
    updateFeaturedMap,
    deleteFeaturedMap,
    type FeaturedMap,
    type FeaturedMapInput
} from '@/lib/actions/featured-maps';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Loader2, GripVertical, ExternalLink, ImageIcon } from 'lucide-react';

export default function FeaturedMapsPage() {
    const [maps, setMaps] = useState<FeaturedMap[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingMap, setEditingMap] = useState<FeaturedMap | null>(null);

    const fetchMaps = async () => {
        setIsLoading(true);
        try {
            const data = await getAllFeaturedMaps();
            setMaps(data);
        } catch (error) {
            toast.error('Failed to load featured maps');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchMaps();
    }, []);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSaving(true);
        const formData = new FormData(e.currentTarget);

        const payload: FeaturedMapInput = {
            title: formData.get('title') as string,
            description: formData.get('description') as string,
            image_url: formData.get('image_url') as string,
            link_url: formData.get('link_url') as string,
            display_order: Number(formData.get('display_order')) || 0,
            is_active: formData.get('is_active') === 'on',
        };

        try {
            if (editingMap) {
                await updateFeaturedMap(editingMap.id, payload);
                toast.success('Featured map updated');
            } else {
                await createFeaturedMap(payload);
                toast.success('Featured map created');
            }
            setIsDialogOpen(false);
            setEditingMap(null);
            fetchMaps();
        } catch (error: any) {
            toast.error(error.message || 'Failed to save featured map');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (map: FeaturedMap) => {
        if (!confirm(`Are you sure you want to delete "${map.title}"?`)) return;

        try {
            await deleteFeaturedMap(map.id);
            toast.success('Featured map deleted');
            fetchMaps();
        } catch (error: any) {
            toast.error('Failed to delete featured map');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Featured Maps</h1>
                    <p className="text-muted-foreground">Manage maps displayed on the landing page.</p>
                </div>
                <Button onClick={() => {
                    setEditingMap(null);
                    setIsDialogOpen(true);
                }}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Featured Map
                </Button>
            </div>

            {isLoading ? (
                <div className="flex justify-center p-12">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
            ) : (
                <div className="border rounded-lg bg-card">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[50px]"></TableHead>
                                <TableHead className="w-[80px]">Image</TableHead>
                                <TableHead>Title</TableHead>
                                <TableHead>Link</TableHead>
                                <TableHead>Order</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {maps.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                        No featured maps yet.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                maps.map((map) => (
                                    <TableRow key={map.id}>
                                        <TableCell>
                                            <GripVertical className="w-4 h-4 text-muted-foreground/50" />
                                        </TableCell>
                                        <TableCell>
                                            <div className="w-12 h-12 rounded-md overflow-hidden bg-muted relative group">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img
                                                    src={map.image_url}
                                                    alt={map.title}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).src = 'https://placehold.co/100x100?text=No+Image';
                                                    }}
                                                />
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            <div>{map.title}</div>
                                            {map.description && (
                                                <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                                                    {map.description}
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                                                {map.link_url}
                                            </code>
                                        </TableCell>
                                        <TableCell>{map.display_order}</TableCell>
                                        <TableCell>
                                            <span className={`px-2 py-1 rounded-full text-xs ${map.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {map.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="ghost" size="icon" onClick={() => {
                                                    setEditingMap(map);
                                                    setIsDialogOpen(true);
                                                }}>
                                                    <Pencil className="w-4 h-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleDelete(map)}>
                                                    <Trash2 className="w-4 h-4 text-red-500" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            )}

            <Dialog open={isDialogOpen} onOpenChange={(open) => {
                setIsDialogOpen(open);
                if (!open) setEditingMap(null);
            }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingMap ? 'Edit Featured Map' : 'Add Featured Map'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">Title</Label>
                            <Input id="title" name="title" defaultValue={editingMap?.title} required placeholder="e.g. New York City" />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description (Optional)</Label>
                            <Textarea id="description" name="description" defaultValue={editingMap?.description || ''} placeholder="Brief marketing text..." />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="image_url">Image URL</Label>
                            <div className="flex gap-2">
                                <Input id="image_url" name="image_url" defaultValue={editingMap?.image_url} required placeholder="https://..." />
                                <div className="flex-shrink-0 w-10 h-10 border rounded bg-muted flex items-center justify-center">
                                    <ImageIcon className="w-4 h-4 text-muted-foreground" />
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground">Link to a poster render or marketing image.</p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="link_url">Target URL</Label>
                            <Input id="link_url" name="link_url" defaultValue={editingMap?.link_url} required placeholder="/store/product-slug" />
                            <p className="text-xs text-muted-foreground">Where the user goes when they click (e.g. /store).</p>
                        </div>

                        <div className="flex items-center gap-6 pt-2">
                            <div className="space-y-2 w-24">
                                <Label htmlFor="display_order">Order</Label>
                                <Input id="display_order" name="display_order" type="number" defaultValue={editingMap?.display_order || 0} />
                            </div>

                            <div className="flex items-center gap-2 pt-6">
                                <Switch id="is_active" name="is_active" defaultChecked={editingMap ? editingMap.is_active : true} />
                                <Label htmlFor="is_active">Active</Label>
                            </div>
                        </div>

                        <Button type="submit" className="w-full" disabled={isSaving}>
                            {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            {editingMap ? 'Update' : 'Create'} Featured Map
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
