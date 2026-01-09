'use client';

import { useState, useEffect } from "react";
import { getProducts, upsertProduct, deleteProduct, upsertProductVariant, deleteProductVariant, deleteProductVariants } from "@/lib/actions/ecommerce";
import { generateMockupTemplates, getMissingTemplateCount, regenerateVariantMockup, clearAllMockupTemplates, getGenerationStatus, GenerationJobStatus } from "@/lib/actions/printful";
import { getSiteConfig } from "@/lib/actions/usage";
import { CONFIG_KEYS } from "@/lib/actions/usage.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea"; // Assuming this exists
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
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plus, Pencil, Trash2, Loader2, ImageIcon, AlertTriangle, CheckCircle2, RefreshCcw, Eraser, ChevronDown, ChevronRight, Package, Clock, XCircle, Activity } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function AdminProductsPage() {
    const [products, setProducts] = useState<any[]>([]);
    const [marginPercent, setMarginPercent] = useState<number>(25);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Product Editing
    const [editingProduct, setEditingProduct] = useState<any>(null);
    const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);

    // Variant Editing
    const [editingVariant, setEditingVariant] = useState<any>(null);
    const [isVariantDialogOpen, setIsVariantDialogOpen] = useState(false);

    const [selectedVariants, setSelectedVariants] = useState<number[]>([]);
    const [isGeneratingTemplates, setIsGeneratingTemplates] = useState(false);
    const [missingTemplateCount, setMissingTemplateCount] = useState<number>(0);
    const [currentJob, setCurrentJob] = useState<GenerationJobStatus | null>(null);
    const [activeJobId, setActiveJobId] = useState<string | null>(null);
    const [now, setNow] = useState(Date.now());

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [productsData, margin] = await Promise.all([
                getProducts(true), // include inactive
                getSiteConfig(CONFIG_KEYS.PRODUCT_MARGIN_PERCENT)
            ]);
            setProducts(productsData);
            setMarginPercent(margin);
            setSelectedVariants([]);
        } catch (error) {
            toast.error("Failed to fetch products");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        fetchMissingCount();
    }, []);

    const fetchMissingCount = async () => {
        try {
            const count = await getMissingTemplateCount();
            setMissingTemplateCount(count);
        } catch (e) {
            console.error('Failed to fetch missing template count', e);
        }
    };

    const fetchJobStatus = async (jobId?: string) => {
        try {
            console.log('[DEBUG] Fetching job status for:', jobId);
            const status = await getGenerationStatus(jobId || undefined);
            console.log('[DEBUG] Got job status:', status);
            setCurrentJob(status);

            // If job is still processing, keep polling
            if (status && status.status === 'processing') {
                setActiveJobId(status.id);
            } else {
                setActiveJobId(null);
                setIsGeneratingTemplates(false);
            }
        } catch (e) {
            console.error('Failed to fetch job status', e);
        }
    };

    // Polling effect for active jobs
    useEffect(() => {
        if (!activeJobId && !isGeneratingTemplates) {
            // Check for any recently active job on mount
            fetchJobStatus();
            return;
        }

        if (activeJobId || isGeneratingTemplates) {
            const interval = setInterval(() => {
                fetchJobStatus(activeJobId || undefined);
            }, 3000); // Poll every 3 seconds

            return () => clearInterval(interval);
        }
    }, [activeJobId, isGeneratingTemplates]);

    // Update real-time ticker
    useEffect(() => {
        if (!currentJob || currentJob.status !== 'processing') return;

        const timer = setInterval(() => {
            setNow(Date.now());
        }, 1000);

        return () => clearInterval(timer);
    }, [currentJob?.status]);

    const handleSaveProduct = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSaving(true);
        const formData = new FormData(e.currentTarget);

        // Handle features list (comma separated or newline)
        const featuresText = formData.get('features') as string;
        const features = featuresText.split('\n').map(f => f.trim()).filter(f => f.length > 0);

        const payload = {
            id: editingProduct?.id || Number(formData.get('id')),
            title: formData.get('title') as string,
            description: formData.get('description') as string,
            features: features,
            starting_price: Math.round(Number(formData.get('starting_price')) * 100),
            display_order: Number(formData.get('display_order')) || 0,
            is_active: formData.get('is_active') === 'on',
        };

        try {
            await upsertProduct(payload);
            toast.success("Product saved");
            setIsProductDialogOpen(false);
            setEditingProduct(null);
            fetchData();
        } catch (error: any) {
            toast.error(error.message || "Failed to save product");
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveVariant = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSaving(true);
        const formData = new FormData(e.currentTarget);

        const payload = {
            id: editingVariant?.id || Number(formData.get('id')),
            product_id: Number(formData.get('product_id')), // Hidden field
            name: formData.get('name') as string,
            price_cents: Math.round(Number(formData.get('price')) * 100),
            is_active: formData.get('is_active') === 'on',
            display_order: Number(formData.get('display_order')) || 0,
        };

        try {
            await upsertProductVariant(payload);
            toast.success("Variant saved");
            setIsVariantDialogOpen(false);
            setEditingVariant(null);
            fetchData();
        } catch (error: any) {
            toast.error(error.message || "Failed to save variant");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteProduct = async (product: any) => {
        if (!confirm(`Are you sure you want to delete "${product.title}"? This will detach its variants.`)) return;

        const toastId = toast.loading("Deleting product...");
        try {
            await deleteProduct(product.id);
            toast.success("Product deleted", { id: toastId });
            fetchData();
        } catch (error: any) {
            toast.error(error.message || "Failed to delete product", { id: toastId });
        }
    };

    const handleGenerateTemplates = async () => {
        setIsGeneratingTemplates(true);
        toast.info(`Generating templates for ${missingTemplateCount} variants...`);

        try {
            const result = await generateMockupTemplates();
            console.log('[DEBUG] Generate result:', result);
            // Set active job ID to start polling
            if (result.jobId) {
                console.log('[DEBUG] Setting active job ID:', result.jobId);
                setActiveJobId(result.jobId);
            } else {
                console.warn('[DEBUG] No jobId returned from generateMockupTemplates');
            }
            if (result.errors.length > 0) {
                toast.warning(`Generated ${result.processed} templates with ${result.errors.length} errors`);
            } else {
                toast.success(`Successfully generated ${result.processed} templates`);
            }
            fetchData();
            fetchMissingCount();
        } catch (error: any) {
            toast.error(error.message || 'Failed to generate templates');
            setIsGeneratingTemplates(false);
        }
        // Note: setIsGeneratingTemplates(false) is now handled by the polling effect
    };

    const handleClearAllTemplates = async () => {
        if (!confirm("CRITICAL: Are you sure you want to clear ALL existing mockup templates? This will force a total regeneration of all product previews.")) return;

        const toastId = toast.loading("Clearing all templates...");
        try {
            await clearAllMockupTemplates();
            toast.success("All templates cleared", { id: toastId });
            fetchData();
            fetchMissingCount();
        } catch (error: any) {
            toast.error(error.message || "Failed to clear templates", { id: toastId });
        }
    };

    const handleRegenerate = async (variant: any) => {
        const toastId = toast.loading("Regenerating template...");
        try {
            await regenerateVariantMockup(variant.id);
            toast.success("Template regenerated", { id: toastId });
            fetchData();
            fetchMissingCount();
        } catch (error: any) {
            toast.error(error.message || "Failed to regenerate", { id: toastId });
        }
    };

    const handleClearTemplate = async (variant: any) => {
        if (!confirm("Are you sure you want to remove the template for this variant?")) return;

        try {
            await upsertProductVariant({
                ...variant,
                mockup_template_url: null,
                mockup_print_area: null
            });
            toast.success("Template removed");
            fetchData();
            fetchMissingCount();
        } catch (error: any) {
            toast.error(error.message || "Failed to remove template");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Product Catalog</h1>
                    <p className="text-muted-foreground">Manage Products, Pricing, and Variants.</p>
                </div>
                <div className="flex items-center gap-2">
                    {missingTemplateCount > 0 && (
                        <Button
                            variant="outline"
                            onClick={handleGenerateTemplates}
                            disabled={isGeneratingTemplates}
                        >
                            {isGeneratingTemplates ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <ImageIcon className="w-4 h-4 mr-2" />
                            )}
                            Generate Templates ({missingTemplateCount})
                        </Button>
                    )}

                    <Button
                        variant="ghost"
                        className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                        onClick={handleClearAllTemplates}
                    >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Clear All Templates
                    </Button>
                </div>
            </div>

            {/* Generation Job Status Card */}
            {currentJob && (currentJob.status === 'processing' || (currentJob.status === 'completed' && Date.now() - new Date(currentJob.completed_at || 0).getTime() < 60000)) && (
                <div className="border rounded-lg p-4 bg-card">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <Activity className="w-4 h-4 text-blue-500" />
                            <h3 className="font-semibold">Template Generation Status</h3>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${currentJob.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                            currentJob.status === 'completed' ? 'bg-green-100 text-green-700' :
                                currentJob.status === 'failed' ? 'bg-red-100 text-red-700' :
                                    'bg-gray-100 text-gray-700'
                            }`}>
                            {currentJob.status.charAt(0).toUpperCase() + currentJob.status.slice(1)}
                        </span>
                    </div>

                    <Progress
                        value={currentJob.total_items > 0 ? ((currentJob.processed_count + currentJob.failed_count) / currentJob.total_items) * 100 : 0}
                        className="mb-3"
                    />

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                            <div className="text-muted-foreground">Progress</div>
                            <div className="font-semibold">
                                {currentJob.processed_count + currentJob.failed_count} / {currentJob.total_items}
                            </div>
                        </div>
                        <div>
                            <div className="text-muted-foreground flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-green-600" /> Processed
                            </div>
                            <div className="font-semibold text-green-600">{currentJob.processed_count}</div>
                        </div>
                        <div>
                            <div className="text-muted-foreground flex items-center gap-1">
                                <XCircle className="w-3 h-3 text-red-600" /> Errors
                            </div>
                            <div className="font-semibold text-red-600">{currentJob.failed_count}</div>
                        </div>
                        <div>
                            <div className="text-muted-foreground flex items-center gap-1">
                                <Clock className="w-3 h-3" /> Est. Remaining
                            </div>
                            <div className="font-semibold">
                                {(() => {
                                    if (currentJob.status === 'completed') return 'Done';
                                    if (currentJob.status !== 'processing' || !currentJob.estimated_remaining_ms) return '--';

                                    // Calculate time passed since server last updated this job record
                                    const lastUpdate = new Date(currentJob.last_updated_at).getTime();
                                    const elapsedSinceUpdate = Math.max(0, now - lastUpdate);
                                    const effectiveRemaining = Math.max(0, currentJob.estimated_remaining_ms - elapsedSinceUpdate);

                                    return formatDuration(effectiveRemaining);
                                })()}
                            </div>
                        </div>
                    </div>

                    {currentJob.average_time_per_item_ms && currentJob.processed_count > 0 && (
                        <div className="mt-2 text-xs text-muted-foreground">
                            Avg. time per template: {(currentJob.average_time_per_item_ms / 1000).toFixed(1)}s
                        </div>
                    )}

                    {currentJob.error_logs && currentJob.error_logs.length > 0 && (
                        <div className="mt-3 pt-3 border-t">
                            <div className="text-xs text-muted-foreground mb-1">Recent Errors:</div>
                            <div className="text-xs text-red-600 space-y-1 max-h-20 overflow-auto">
                                {currentJob.error_logs.slice(-3).map((err, i) => (
                                    <div key={i}>Variant {err.id}: {err.error}</div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            <Dialog open={isProductDialogOpen} onOpenChange={(open) => {
                setIsProductDialogOpen(open);
                if (!open) setEditingProduct(null);
            }}>
                <DialogTrigger asChild>
                    <Button onClick={() => setEditingProduct(null)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Product
                    </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSaveProduct} className="space-y-4 pt-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="id">Product ID (Printful ID)</Label>
                                <Input
                                    id="id"
                                    name="id"
                                    type="number"
                                    defaultValue={editingProduct?.id}
                                    required
                                    disabled={!!editingProduct}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="starting_price">Starting Price (USD)</Label>
                                <Input
                                    id="starting_price"
                                    name="starting_price"
                                    type="number"
                                    step="0.01"
                                    defaultValue={editingProduct ? editingProduct.starting_price / 100 : ''}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="title">Display Title</Label>
                            <Input id="title" name="title" defaultValue={editingProduct?.title} required />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea id="description" name="description" defaultValue={editingProduct?.description} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="features">Features (One per line)</Label>
                            <Textarea
                                id="features"
                                name="features"
                                defaultValue={editingProduct?.features?.join('\n')}
                                rows={5}
                            />
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="space-y-2 w-24">
                                <Label htmlFor="display_order">Order</Label>
                                <Input id="display_order" name="display_order" type="number" defaultValue={editingProduct?.display_order || 0} />
                            </div>
                            <div className="flex items-center gap-2 pt-6">
                                <Switch id="is_active" name="is_active" defaultChecked={editingProduct ? editingProduct.is_active : true} />
                                <Label htmlFor="is_active">Active</Label>
                            </div>
                        </div>

                        <Button type="submit" className="w-full" disabled={isSaving}>
                            {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            {editingProduct ? 'Update' : 'Create'} Product
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Loading and Products Display */}
            {isLoading ? (
                <div className="flex justify-center p-12">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
            ) : (
                <Accordion type="multiple" className="space-y-4">
                    {products.map((product) => (
                        <AccordionItem key={product.id} value={String(product.id)} className="border rounded-lg px-4 bg-card">
                            <div className="flex items-center justify-between py-4">
                                <AccordionTrigger className="hover:no-underline py-0 flex-1">
                                    <div className="flex items-center gap-4 text-left">
                                        <Package className="w-5 h-5 text-muted-foreground" />
                                        <div>
                                            <div className="font-semibold">{product.title}</div>
                                            <div className="text-sm text-muted-foreground flex gap-2">
                                                <span>ID: {product.id}</span>
                                                <span>•</span>
                                                <span>{product.variants?.length || 0} Variants</span>
                                                <span>•</span>
                                                <span className={product.is_active ? "text-green-600" : "text-yellow-600"}>
                                                    {product.is_active ? "Active" : "Inactive"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </AccordionTrigger>
                                <div className="flex items-center gap-2 ml-4">
                                    <Button size="sm" variant="outline" onClick={(e) => {
                                        e.stopPropagation();
                                        setEditingProduct(product);
                                        setIsProductDialogOpen(true);
                                    }}>
                                        <Pencil className="w-4 h-4 mr-2" />
                                        Edit
                                    </Button>
                                    <Button size="sm" variant="destructive" onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteProduct(product);
                                    }}>
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Delete
                                    </Button>
                                </div>
                            </div>

                            <AccordionContent>
                                <div className="pt-2 pb-6">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Variants</h3>
                                        <Button size="sm" variant="secondary" onClick={() => {
                                            setEditingVariant({ product_id: product.id }); // Pre-fill product ID
                                            setIsVariantDialogOpen(true);
                                        }}>
                                            <Plus className="w-3 h-3 mr-1" />
                                            Add Variant
                                        </Button>
                                    </div>

                                    <div className="border rounded-md">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="w-[80px]">ID</TableHead>
                                                    <TableHead>Variant Name</TableHead>
                                                    <TableHead>Cost</TableHead>
                                                    <TableHead>Price (+{marginPercent}%)</TableHead>
                                                    <TableHead>Mockup</TableHead>
                                                    <TableHead>Status</TableHead>
                                                    <TableHead className="text-right">Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {product.variants?.sort((a: any, b: any) => a.display_order - b.display_order).map((v: any) => (
                                                    <TableRow key={v.id}>
                                                        <TableCell className="font-mono text-xs">{v.id}</TableCell>
                                                        <TableCell className="font-medium">{v.name}</TableCell>
                                                        <TableCell className="text-muted-foreground">${(v.price_cents / 100).toFixed(2)}</TableCell>
                                                        <TableCell className="font-medium">
                                                            ${(Math.round(v.price_cents * (1 + marginPercent / 100)) / 100).toFixed(2)}
                                                        </TableCell>
                                                        <TableCell>
                                                            {v.mockup_template_url ? (
                                                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">
                                                                    <CheckCircle2 className="w-3 h-3" />
                                                                    Ready
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-700">
                                                                    <AlertTriangle className="w-3 h-3" />
                                                                    Missing
                                                                </span>
                                                            )}
                                                        </TableCell>
                                                        <TableCell>
                                                            <span className={`px-2 py-1 rounded-full text-xs ${v.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                                {v.is_active ? 'Active' : 'Inactive'}
                                                            </span>
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <div className="flex justify-end gap-1">
                                                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleRegenerate(v)} title="Regenerate Template">
                                                                    <RefreshCcw className="w-3 h-3 text-blue-500" />
                                                                </Button>
                                                                {v.mockup_template_url && (
                                                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleClearTemplate(v)} title="Clear Template">
                                                                        <Eraser className="w-3 h-3 text-orange-500" />
                                                                    </Button>
                                                                )}
                                                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                                                                    setEditingVariant(v);
                                                                    setIsVariantDialogOpen(true);
                                                                }}>
                                                                    <Pencil className="w-3 h-3" />
                                                                </Button>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                                {(!product.variants || product.variants.length === 0) && (
                                                    <TableRow>
                                                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                                            No variants imported for this product.
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    ))}

                    {products.length === 0 && (
                        <div className="text-center py-12 border rounded-lg bg-gray-50 dark:bg-gray-900/10">
                            <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-medium">No Products Found</h3>
                            <p className="text-muted-foreground mb-6">Get started by adding a product type.</p>
                            <Button onClick={() => {
                                setEditingProduct(null);
                                setIsProductDialogOpen(true);
                            }}>
                                <Plus className="w-4 h-4 mr-2" />
                                Add First Product
                            </Button>
                        </div>
                    )}
                </Accordion>
            )}

            {/* Variant Edit Dialog */}
            <Dialog open={isVariantDialogOpen} onOpenChange={(open) => {
                setIsVariantDialogOpen(open);
                if (!open) setEditingVariant(null);
            }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingVariant?.id ? 'Edit Variant' : 'Add New Variant'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSaveVariant} className="space-y-4 pt-4">
                        <input type="hidden" name="product_id" value={editingVariant?.product_id} />

                        <div className="space-y-2">
                            <Label htmlFor="variant_id">Printful Variant ID</Label>
                            <Input
                                id="variant_id"
                                name="id"
                                type="number"
                                defaultValue={editingVariant?.id}
                                required
                                disabled={!!editingVariant?.id}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="variant_name">Display Name</Label>
                            <Input id="variant_name" name="name" defaultValue={editingVariant?.name} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="variant_price">Cost Price (USD)</Label>
                            <Input
                                id="variant_price"
                                name="price"
                                type="number"
                                step="0.01"
                                defaultValue={editingVariant ? editingVariant.price_cents / 100 : ''}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="variant_order">Display Order</Label>
                            <Input id="variant_order" name="display_order" type="number" defaultValue={editingVariant?.display_order || 0} />
                        </div>
                        <div className="flex items-center gap-2">
                            <Switch id="variant_active" name="is_active" defaultChecked={editingVariant ? editingVariant.is_active : true} />
                            <Label htmlFor="variant_active">Active</Label>
                        </div>
                        <Button type="submit" className="w-full" disabled={isSaving}>
                            {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            {editingVariant?.id ? 'Update' : 'Create'} Variant
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}

// Helper function to format duration
function formatDuration(ms: number): string {
    if (ms < 1000) return 'Less than 1s';
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes < 60) return `${minutes}m ${remainingSeconds}s`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
}


