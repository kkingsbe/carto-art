'use client';

import { useRef, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

interface PrintArea {
    x: number;      // percentage (0-1) from left
    y: number;      // percentage (0-1) from top
    width: number;  // percentage (0-1) of template width
    height: number; // percentage (0-1) of template height
}

interface FrameMockupRendererProps {
    templateUrl: string | null;
    printArea: PrintArea | null;
    designUrl: string;
    className?: string;
    alt?: string;
    onDebug?: (msg: string) => void;
}

/**
 * Client-side Canvas component that composites the user's design
 * onto a frame template without hitting any external APIs.
 */
export function FrameMockupRenderer({
    templateUrl,
    printArea,
    designUrl,
    className = '',
    alt = 'Product preview',
    onDebug
}: FrameMockupRendererProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [compositeUrl, setCompositeUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // If no template, just show the raw design
        if (!templateUrl || !printArea) {
            setCompositeUrl(designUrl);
            setIsLoading(false);
            return;
        }

        const compositeImages = async () => {
            setIsLoading(true);
            setError(null);

            try {
                // Load both images
                const [templateImg, designImg] = await Promise.all([
                    loadImage(templateUrl),
                    loadImage(designUrl)
                ]);

                const log = (msg: string, ...args: any[]) => {
                    const text = [msg, ...args].join(' ');
                    console.log(text);
                    onDebug?.(text);
                };

                log('=== FrameMockupRenderer Debug ===');
                log('Template URL:', templateUrl);
                log('Template dimensions:', templateImg.width, 'x', templateImg.height, `(aspect: ${(templateImg.width / templateImg.height).toFixed(3)})`);
                log('Design URL:', designUrl);
                log('Design dimensions:', designImg.width, 'x', designImg.height, `(aspect: ${(designImg.width / designImg.height).toFixed(3)})`);
                log('Print area (props):', JSON.stringify(printArea));

                const canvas = canvasRef.current;
                if (!canvas) return;

                // Set canvas size to template size
                canvas.width = templateImg.width;
                canvas.height = templateImg.height;

                const ctx = canvas.getContext('2d');
                if (!ctx) return;

                // Calculate print area in pixels
                const printAreaPx = {
                    x: printArea.x * templateImg.width,
                    y: printArea.y * templateImg.height,
                    width: printArea.width * templateImg.width,
                    height: printArea.height * templateImg.height
                };
                log('Print area (pixels):', JSON.stringify(printAreaPx));

                // Step 1: Draw the design on a separate canvas first
                // We do this to have clean source pixels for the replacement
                const designCanvas = document.createElement('canvas');
                designCanvas.width = canvas.width;
                designCanvas.height = canvas.height;
                const designCtx = designCanvas.getContext('2d');
                if (!designCtx) throw new Error('Could not create design context');
                log('Step 1: Created design context');

                drawImageCover(designCtx, designImg, printAreaPx);
                const designData = designCtx.getImageData(0, 0, canvas.width, canvas.height).data;
                log('Step 2: Got design data');

                // Step 2: Draw the template on the main canvas
                ctx.drawImage(templateImg, 0, 0);
                log('Step 3: Drew template');


                // Step 3: Replace placeholder pixels with the design
                // dynamically sample the color at the center of the print area
                // dynamcially sample the color
                // We sample 5 points to avoid hitting a label/text/glare at the exact center
                // Points: Center, and 4 points around it (offset by 20% of print area)
                const cx = printAreaPx.x + printAreaPx.width / 2;
                const cy = printAreaPx.y + printAreaPx.height / 2;
                const offsetW = printAreaPx.width * 0.2;
                const offsetH = printAreaPx.height * 0.2;

                const samplePoints = [
                    { x: cx, y: cy },
                    { x: cx - offsetW, y: cy - offsetH },
                    { x: cx + offsetW, y: cy - offsetH },
                    { x: cx - offsetW, y: cy + offsetH },
                    { x: cx + offsetW, y: cy + offsetH },
                ];

                // RGB to HSL helper
                const rgbToHslLoc = (r: number, g: number, b: number) => {
                    r /= 255; g /= 255; b /= 255;
                    const max = Math.max(r, g, b), min = Math.min(r, g, b);
                    let h = 0, s = 0, l = (max + min) / 2;
                    if (max !== min) {
                        const d = max - min;
                        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
                        switch (max) {
                            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                            case g: h = (b - r) / d + 2; break;
                            case b: h = (r - g) / d + 4; break;
                        }
                        h *= 60;
                    }
                    return [h, s, l];
                };

                let bestCandidate = { r: 0, g: 0, b: 0, h: 0, s: -1, l: 0 };

                // Find the candidate with the highest saturation (most likely to be the chroma key color)
                for (const p of samplePoints) {
                    const pxData = ctx.getImageData(Math.floor(p.x), Math.floor(p.y), 1, 1).data;
                    const r = pxData[0], g = pxData[1], b = pxData[2];
                    const [h, s, l] = rgbToHslLoc(r, g, b);

                    // Prefer higher saturation
                    if (s > bestCandidate.s) {
                        bestCandidate = { r, g, b, h, s, l };
                    }
                }

                const targetR = bestCandidate.r;
                const targetG = bestCandidate.g;
                const targetB = bestCandidate.b;
                const targetH = bestCandidate.h;
                const targetS = bestCandidate.s;
                const targetL = bestCandidate.l;

                log('Step 4: Sampled best color', `rgba(${targetR}, ${targetG}, ${targetB})`,
                    'HSL:', `[${targetH.toFixed(1)}, ${targetS.toFixed(2)}, ${targetL.toFixed(2)}]`);

                // If the target has low saturation (white/gray/black), assume it's a simple container.
                // We use Multiply blending to allow the template's dark details (borders, shadows, lines)
                // to show through the design.
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imageData.data;

                // Color matching thresholds
                const hueThreshold = 30; // degrees
                const targetIsColored = targetS > 0.1;

                let replacedCount = 0;
                for (let i = 0; i < data.length; i += 4) {
                    const r = data[i];
                    const g = data[i + 1];
                    const b = data[i + 2];
                    const a = data[i + 3];

                    // Skip transparent template pixels
                    if (a < 10) continue;

                    // Skip if design is empty at this pixel
                    if (designData[i + 3] === 0) continue;

                    const [h, s, l] = rgbToHslLoc(r, g, b);
                    const isNeutral = s < 0.1;

                    let shouldBlend = false;

                    if (isNeutral) {
                        // Always multiply neutral pixels (White paper, Gray shadows, Black lines)
                        // This allows dark lines to stay dark (Black * Design = Black)
                        // and white paper to take design color (White * Design = Design)
                        shouldBlend = true;
                    } else if (targetIsColored) {
                        // If we have a key color, check for match
                        const hueDiff = Math.abs(h - targetH);
                        const isHueMatch = Math.min(hueDiff, 360 - hueDiff) < hueThreshold;
                        if (isHueMatch && s > 0.1) {
                            shouldBlend = true;
                        }
                    }

                    if (shouldBlend) {
                        const dr = designData[i];
                        const dg = designData[i + 1];
                        const db = designData[i + 2];
                        const da = designData[i + 3];

                        // Multiply blending logic
                        // Result = (Template * Design) / 255
                        data[i] = (r * dr) / 255;
                        data[i + 1] = (g * dg) / 255;
                        data[i + 2] = (b * db) / 255;
                        data[i + 3] = da; // Use design alpha

                        replacedCount++;
                    }
                }

                log(`Step 5: Blended ${replacedCount} pixels using hybrid logic`);
                ctx.putImageData(imageData, 0, 0);

                // Convert to data URL
                // Use PNG to preserve transparency/avoid black background issues
                const dataUrl = canvas.toDataURL('image/png');
                setCompositeUrl(dataUrl);
            } catch (err: any) {
                console.error('Failed to composite mockup:', err);
                const msg = err.message || 'Failed to generate preview';
                onDebug?.(`ERROR: ${msg}`);
                setError(msg);
                // Fallback to raw design
                setCompositeUrl(designUrl);
            } finally {
                setIsLoading(false);
            }
        };

        compositeImages();
    }, [templateUrl, printArea, designUrl]);

    // Show loading state
    return (
        <div className={`relative ${className}`}>
            {/* Hidden canvas for compositing - ALWAYS RENDER so ref stays valid */}
            <canvas ref={canvasRef} style={{ display: 'none' }} />

            {/* Loading overlay */}
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted/50 z-10 rounded-lg">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
            )}

            {/* Error overlay - temporary for debugging */}
            {error && (
                <div className="absolute top-0 left-0 right-0 bg-red-500/80 text-white p-2 text-xs z-20">
                    {error}
                </div>
            )}

            {/* Display the composite */}
            <img
                src={compositeUrl || designUrl}
                alt={alt}
                className="w-full h-full object-contain"
            />
        </div>
    );
}

