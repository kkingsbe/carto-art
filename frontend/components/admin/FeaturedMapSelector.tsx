'use client';

import { useState, useEffect } from 'react';
import { searchPublishedMaps } from '@/lib/actions/featured-maps';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Search, Check } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

// Simple debounce hook to avoid external dependency
function useDebounce<T>(value: T, delay: number): [T] {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return [debouncedValue];
}

// Using a simplified map card for the selector to avoid layout issues with the full Feed MapCard
function SimpleMapCard({ map, onSelect }: { map: any, onSelect: (map: any) => void }) {
    return (
        <div
            className="group relative flex flex-col rounded-xl overflow-hidden bg-card border hover:border-primary/50 transition-colors cursor-pointer"
            onClick={() => onSelect(map)}
        >
            <div className="aspect-[3/4] w-full overflow-hidden bg-muted relative">
                {map.thumbnail_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={map.thumbnail_url}
                        alt={map.title}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                ) : (
                    <div className="flex items-center justify-center w-full h-full text-muted-foreground">
                        No Image
                    </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button size="sm" variant="secondary">Select</Button>
                </div>
            </div>
            <div className="p-3">
                <h4 className="font-medium text-sm truncate" title={map.title}>{map.title}</h4>
                <p className="text-xs text-muted-foreground truncate">by {map.author.username}</p>
            </div>
        </div>
    );
}

interface FeaturedMapSelectorProps {
    onSelect: (map: any) => void;
    onCancel: () => void;
}

export function FeaturedMapSelector({ onSelect, onCancel }: FeaturedMapSelectorProps) {
    const [query, setQuery] = useState('');
    const [debouncedQuery] = useDebounce(query, 500);
    const [maps, setMaps] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const search = async () => {
            setIsLoading(true);
            try {
                const results = await searchPublishedMaps(debouncedQuery);
                setMaps(results);
            } catch (error) {
                console.error('Failed to search maps', error);
            } finally {
                setIsLoading(false);
            }
        };

        search();
    }, [debouncedQuery]);

    return (
        <div className="flex flex-col h-[500px]">
            <div className="flex items-center gap-2 mb-4 p-1">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search published maps..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="pl-9"
                        autoFocus
                    />
                </div>
            </div>

            <ScrollArea className="flex-1 -mx-6 px-6">
                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : maps.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        No maps found matching "{query}"
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pb-4">
                        {maps.map((map) => (
                            <SimpleMapCard key={map.id} map={map} onSelect={onSelect} />
                        ))}
                    </div>
                )}
            </ScrollArea>
        </div>
    );
}
