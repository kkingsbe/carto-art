'use client';

import { useState, useEffect } from 'react';
import { searchPrintfulProducts } from '@/lib/actions/printful';
import { getImportedProductIds } from '@/lib/actions/ecommerce';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Search } from 'lucide-react';
import { toast } from 'sonner';

interface PrintfulProductBrowserProps {
    onSelectProduct: (product: any) => void;
}

export function PrintfulProductBrowser({ onSelectProduct }: PrintfulProductBrowserProps) {
    const [query, setQuery] = useState('');
    const [products, setProducts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [selectedType, setSelectedType] = useState<string>('all');
    const [availableTypes, setAvailableTypes] = useState<string[]>([]);
    const [importedProductIds, setImportedProductIds] = useState<number[]>([]);

    // Initial load
    useEffect(() => {
        handleSearch();
        getImportedProductIds().then(setImportedProductIds);
    }, []);

    const handleSearch = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        setIsLoading(true);
        setHasSearched(true);

        try {
            const typeFilter = selectedType === 'all' ? '' : selectedType;
            const results = await searchPrintfulProducts(query, typeFilter);
            setProducts(results);

            // Populate available types from results if we have enough data (e.g. initial load)
            // But better: accummulate unique types
            if (availableTypes.length === 0 && results.length > 0) {
                const types = Array.from(new Set(results.map((p: any) => p.type).filter(Boolean))) as string[];
                setAvailableTypes(types.sort());
            }

            // Refresh imported IDs in case of new imports
            getImportedProductIds().then(setImportedProductIds);
        } catch (error: any) {
            toast.error(error.message || 'Failed to search products');
            setProducts([]);
        } finally {
            setIsLoading(false);
        }
    };

    // Re-search when filter changes
    useEffect(() => {
        if (hasSearched) {
            handleSearch();
        }
    }, [selectedType]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4">
                <form onSubmit={handleSearch} className="flex gap-2 flex-1">
                    <Input
                        placeholder="Search Printful Catalog (e.g. 'framed poster')"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="max-w-md"
                    />
                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
                        Search
                    </Button>
                </form>

                <div className="w-[200px]">
                    <Select value={selectedType} onValueChange={setSelectedType}>
                        <SelectTrigger>
                            <SelectValue placeholder="All Product Types" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Product Types</SelectItem>
                            {availableTypes.map((type) => (
                                <SelectItem key={type} value={type}>
                                    {type}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {products.map((product) => {
                    const isImported = importedProductIds.includes(product.id);
                    return (
                        <Card
                            key={product.id}
                            className={`transition-colors hover:shadow-md relative ${isImported
                                ? 'border-green-200 bg-green-50/50 cursor-default opacity-80'
                                : 'cursor-pointer hover:border-primary'
                                }`}
                            onClick={() => !isImported && onSelectProduct(product)}
                        >
                            <CardHeader className="p-4 pb-2">
                                <CardTitle className="text-sm font-medium line-clamp-2 leading-tight flex justify-between gap-2">
                                    <span>{product.title}</span>
                                    {isImported && (
                                        <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full h-fit whitespace-nowrap border border-green-200">
                                            Imported
                                        </span>
                                    )}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 pt-0">
                                <div className="aspect-square relative rounded-md overflow-hidden bg-muted mt-2">
                                    {/* Printful Image */}
                                    {product.image && (
                                        <img
                                            src={product.image}
                                            alt={product.title}
                                            className="w-full h-full object-cover"
                                        />
                                    )}
                                </div>
                            </CardContent>
                            <CardFooter className="p-4 pt-0 text-xs text-muted-foreground flex justify-between">
                                <span>{product.type}</span>
                                <span>{product.variant_count} variants</span>
                            </CardFooter>

                        </Card>
                    );
                })}
            </div>

            {
                hasSearched && products.length === 0 && !isLoading && (
                    <div className="text-center text-muted-foreground py-12">
                        No products found. Try a different search term.
                    </div>
                )
            }
        </div >
    );
}
