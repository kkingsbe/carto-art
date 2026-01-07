'use client';

import { useState, useEffect } from "react";
import { getProductVariants, upsertProductVariant, deleteProductVariant, deleteProductVariants } from "@/lib/actions/ecommerce";
import { getSiteConfig } from "@/lib/actions/usage";
import { CONFIG_KEYS } from "@/lib/actions/usage.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";

export default function AdminProductsPage() {
    const [variants, setVariants] = useState<any[]>([]);
    const [marginPercent, setMarginPercent] = useState<number>(25);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [editingVariant, setEditingVariant] = useState<any>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedVariants, setSelectedVariants] = useState<number[]>([]);

    const fetchVariants = async () => {
        setIsLoading(true);
        try {
            const [data, margin] = await Promise.all([
                getProductVariants(true), // include inactive
                getSiteConfig(CONFIG_KEYS.PRODUCT_MARGIN_PERCENT)
            ]);
            setVariants(data);
            setMarginPercent(margin);
            setSelectedVariants([]); // clear selection on excessive refresh
        } catch (error) {
            toast.error("Failed to fetch variants");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchVariants();
    }, []);

    const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSaving(true);
        const formData = new FormData(e.currentTarget);

        const payload = {
            id: Number(formData.get('id')),
            name: formData.get('name') as string,
            price_cents: Math.round(Number(formData.get('price')) * 100),
            is_active: formData.get('is_active') === 'on',
            display_order: Number(formData.get('display_order')) || 0,
        };

        try {
            await upsertProductVariant(payload);
            toast.success("Variant saved");
            setIsDialogOpen(false);
            setEditingVariant(null);
            fetchVariants();
        } catch (error: any) {
            toast.error(error.message || "Failed to save variant");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this variant?")) return;

        try {
            await deleteProductVariant(id);
            toast.success("Variant deleted");
            fetchVariants();
        } catch (error: any) {
            toast.error(error.message || "Failed to delete variant");
        }
    };

    const handleBulkDelete = async () => {
        if (!confirm(`Are you sure you want to delete ${selectedVariants.length} variants?`)) return;

        try {
            await deleteProductVariants(selectedVariants);
            toast.success("Variants deleted");
            fetchVariants();
        } catch (error: any) {
            toast.error(error.message || "Failed to delete variants");
        }
    };

    const toggleSelectAll = () => {
        if (selectedVariants.length === variants.length) {
            setSelectedVariants([]);
        } else {
            setSelectedVariants(variants.map(v => v.id));
        }
    };

    const toggleSelectVariant = (id: number) => {
        if (selectedVariants.includes(id)) {
            setSelectedVariants(selectedVariants.filter(vId => vId !== id));
        } else {
            setSelectedVariants([...selectedVariants, id]);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Product Variants</h1>
                    <p className="text-muted-foreground">Manage Printful variants and pricing.</p>
                </div>
                <div className="flex items-center gap-2">
                    {selectedVariants.length > 0 && (
                        <Button variant="destructive" onClick={handleBulkDelete}>
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Selected ({selectedVariants.length})
                        </Button>
                    )}
                    <Dialog open={isDialogOpen} onOpenChange={(open) => {
                        setIsDialogOpen(open);
                        if (!open) setEditingVariant(null);
                    }}>
                        <DialogTrigger asChild>
                            <Button onClick={() => setEditingVariant(null)}>
                                <Plus className="w-4 h-4 mr-2" />
                                Add Variant
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>{editingVariant ? 'Edit Variant' : 'Add New Variant'}</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleSave} className="space-y-4 pt-4">
                                <div className="space-y-2">
                                    <Label htmlFor="id">Printful Variant ID</Label>
                                    <Input
                                        id="id"
                                        name="id"
                                        type="number"
                                        defaultValue={editingVariant?.id}
                                        required
                                        disabled={!!editingVariant}
                                    />
                                    <p className="text-xs text-muted-foreground">Once set, the ID cannot be changed.</p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="name">Display Name</Label>
                                    <Input id="name" name="name" defaultValue={editingVariant?.name} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="price">Price (USD)</Label>
                                    <Input
                                        id="price"
                                        name="price"
                                        type="number"
                                        step="0.01"
                                        defaultValue={editingVariant ? editingVariant.price_cents / 100 : ''}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="display_order">Display Order</Label>
                                    <Input id="display_order" name="display_order" type="number" defaultValue={editingVariant?.display_order || 0} />
                                </div>
                                <div className="flex items-center gap-2">
                                    <Switch id="is_active" name="is_active" defaultChecked={editingVariant ? editingVariant.is_active : true} />
                                    <Label htmlFor="is_active">Active</Label>
                                </div>
                                <Button type="submit" className="w-full" disabled={isSaving}>
                                    {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                    {editingVariant ? 'Update' : 'Create'} Variant
                                </Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[50px]">
                                <Checkbox
                                    checked={variants.length > 0 && selectedVariants.length === variants.length}
                                    onCheckedChange={toggleSelectAll}
                                    aria-label="Select all"
                                />
                            </TableHead>
                            <TableHead>ID</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Internal Price</TableHead>
                            <TableHead>External Price</TableHead>
                            <TableHead>Order</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center py-8">
                                    <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                                </TableCell>
                            </TableRow>
                        ) : variants.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                    No variants found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            variants.map((v) => (
                                <TableRow key={v.id}>
                                    <TableCell>
                                        <Checkbox
                                            checked={selectedVariants.includes(v.id)}
                                            onCheckedChange={() => toggleSelectVariant(v.id)}
                                            aria-label={`Select ${v.name}`}
                                        />
                                    </TableCell>
                                    <TableCell className="font-mono text-xs">{v.id}</TableCell>
                                    <TableCell className="font-medium">{v.name}</TableCell>
                                    <TableCell className="text-muted-foreground">${(v.price_cents / 100).toFixed(2)}</TableCell>
                                    <TableCell className="font-medium">${(Math.round(v.price_cents * (1 + marginPercent / 100)) / 100).toFixed(2)}</TableCell>
                                    <TableCell>{v.display_order}</TableCell>
                                    <TableCell>
                                        <span className={`px-2 py-1 rounded-full text-xs ${v.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {v.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="icon" onClick={() => {
                                                setEditingVariant(v);
                                                setIsDialogOpen(true);
                                            }}>
                                                <Pencil className="w-4 h-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(v.id)}>
                                                <Trash2 className="w-4 h-4 text-destructive" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
