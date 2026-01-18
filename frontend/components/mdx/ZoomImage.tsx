"use client";

import Image, { ImageProps } from "next/image";
import {
    Dialog,
    DialogContent,
    DialogTrigger,
    DialogTitle,
} from "@/components/ui/dialog";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
import { ZoomIn } from "lucide-react";

export function ZoomImage({ alt, ...props }: any) {
    // Check if width/height are present and valid numbers/strings to decide between Next Image and standard img
    const isOptimized = props.width && props.height;

    // Explicitly unoptimized for local placeholder images if width/height missing
    if (!isOptimized) {
        // Fallback to simpler handling or ensure we don't pass invalid props to Image if we were to use it.
    }

    return (
        <Dialog>
            <DialogTrigger asChild>
                <span className="relative group cursor-zoom-in overflow-hidden rounded-xl border border-[#f5f0e8]/10 my-8 inline-block w-full">
                    {isOptimized ? (
                        <Image
                            alt={alt || "Blog post image"}
                            className="w-full h-auto max-h-[500px] object-contain transition-transform duration-300 group-hover:scale-[1.02]"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
                            {...props}
                        />
                    ) : (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                            alt={alt || "Blog post image"}
                            className="w-full h-auto max-h-[500px] object-contain transition-transform duration-300 group-hover:scale-[1.02] block"
                            {...props}
                        />
                    )}
                    <span className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 duration-300">
                        <span className="bg-black/50 p-2 rounded-full backdrop-blur-sm text-white">
                            <ZoomIn className="w-5 h-5" />
                        </span>
                    </span>
                </span>
            </DialogTrigger>
            <DialogContent className="max-w-[95vw] max-h-[95vh] w-auto h-auto p-0 border-none bg-transparent shadow-none flex items-center justify-center overflow-hidden">
                <VisuallyHidden>
                    <DialogTitle>{alt || "Zoomed image"}</DialogTitle>
                </VisuallyHidden>
                <div className="relative w-auto h-auto max-w-full max-h-full">
                    {isOptimized ? (
                        <Image
                            alt={alt || "Blog post image"}
                            className="w-auto h-auto max-w-[90vw] max-h-[90vh] object-contain rounded-md shadow-2xl"
                            sizes="90vw"
                            quality={90}
                            {...props}
                        />
                    ) : (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                            alt={alt || "Blog post image"}
                            className="w-auto h-auto max-w-[90vw] max-h-[90vh] object-contain rounded-md shadow-2xl block"
                            {...props}
                        />
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
