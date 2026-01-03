'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

export function PosterImagePreview({ url }: { url: string }) {
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const imgRef = useRef<HTMLImageElement>(null);

    // Reset state when url changes
    useEffect(() => {
        console.log('[PosterImagePreview] URL changed:', url);
        setIsLoading(true);
        setHasError(false);

        // Safety timeout: If image doesn't load in 8 seconds, force show it (might be broken, but better than spinner)
        const timer = setTimeout(() => {
            console.warn('[PosterImagePreview] Load timeout reached. Forcing display.');
            setIsLoading(false);
        }, 8000);

        return () => clearTimeout(timer);
    }, [url]);

    // Check if image is already loaded (cached)
    useEffect(() => {
        if (imgRef.current && imgRef.current.complete) {
            if (imgRef.current.naturalWidth > 0) {
                setIsLoading(false);
            }
        }
    }, []);

    if (hasError) {
        return (
            <div className="relative group rounded-xl overflow-hidden shadow-2xl bg-red-500/5 p-8 border border-red-500/20 flex flex-col items-center justify-center text-center gap-3">
                <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-400">
                    <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                    <h4 className="text-sm font-bold text-red-400">Failed to Load Image</h4>
                    <p className="text-xs text-red-400/60 mt-1 max-w-[200px]">The image could not be displayed. It might have expired or be invalid.</p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 text-xs border-red-500/20 hover:bg-red-500/10 text-red-400"
                    onClick={() => window.open(url, '_blank')}
                >
                    <ExternalLink className="w-3 h-3 mr-2" /> Try Opening Directly
                </Button>
            </div>
        );
    }

    return (
        <div className="relative group rounded-xl overflow-hidden shadow-2xl bg-white/5 p-4 border border-white/5 min-h-[200px] flex items-center justify-center">
            {isLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0f1a]/50 backdrop-blur-sm z-10 transition-opacity duration-300">
                    <Loader2 className="w-8 h-8 animate-spin text-[#c9a962] mb-2" />
                    <span className="text-xs font-mono text-[#c9a962]/80">DOWNLOADING ASSET...</span>
                </div>
            )}
            <img
                ref={imgRef}
                src={url}
                alt="Generated Map"
                className={cn(
                    "max-h-[500px] w-auto mx-auto rounded shadow-lg transition-all duration-700",
                    isLoading ? "opacity-0 scale-95" : "opacity-100 scale-100 group-hover:scale-[1.02]"
                )}
                onLoad={() => {
                    console.log('[PosterImagePreview] Image loaded successfully');
                    setIsLoading(false);
                }}
                onError={(e) => {
                    console.error('[PosterImagePreview] Image failed to load', e);
                    setIsLoading(false);
                    setHasError(true);
                }}
            />
        </div>
    );
}