function getProxiedUrl(src: string): string {
    try {
        const url = new URL(src);
        const needsProxy =
            url.hostname.includes('s3') ||
            url.hostname.includes('amazonaws.com');

        if (needsProxy) {
            return `/api/proxy-image?url=${encodeURIComponent(src)}`;
        }
    } catch {
        // Invalid URL, return as-is
    }
    return src;
}

function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = (e) => reject(new Error(`Failed to load image: ${src}`));
        img.src = getProxiedUrl(src);
    });
}

function drawImageCover(
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement,
    targetArea: { x: number; y: number; width: number; height: number }
) {
    const { x, y, width, height } = targetArea;

    // Calculate source dimensions to maintain aspect ratio (cover mode)
    const imgRatio = img.width / img.height;
    const targetRatio = width / height;

    let srcX = 0, srcY = 0, srcWidth = img.width, srcHeight = img.height;

    if (imgRatio > targetRatio) {
        // Image is wider than target: crop horizontally
        srcWidth = img.height * targetRatio;
        srcX = (img.width - srcWidth) / 2;
    } else {
        // Image is taller than target: crop vertically
        srcHeight = img.width / targetRatio;
        srcY = (img.height - srcHeight) / 2;
    }

    ctx.drawImage(img, srcX, srcY, srcWidth, srcHeight, x, y, width, height);
}

export default FrameMockupRenderer;
