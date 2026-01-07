'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { syncVariantImages } from '@/lib/actions/printful';
import { toast } from 'sonner';
import { Loader2, RefreshCcw } from 'lucide-react';
import { PrintfulProductBrowser } from '@/components/admin/PrintfulProductBrowser';
import { VariantImporter } from '@/components/admin/VariantImporter';

export default function CatalogPage() {
    const [selectedProduct, setSelectedProduct] = useState<any>(null);
    const [isImporterOpen, setIsImporterOpen] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);

    const handleSyncImages = async () => {
        setIsSyncing(true);
        try {
            const result = await syncVariantImages();
            toast.success(`Synced ${result.count} offline images`);
        } catch (error) {
            toast.error("Failed to sync images");
        } finally {
            setIsSyncing(false);
        }
    };

    const handleSelectProduct = (product: any) => {
        setSelectedProduct(product);
        setIsImporterOpen(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Printful Catalog</h1>
                    <p className="text-muted-foreground">Search and import products directly from Printful.</p>
                </div>
                <Button
                    variant="outline"
                    onClick={handleSyncImages}
                    disabled={isSyncing}
                >
                    {isSyncing ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                        <RefreshCcw className="w-4 h-4 mr-2" />
                    )}
                    Sync Offline Images
                </Button>
            </div>

            <PrintfulProductBrowser onSelectProduct={handleSelectProduct} />

            <VariantImporter
                open={isImporterOpen}
                onOpenChange={setIsImporterOpen}
                product={selectedProduct}
                onImportComplete={() => {
                    // Optional: refresh something or stay on page
                }}
            />
        </div>
    );
}
