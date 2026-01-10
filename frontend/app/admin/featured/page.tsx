'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Plus, GripVertical, Trash2, Pencil, ExternalLink, Image as ImageIcon, Link as LinkIcon, Loader2, Sparkles } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DroppableProvided, DraggableProvided } from '@hello-pangea/dnd';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { FeaturedMapSelector } from '@/components/admin/FeaturedMapSelector';
import { getActiveFeaturedMaps, reorderFeaturedMaps, deleteFeaturedMap, type FeaturedMap } from '@/lib/actions/featured-maps';
import { getMapById } from '@/lib/actions/maps';
import { exportMapToPNG } from '@/lib/export/exportCanvas';
import { uploadExportThumbnail, getThumbnailUploadUrl } from '@/lib/actions/export-storage';
import { EXPORT_RESOLUTIONS, type ExportResolutionKey } from '@/lib/export/constants';
import { calculateTargetResolution } from '@/lib/export/resolution';

export default function FeaturedMapsPage() {
    const [maps, setMaps] = useState<FeaturedMap[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [editingMap, setEditingMap] = useState<Partial<FeaturedMap> | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedResolution, setSelectedResolution] = useState<string>('POSTER_MEDIUM');
    const supabase = createClient();

    useEffect(() => {
        loadMaps();
    }, []);

    async function loadMaps() {
        try {
            const data = await getActiveFeaturedMaps();
            setMaps(data);
        } catch (error) {
            toast.error('Failed to load featured maps');
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }

    const handleDragEnd = (result: any) => {
        if (!result.destination) return;

        const items = Array.from(maps);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        setMaps(items);

        // Save new order
        const updates = items.map((map, index) => ({
            id: map.id,
            display_order: index
        }));

        reorderFeaturedMaps(updates).catch(() => {
            toast.error('Failed to save order');
            loadMaps(); // Revert on error
        });
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to remove this map from featured?')) return;

        try {
            await deleteFeaturedMap(id);
            setMaps(maps.filter(m => m.id !== id));
            toast.success('Map removed');
        } catch (error) {
            toast.error('Failed to remove map');
        }
    };

    const handleSave = async () => {
        if (!editingMap) return;

        setIsSaving(true);
        try {
            if (editingMap.id) {
                // Update existing
                const { error } = await (supabase.from('featured_maps') as any)
                    .update({
                        title: editingMap.title,
                        description: editingMap.description,
                        image_url: editingMap.image_url,
                        link_url: editingMap.link_url,
                        is_active: editingMap.is_active
                    })
                    .eq('id', editingMap.id);

                if (error) throw error;
                toast.success('Map updated');
            } else {
                // Create new
                const { error } = await (supabase.from('featured_maps') as any)
                    .insert([{
                        ...editingMap,
                        display_order: maps.length,
                        is_active: true
                    }]);

                if (error) throw error;
                toast.success('Map added');
            }

            setIsDialogOpen(false);
            loadMaps();
            setEditingMap(null);
        } catch (error) {
            console.error(error);
            toast.error('Failed to save changes');
        } finally {
            setIsSaving(false);
        }
    };

    const handleGenerateHighRes = async () => {
        if (!editingMap?.link_url) {
            toast.error('Link URL is required to identify the map');
            return;
        }

        // Extract map ID from link_url (e.g. /map/uuid)
        const match = editingMap.link_url.match(/\/map\/([a-f0-9-]+)/);
        if (!match) {
            toast.error('Could not extract Map ID from Link URL. Expected format: /map/[uuid]');
            return;
        }
        const mapId = match[1];

        setIsGenerating(true);
        try {
            const map = await getMapById(mapId);
            if (!map) throw new Error('Map not found');

            const resConfig = EXPORT_RESOLUTIONS[selectedResolution as ExportResolutionKey];
            if (!resConfig) throw new Error('Invalid resolution');

            // Calculate actual width/height
            const targetResolution = calculateTargetResolution(
                resConfig,
                map.config.format.aspectRatio,
                map.config.format.orientation
            );

            // Client-side export (headless)
            let blob = await exportMapToPNG({
                config: map.config,
                resolution: targetResolution,
                onProgress: (stage, percent) => {
                    // Optional: show toast progress?
                }
            });

            // Direct Upload to Supabase Storage (Bypass Next.js Server Actions 100MB limit for body)
            // Log blob size for debugging
            let blobSizeMB = (blob.size / (1024 * 1024)).toFixed(2);
            console.log(`Generated blob size: ${blobSizeMB} MB (${blob.size} bytes)`);

            // If PNG exceeds 50MB, convert to JPEG for better compression
            if (blob.size > 50 * 1024 * 1024) {
                console.log('PNG too large, converting to JPEG...');
                toast.info(`Converting to JPEG for better compression (original: ${blobSizeMB} MB)`);

                // Convert PNG blob to JPEG
                const img = new Image();
                const imageUrl = URL.createObjectURL(blob);
                await new Promise((resolve, reject) => {
                    img.onload = resolve;
                    img.onerror = reject;
                    img.src = imageUrl;
                });

                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                if (!ctx) throw new Error('Failed to get canvas context');

                ctx.drawImage(img, 0, 0);
                URL.revokeObjectURL(imageUrl);

                blob = await new Promise<Blob>((resolve, reject) => {
                    canvas.toBlob(
                        (b) => b ? resolve(b) : reject(new Error('Failed to convert to JPEG')),
                        'image/jpeg',
                        0.95 // High quality JPEG
                    );
                });

                blobSizeMB = (blob.size / (1024 * 1024)).toFixed(2);
                console.log(`JPEG size: ${blobSizeMB} MB`);
                toast.success(`Compressed to ${blobSizeMB} MB`);
            }

            // Check if still too large
            if (blob.size > 50 * 1024 * 1024) {
                throw new Error(`File too large (${blobSizeMB} MB). Supabase free tier has a 50MB limit. Please use a smaller resolution.`);
            }

            // Determine content type based on blob
            const contentType = blob.type || 'image/png';

            // 1. Get Signed URL
            const { signedUrl, publicUrl } = await getThumbnailUploadUrl(contentType);

            // 2. Upload directly
            const uploadRes = await fetch(signedUrl, {
                method: 'PUT',
                headers: { 'Content-Type': contentType },
                body: blob
            });

            if (!uploadRes.ok) {
                const errorText = await uploadRes.text();
                console.error('Upload failed:', uploadRes.status, errorText);
                throw new Error(`Failed to upload image to storage: ${uploadRes.status} ${errorText}`);
            }

            setEditingMap(prev => prev ? ({ ...prev, image_url: publicUrl }) : null);
            toast.success('High-res image generated and uploaded!');
        } catch (error: any) {
            console.error('Generation failed:', error);
            toast.error(`Failed to generate image: ${error.message}`);
        } finally {
            setIsGenerating(false);
        }
    };

    if (isLoading) {
        return <div className="p-8 text-center">Loading...</div>;
    }

    return (
        <div className="container py-8 max-w-4xl space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Featured Maps</h1>
                    <p className="text-muted-foreground mt-2">
                        Manage maps displayed on the landing page. Drag to reorder.
                    </p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <button
                            className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md flex items-center gap-2"
                            onClick={() => setEditingMap({})}
                        >
                            <Plus className="w-4 h-4" />
                            Add Featured Map
                        </button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>{editingMap?.id ? 'Edit Map' : 'Add New Map'}</DialogTitle>
                            <DialogDescription>
                                Configure the map details as they will appear on the landing page.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-6 py-4">
                            {/* Map Selector for new entries */}
                            {!editingMap?.id && !editingMap?.link_url && (
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Select from Gallery</label>
                                    <div className="border rounded-lg p-4 bg-muted/20">
                                        <FeaturedMapSelector
                                            onCancel={() => { }}
                                            onSelect={(map) => {
                                                setEditingMap({
                                                    ...editingMap,
                                                    title: map.title,
                                                    description: map.subtitle || '',
                                                    image_url: map.thumbnail_url || '',
                                                    link_url: `/map/${map.id}`,
                                                    is_active: true
                                                });
                                            }}
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="grid gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Title</label>
                                    <input
                                        value={editingMap?.title || ''}
                                        onChange={e => setEditingMap(prev => prev ? ({ ...prev, title: e.target.value }) : null)}
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                                        placeholder="e.g. San Francisco"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Description</label>
                                    <textarea
                                        value={editingMap?.description || ''}
                                        onChange={e => setEditingMap(prev => prev ? ({ ...prev, description: e.target.value }) : null)}
                                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                                        placeholder="Brief description..."
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Link URL</label>
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <LinkIcon className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                                            <input
                                                value={editingMap?.link_url || ''}
                                                onChange={e => setEditingMap(prev => prev ? ({ ...prev, link_url: e.target.value }) : null)}
                                                className="flex h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm ring-offset-background"
                                                placeholder="/map/..."
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Image URL</label>
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <ImageIcon className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                                            <input
                                                value={editingMap?.image_url || ''}
                                                onChange={e => setEditingMap(prev => prev ? ({ ...prev, image_url: e.target.value }) : null)}
                                                className="flex h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm ring-offset-background font-mono text-xs"
                                                placeholder="https://..."
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* High Res Generation Tool */}
                                <div className="rounded-lg border border-border bg-card p-4 space-y-4">
                                    <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                                        <Sparkles className="w-4 h-4 text-amber-500" />
                                        <span>Generate High-Resolution Image</span>
                                    </div>

                                    <p className="text-xs text-muted-foreground">
                                        Generate a print-quality image from the map source and upload it to storage.
                                        This replaces the image URL above.
                                    </p>

                                    <div className="flex items-end gap-3">
                                        <div className="flex-1 space-y-1.5">
                                            <label className="text-xs font-medium text-muted-foreground">Resolution</label>
                                            <select
                                                value={selectedResolution}
                                                onChange={(e) => setSelectedResolution(e.target.value)}
                                                className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                {Object.entries(EXPORT_RESOLUTIONS)
                                                    .filter(([key]) => !['THUMBNAIL', 'PHONE_WALLPAPER', 'LAPTOP_WALLPAPER', 'DESKTOP_4K'].includes(key))
                                                    .map(([key, res]) => (
                                                        <option key={key} value={key}>
                                                            {res.name} ({res.longEdge}px long edge)
                                                        </option>
                                                    ))}
                                            </select>
                                        </div>

                                        <button
                                            onClick={handleGenerateHighRes}
                                            disabled={isGenerating || !editingMap?.link_url}
                                            className="h-9 px-4 bg-gray-900 text-white dark:bg-white dark:text-gray-900 rounded-md font-medium text-sm flex items-center gap-2 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed min-w-[120px] justify-center"
                                        >
                                            {isGenerating ? (
                                                <>
                                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                    Generating...
                                                </>
                                            ) : (
                                                'Generate'
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {/* Preview */}
                                {editingMap?.image_url && (
                                    <div className="aspect-[2/3] w-32 rounded-lg border overflow-hidden bg-muted relative group">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={editingMap.image_url}
                                            alt="Preview"
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        <DialogFooter>
                            <button
                                onClick={() => setIsDialogOpen(false)}
                                className="px-4 py-2 rounded-md hover:bg-muted"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md flex items-center gap-2"
                            >
                                {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                                Save Changes
                            </button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="featured-maps">
                    {(provided: DroppableProvided) => (
                        <div
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                            className="border rounded-lg bg-card"
                        >
                            {maps.length === 0 ? (
                                <div className="p-8 text-center text-muted-foreground">
                                    No featured maps yet. Add one to get started!
                                </div>
                            ) : (
                                maps.map((map, index) => (
                                    <Draggable key={map.id} draggableId={map.id} index={index}>
                                        {(provided: DraggableProvided) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                className="flex items-center gap-4 p-4 border-b last:border-b-0 hover:bg-muted/50"
                                            >
                                                <div {...provided.dragHandleProps} className="cursor-grab">
                                                    <GripVertical className="w-5 h-5 text-muted-foreground/50" />
                                                </div>
                                                <div className="w-16 h-16 rounded-md overflow-hidden bg-muted flex-shrink-0">
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img
                                                        src={map.image_url || 'https://placehold.co/100x100?text=No+Image'}
                                                        alt={map.title}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="font-medium">{map.title}</h3>
                                                    <p className="text-sm text-muted-foreground line-clamp-1">{map.description}</p>
                                                    <a
                                                        href={map.link_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-xs text-blue-500 hover:underline flex items-center gap-1"
                                                    >
                                                        {map.link_url} <ExternalLink className="w-3 h-3" />
                                                    </a>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className={`px-2 py-1 rounded-full text-xs ${map.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                        {map.is_active ? 'Active' : 'Inactive'}
                                                    </span>
                                                    <button
                                                        onClick={() => {
                                                            setEditingMap(map);
                                                            setIsDialogOpen(true);
                                                        }}
                                                        className="p-2 rounded-md hover:bg-muted"
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(map.id)}
                                                        className="p-2 rounded-md hover:bg-muted text-red-500"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </Draggable>
                                ))
                            )}
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>
            </DragDropContext>
        </div>
    );
}
