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
    imageClassName?: string;
    className?: string;
    alt?: string;
    onDebug?: (msg: string) => void;
    onDebugStages?: (stages: { name: string; url: string; description?: string }[]) => void;
    onRendered?: (url: string) => void;
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
    imageClassName = '',
    alt = 'Product preview',
    onDebug,
    onDebugStages,
    onRendered
}: FrameMockupRendererProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [compositeUrl, setCompositeUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // ... (effect logic remains unchanged, but we need to keep internal logic intact so we don't clear it)
        // Ideally we should not replace the whole function body if we can avoid it, but we need to change the RETURN JSX.
        // Wait, replace_file_content replaces the chunk. I need to be careful not to delete the useEffect.
        // I will target the Props interface first, then the Return statement separately?
        // Or I can replace the whole functional component if I have the context.
        // I have the file content from previous read.
        // But the previous read was earlier.
        // I will split this into 2 replacements: 1. Interface, 2. Return JSX.
        // Actually, let's just do the interface first.
    }, []); // Placeholder to cancel this thought since I can't put comments in tool call


    useEffect(() => {
        // If no template, just show the raw design
        // Also check if designUrl is valid (not "undefined" string)
        if (!templateUrl || !printArea || !designUrl || designUrl === 'undefined') {
            setCompositeUrl(designUrl !== 'undefined' ? designUrl : null);
            setIsLoading(false);
            return;
        }

        const compositeImages = async () => {
            setIsLoading(true);
            setError(null);
            const stages: { name: string; url: string; description?: string }[] = [];

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

                // Step 0: Fill background with white
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                // Determine if we need to rotate the design to match print area orientation
                const designIsPortrait = designImg.height > designImg.width;
                const printAreaIsPortrait = printAreaPx.height > printAreaPx.width;
                const needsRotation = designIsPortrait !== printAreaIsPortrait;

                log(`Design orientation: ${designIsPortrait ? 'portrait' : 'landscape'}`);
                log(`Print area orientation: ${printAreaIsPortrait ? 'portrait' : 'landscape'}`);
                log(`Needs rotation: ${needsRotation}`);

                // If orientations don't match, rotate the design first
                // Step 1: Draw the design on a separate canvas first for chroma-key replacement
                const designCanvas = document.createElement('canvas');
                designCanvas.width = canvas.width;
                designCanvas.height = canvas.height;
                const designCtx = designCanvas.getContext('2d');
                if (!designCtx) throw new Error('Could not create design context');
                log('Step 1: Created design context');

                let effectiveDesignImg = designImg;
                if (needsRotation) {
                    // Create a rotated version of the design
                    const rotatedCanvas = document.createElement('canvas');
                    // Swap dimensions for 90° rotation
                    rotatedCanvas.width = designImg.height;
                    rotatedCanvas.height = designImg.width;
                    const rotatedCtx = rotatedCanvas.getContext('2d');
                    if (rotatedCtx) {
                        // Rotate 90° clockwise
                        rotatedCtx.translate(rotatedCanvas.width / 2, rotatedCanvas.height / 2);
                        rotatedCtx.rotate(Math.PI / 2);
                        rotatedCtx.drawImage(designImg, -designImg.width / 2, -designImg.height / 2);

                        // Create a new image from the rotated canvas
                        const rotatedImg = new Image();
                        rotatedImg.src = rotatedCanvas.toDataURL();
                        // We need to wait for it, but since it's a data URL it should be instant
                        effectiveDesignImg = {
                            width: rotatedCanvas.width,
                            height: rotatedCanvas.height
                        } as HTMLImageElement;

                        // Draw the rotated design directly using the canvas
                        drawImageCover(designCtx, rotatedCanvas, printAreaPx);
                        log('Step 1b: Drew rotated design');
                    }
                } else {
                    drawImageCover(designCtx, designImg, printAreaPx);
                }

                const designData = designCtx.getImageData(0, 0, canvas.width, canvas.height).data;
                log('Step 2: Got design data');

                stages.push({
                    name: '1. Resized Design',
                    url: designCanvas.toDataURL(),
                    description: needsRotation
                        ? 'Design rotated 90° CW and scaled to cover the print area'
                        : 'Design scaled to cover the print area'
                });

                // Step 2: Draw the template on the main canvas
                ctx.drawImage(templateImg, 0, 0);
                log('Step 3: Drew template');

                stages.push({
                    name: '2. Raw Template',
                    url: canvas.toDataURL(),
                    description: 'Template image drawn on canvas'
                });


                // Step 3: Replace placeholder pixels with the design
                // dynamically sample the color at the center of the print area
                // dynamcially sample the color
                // Sample a grid of points to reliably find the chroma key (magenta)
                // We scan a 7x7 grid within the print area to avoid missing the color
                // due to text, glares, or misaligned print areas.
                const samplePoints = [];
                const steps = 7;
                for (let iy = 1; iy < steps; iy++) {
                    for (let ix = 1; ix < steps; ix++) {
                        samplePoints.push({
                            x: printAreaPx.x + (printAreaPx.width * ix / steps),
                            y: printAreaPx.y + (printAreaPx.height * iy / steps)
                        });
                    }
                }

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
                let bestP = { x: 0, y: 0 };

                // Debug visualization canvas for sampling
                const debugSampleCanvas = document.createElement('canvas');
                debugSampleCanvas.width = canvas.width;
                debugSampleCanvas.height = canvas.height;
                const debugSampleCtx = debugSampleCanvas.getContext('2d');
                if (debugSampleCtx) {
                    debugSampleCtx.drawImage(canvas, 0, 0);
                }

                // Find the candidate with the highest saturation
                // Magenta is typically very saturated (S ~ 1.0)
                for (const p of samplePoints) {
                    // Safe bounds check
                    if (p.x < 0 || p.x >= canvas.width || p.y < 0 || p.y >= canvas.height) continue;

                    const pxData = ctx.getImageData(Math.floor(p.x), Math.floor(p.y), 1, 1).data;
                    const r = pxData[0], g = pxData[1], b = pxData[2];
                    const [h, s, l] = rgbToHslLoc(r, g, b);

                    // Prefer higher saturation
                    if (s > bestCandidate.s) {
                        bestCandidate = { r, g, b, h, s, l };
                        bestP = p;
                    }

                    if (debugSampleCtx) {
                        debugSampleCtx.fillStyle = `rgba(255, 0, 0, 0.5)`;
                        debugSampleCtx.fillRect(p.x - 2, p.y - 2, 4, 4);
                    }
                }

                if (debugSampleCtx && bestP.x !== 0) {
                    // Highlight best candidate
                    debugSampleCtx.strokeStyle = 'lime';
                    debugSampleCtx.lineWidth = 3;
                    debugSampleCtx.strokeRect(bestP.x - 4, bestP.y - 4, 8, 8);
                    stages.push({
                        name: '3. Sampling Points',
                        url: debugSampleCanvas.toDataURL(),
                        description: 'Red dots are sample points. Green box is best candidate (highest saturation).'
                    });
                }

                const targetR = bestCandidate.r;
                const targetG = bestCandidate.g;
                const targetB = bestCandidate.b;
                const targetH = bestCandidate.h;
                const targetS = bestCandidate.s;
                const targetL = bestCandidate.l;

                log('Step 4: Sampled best color', `rgba(${targetR}, ${targetG}, ${targetB})`,
                    'HSL:', `[${targetH.toFixed(1)}, ${targetS.toFixed(2)}, ${targetL.toFixed(2)}]`);

                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imageData.data;

                // Determine blend mode based on sampled color
                const targetIsColored = targetS > 0.1;
                const targetIsBlack = targetS < 0.1 && targetL < 0.1;
                const targetIsWhite = targetS < 0.1 && targetL > 0.9;

                // Blend mode:
                // - "chroma": Colored chroma-key detected (e.g., magenta) - full replacement of matching pixels
                // - "multiply": White/light neutral detected - multiply blend to preserve template details
                // - "direct": Black or invalid sampled - direct overlay in print area
                let blendMode: 'chroma' | 'multiply' | 'direct';

                if (targetIsColored) {
                    blendMode = 'chroma';
                } else if (targetIsBlack) {
                    // Black sampled usually means this is a print file template or 
                    // the chroma key detection failed - use direct overlay
                    blendMode = 'direct';
                } else {
                    // White/gray neutral - use multiply blend
                    blendMode = 'multiply';
                }

                log('Step 4b: Blend mode:', blendMode);

                const hueThreshold = 30; // degrees

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

                    const dr = designData[i];
                    const dg = designData[i + 1];
                    const db = designData[i + 2];
                    const da = designData[i + 3];

                    if (blendMode === 'direct') {
                        // Direct replacement - just put the design on top
                        data[i] = dr;
                        data[i + 1] = dg;
                        data[i + 2] = db;
                        data[i + 3] = da;
                        replacedCount++;
                    } else if (blendMode === 'chroma') {
                        // Chroma-key mode: replace colored matching pixels, multiply neutrals
                        const [h, s, l] = rgbToHslLoc(r, g, b);
                        const isNeutral = s < 0.1;

                        if (isNeutral) {
                            // Multiply blend for neutral pixels (preserve shadows/lines)
                            // We need to account for alpha: if the template has a transparent black shadow,
                            // we should treat it as 'dimming' the design, not turning it black.
                            // Calculate effective luminance by blending template pixel over white
                            const alpha = a / 255;
                            const effectiveR = r * alpha + 255 * (1 - alpha);
                            const effectiveG = g * alpha + 255 * (1 - alpha);
                            const effectiveB = b * alpha + 255 * (1 - alpha);

                            data[i] = (effectiveR * dr) / 255;
                            data[i + 1] = (effectiveG * dg) / 255;
                            data[i + 2] = (effectiveB * db) / 255;
                            data[i + 3] = da;
                            replacedCount++;
                        } else {
                            // Check if this pixel matches the chroma-key hue
                            const hueDiff = Math.abs(h - targetH);
                            const isHueMatch = Math.min(hueDiff, 360 - hueDiff) < hueThreshold;
                            if (isHueMatch && s > 0.1) {
                                // Full replacement for chroma-key pixels
                                data[i] = dr;
                                data[i + 1] = dg;
                                data[i + 2] = db;
                                data[i + 3] = da;
                                replacedCount++;
                            }
                        }
                    } else {
                        // Multiply mode: blend all pixels in print area
                        const [, s,] = rgbToHslLoc(r, g, b);
                        const isNeutral = s < 0.1;

                        if (isNeutral) {
                            // Multiply blend - white becomes design, black stays black
                            // Same alpha logic as above
                            const alpha = a / 255;
                            const effectiveR = r * alpha + 255 * (1 - alpha);
                            const effectiveG = g * alpha + 255 * (1 - alpha);
                            const effectiveB = b * alpha + 255 * (1 - alpha);

                            data[i] = (effectiveR * dr) / 255;
                            data[i + 1] = (effectiveG * dg) / 255;
                            data[i + 2] = (effectiveB * db) / 255;
                            data[i + 3] = da;
                            replacedCount++;
                        }
                    }
                }

                log(`Step 5: Blended ${replacedCount} pixels using ${blendMode} mode`);
                ctx.putImageData(imageData, 0, 0);

                // Convert to data URL
                // The design has been rotated to match print area orientation, keep it that way
                const finalDataUrl = canvas.toDataURL('image/png');

                setCompositeUrl(finalDataUrl);

                stages.push({
                    name: '4. Final Result',
                    url: finalDataUrl,
                    description: needsRotation
                        ? 'Final composited output (design rotated to match print area orientation)'
                        : 'Final composited output'
                });

                if (onDebugStages) {
                    onDebugStages(stages);
                }

                if (onRendered) {
                    onRendered(finalDataUrl);
                }
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
        <div className={`relative flex items-center justify-center ${className}`}>
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
                className={`block max-w-full max-h-full w-auto h-auto object-contain mx-auto ${imageClassName}`}
            />
        </div>
    );
}

