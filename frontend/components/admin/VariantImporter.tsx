'use client';

import { useState, useEffect } from 'react';
import { getPrintfulProductVariants } from '@/lib/actions/printful';
import { upsertProductVariants } from '@/lib/actions/ecommerce';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface VariantImporterProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    product: any;
    onImportComplete: () => void;
}

export function VariantImporter({ open, onOpenChange, product, onImportComplete }: VariantImporterProps) {
    const [variants, setVariants] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isImporting, setIsImporting] = useState(false);

    useEffect(() => {
        if (open && product) {
            fetchVariants();
        }
    }, [open, product]);

    const fetchVariants = async () => {
        setIsLoading(true);
        try {
            const data = await getPrintfulProductVariants(product.id);
            // API returns { product: {...}, variants: [...] }
            // Some endpoints return directly list of variants depending on version
            // Adjusted based on client.ts implementation returning data.result

            // If data.result is array (from client logic), it's variants
            // If it's object, check for variants property
            const variantList = Array.isArray(data) ? data : (data.variants || []);
            setVariants(variantList);
        } catch (error) {
            toast.error("Failed to load variants");
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleImport = async () => {
        setIsImporting(true);

        try {
            // Import all fetched variants
            const variantsToImport = variants.map(v => ({
                id: v.id,
                name: v.name,
                price_cents: Math.round(parseFloat(v.price) * 100),
                is_active: true,
                display_order: 0,
                product_id: product.id,
                image_url: v.image
            }));

            await upsertProductVariants(variantsToImport);

            toast.success(`Imported ${variantsToImport.length} variants successfully`);
            onImportComplete();
            onOpenChange(false);

        } catch (error) {
            console.error(error);
            toast.error("Import process failed");
        } finally {
            setIsImporting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Import Variants: {product?.title}</DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-auto min-h-0">
                    {isLoading ? (
                        <div className="flex justify-center p-8">
                            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[80px]">Image</TableHead>
                                    <TableHead>Variant Name</TableHead>
                                    <TableHead>Size / Color</TableHead>
                                    <TableHead>Price (Cost)</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {variants.map((variant) => (
                                    <TableRow key={variant.id}>
                                        <TableCell>
                                            <div className="w-12 h-12 rounded bg-muted overflow-hidden relative">
                                                {variant.image && (
                                                    <img
                                                        src={variant.image}
                                                        alt={variant.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-medium text-sm">
                                            {variant.name}
                                            <div className="text-xs text-muted-foreground mt-0.5">ID: {variant.id}</div>
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {variant.size} / {variant.color}
                                        </TableCell>
                                        <TableCell>
                                            ${variant.price}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                    <div className="text-sm text-muted-foreground">
                        {variants.length} variants found
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleImport} disabled={isImporting || variants.length === 0}>
                            {isImporting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Import All {variants.length > 0 ? `(${variants.length})` : ''}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