function getProxiedUrl(src: string): string {
    try {
        if (!src || src === 'undefined') return '';
        const url = new URL(src);
        const needsProxy =
            url.hostname.includes('s3') ||
            url.hostname.includes('amazonaws.com');

        if (needsProxy) {
            // Check if already proxied to avoid double proxying
            if (src.includes('/api/proxy-image')) return src;
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

function drawImageContain(
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement,
    targetArea: { x: number; y: number; width: number; height: number }
) {
    const { x, y, width, height } = targetArea;

    // Calculate destination dimensions to maintain aspect ratio (contain mode)
    // This fits the entire image within the target area, centering it
    const imgRatio = img.width / img.height;
    const targetRatio = width / height;

    let destWidth: number, destHeight: number, destX: number, destY: number;

    if (imgRatio > targetRatio) {
        // Image is wider than target: fit to width, center vertically
        destWidth = width;
        destHeight = width / imgRatio;
        destX = x;
        destY = y + (height - destHeight) / 2;
    } else {
        // Image is taller than target: fit to height, center horizontally
        destHeight = height;
        destWidth = height * imgRatio;
        destX = x + (width - destWidth) / 2;
        destY = y;
    }

    // Draw the entire source image into the calculated destination rectangle
    ctx.drawImage(img, 0, 0, img.width, img.height, destX, destY, destWidth, destHeight);
}

/**
 * Draws an image or canvas to cover the target area completely (may crop).
 * Used after rotation when design orientation matches print area orientation.
 */
function drawImageCover(
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement | HTMLCanvasElement,
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
