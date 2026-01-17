import { ProductVariant } from "../constants/products";

// Cache for template images to avoid repeated proxy requests
const templateImageCache = new Map<string, HTMLImageElement>();

/**
 * Determines if a URL needs to be proxied.
 * S3 URLs need proxying for CORS, but Supabase URLs can be loaded directly.
 */
function needsProxy(url: string): boolean {
    try {
        const parsed = new URL(url);
        // Only proxy S3 URLs (they need CORS handling)
        return parsed.hostname.includes('s3') || parsed.hostname.includes('amazonaws.com');
    } catch {
        // Invalid URL, don't proxy
        return false;
    }
}

/**
 * Returns the appropriate URL for loading an image.
 * S3 URLs are proxied, Supabase URLs are loaded directly.
 */
function getProxiedUrl(url: string): string {
    if (!url || url === 'undefined') return url;
    
    // Check if already proxied to avoid double proxying
    if (url.includes('/api/proxy-image')) return url;
    
    // Only proxy S3 URLs
    if (needsProxy(url)) {
        return `/api/proxy-image?url=${encodeURIComponent(url)}`;
    }
    
    // Load Supabase URLs and others directly
    return url;
}

// Helper to load an image with timeout and retry logic
const loadImage = (
    src: string,
    options: { timeout?: number; retries?: number } = {}
): Promise<HTMLImageElement> => {
    const { timeout = 10000, retries = 2 } = options;

    const attemptLoad = (attempt: number): Promise<HTMLImageElement> => {
        return new Promise((resolve, reject) => {
            console.log(`[PreviewService] Attempting to load image (attempt ${attempt + 1}/${retries + 1})`, {
                src: src.substring(0, 100),
                fullSrc: src,
                isProxyUrl: src.includes('/api/proxy-image'),
                isS3Url: src.includes('s3.amazonaws.com') || src.includes('s3-accelerate.amazonaws.com'),
                isSupabaseUrl: src.includes('supabase.co'),
                isDataUrl: src.startsWith('data:'),
                isHttp: src.startsWith('http://') || src.startsWith('https://'),
                cacheHit: src.includes('/api/proxy-image') && templateImageCache.has(src)
            });

            // Check cache first for proxied template images (S3 URLs only)
            if (src.includes('/api/proxy-image') && templateImageCache.has(src)) {
                const cached = templateImageCache.get(src);
                if (cached && cached.complete) {
                    console.log(`[PreviewService] Using cached template image: ${src.substring(0, 50)}...`);
                    resolve(cached);
                    return;
                }
            }

            const img = new Image();
            img.crossOrigin = "anonymous";

            // Set timeout
            const timeoutId = setTimeout(() => {
                const error = new Error(`Image load timeout after ${timeout}ms`);
                console.error(`[PreviewService] Load timeout (attempt ${attempt + 1}/${retries + 1})`, {
                    src: src.substring(0, 100),
                    timeout
                });
                reject(error);
            }, timeout);

            img.onload = () => {
                clearTimeout(timeoutId);
                console.log(`[PreviewService] Successfully loaded image (attempt ${attempt + 1}/${retries + 1})`, {
                    src: src.substring(0, 100),
                    width: img.width,
                    height: img.height
                });

                // Cache only proxied template images (S3 URLs)
                // Supabase URLs are loaded directly and don't need caching
                if (src.includes('/api/proxy-image')) {
                    templateImageCache.set(src, img);
                }

                resolve(img);
            };

            img.onerror = (e) => {
                clearTimeout(timeoutId);

                // Extract detailed error information from the Event object
                const event = e as Event;
                const target = event.target as HTMLImageElement;

                // Log individual properties to avoid serialization issues
                console.error("[PreviewService] Image load error details:", {
                    src: src.substring(0, 100),
                    eventType: event.type,
                    eventBubbles: event.bubbles,
                    eventCancelable: event.cancelable,
                    targetSrc: target?.src?.substring(0, 100) || 'undefined',
                    targetComplete: target?.complete,
                    targetNaturalWidth: target?.naturalWidth,
                    targetNaturalHeight: target?.naturalHeight,
                    targetWidth: target?.width,
                    targetHeight: target?.height,
                    currentSrc: target?.currentSrc?.substring(0, 100) || 'undefined',
                    crossOrigin: target?.crossOrigin,
                    attempt: attempt + 1,
                    maxAttempts: retries + 1,
                    // Check if this is a proxy URL
                    isProxyUrl: src.includes('/api/proxy-image'),
                    // Check if this is an S3 URL
                    isS3Url: src.includes('s3.amazonaws.com') || src.includes('s3-accelerate.amazonaws.com'),
                    // Check if this is a Supabase URL
                    isSupabaseUrl: src.includes('supabase.co'),
                    // Check if design URL (not proxy)
                    isDesignUrl: !src.includes('/api/proxy-image'),
                });

                // Also log the raw event for inspection
                console.error("[PreviewService] Raw error event:", event);

                const errorDetails = {
                    src: src.substring(0, 100),
                    errorMessage: e instanceof Error ? e.message : String(e),
                    errorName: e instanceof Error ? e.name : undefined,
                    attempt: attempt + 1,
                    maxAttempts: retries + 1,
                    imgComplete: img.complete,
                    imgNaturalWidth: img.naturalWidth,
                    imgNaturalHeight: img.naturalHeight
                };
                console.error("[PreviewService] Failed to load image", errorDetails);
                reject(new Error(`Failed to load image: ${src.substring(0, 50)}...`));
            };

            img.src = src;
        });
    };

    // Implement retry logic
    const loadWithRetry = async (attempt: number): Promise<HTMLImageElement> => {
        try {
            return await attemptLoad(attempt);
        } catch (error) {
            if (attempt < retries) {
                console.log(`[PreviewService] Retrying image load (attempt ${attempt + 2}/${retries + 1})`, {
                    src: src.substring(0, 100)
                });
                // Exponential backoff
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 500));
                return loadWithRetry(attempt + 1);
            }
            throw error;
        }
    };

    return loadWithRetry(0);
};

// Helper to draw image cover (same as in FrameMockupRenderer)
const drawImageCover = (
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement,
    targetArea: { x: number; y: number; width: number; height: number }
) => {
    const imgRatio = img.width / img.height;
    const targetRatio = targetArea.width / targetArea.height;

    let renderWidth, renderHeight, offsetX, offsetY;

    if (imgRatio > targetRatio) {
        // Image is wider than target - fit height
        renderHeight = targetArea.height;
        renderWidth = renderHeight * imgRatio;
        offsetY = targetArea.y;
        offsetX = targetArea.x - (renderWidth - targetArea.width) / 2;
    } else {
        // Image is taller than target - fit width
        renderWidth = targetArea.width;
        renderHeight = renderWidth / imgRatio;
        offsetX = targetArea.x;
        offsetY = targetArea.y - (renderHeight - targetArea.height) / 2;
    }

    ctx.save();
    ctx.beginPath();
    ctx.rect(targetArea.x, targetArea.y, targetArea.width, targetArea.height);
    ctx.clip();
    ctx.drawImage(img, offsetX, offsetY, renderWidth, renderHeight);
    ctx.restore();
};

/**
 * Generates a preview image for a single variant
 */
export async function generateVariantPreview(
    designUrl: string,
    variant: any, // Using any because Supabase types might vary slightly from local types
    cachedDesignImage?: HTMLImageElement
): Promise<string | null> {
    if (!variant.mockup_template_url || !variant.mockup_print_area) {
        console.log(`[PreviewService] Skipping variant ${variant.id}: missing mockup data`);
        return null;
    }

    console.log(`[PreviewService] Generating preview for variant ${variant.id}`, {
        hasCachedDesignImage: !!cachedDesignImage,
        designUrl: designUrl.substring(0, 100) + '...',
        templateUrl: variant.mockup_template_url.substring(0, 100) + '...',
        fullTemplateUrl: variant.mockup_template_url,
        fullDesignUrl: designUrl,
        variantId: variant.id,
        variantName: variant.name
    });

    try {
        // Validate cached design image if provided
        if (cachedDesignImage) {
            if (!cachedDesignImage.complete || cachedDesignImage.naturalWidth === 0) {
                console.warn(`[PreviewService] Cached design image is not complete, will reload`, {
                    variantId: variant.id,
                    complete: cachedDesignImage.complete,
                    naturalWidth: cachedDesignImage.naturalWidth,
                    naturalHeight: cachedDesignImage.naturalHeight
                });
                // Fall through to load the image
            } else {
                console.log(`[PreviewService] Using cached design image for variant ${variant.id}`, {
                    width: cachedDesignImage.width,
                    height: cachedDesignImage.height
                });
            }
        }

        const [templateParams, designImg] = await Promise.all([
            // Load template - proxy only S3 URLs, load Supabase URLs directly
            loadImage(getProxiedUrl(variant.mockup_template_url)),
            // Use cached design image if provided and valid, otherwise load it
            (cachedDesignImage && cachedDesignImage.complete && cachedDesignImage.naturalWidth > 0)
                ? Promise.resolve(cachedDesignImage)
                : loadImage(designUrl)
        ]);

        const canvas = document.createElement('canvas');
        canvas.width = templateParams.width;
        canvas.height = templateParams.height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        if (!ctx) return null;

        // Draw template first (base)
        ctx.drawImage(templateParams, 0, 0);

        // Get print area
        let printArea = variant.mockup_print_area;
        if (typeof printArea === 'string') {
            try {
                printArea = JSON.parse(printArea);
            } catch (e) {
                console.error("Failed to parse print area", e);
                return null;
            }
        }

        // Validate print area
        if (typeof printArea.x !== 'number' || typeof printArea.width !== 'number') {
            return null;
        }

        // Convert percentages to pixels
        const area = {
            x: printArea.x * canvas.width,
            y: printArea.y * canvas.height,
            width: printArea.width * canvas.width,
            height: printArea.height * canvas.height
        };

        // Get image data to find magenta pixels
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        const targetR = 255, targetG = 0, targetB = 255; // Magenta
        const tolerance = 60;

        // 1. Create a mask of the print area (magenta pixels)
        const maskCanvas = document.createElement('canvas');
        maskCanvas.width = canvas.width;
        maskCanvas.height = canvas.height;
        const maskCtx = maskCanvas.getContext('2d');
        if (!maskCtx) return null;

        const maskImageData = maskCtx.createImageData(canvas.width, canvas.height);
        // Only iterate within the bounding box of the print area to save perf
        const startX = Math.floor(Math.max(0, area.x));
        const startY = Math.floor(Math.max(0, area.y));
        const endX = Math.ceil(Math.min(canvas.width, area.x + area.width));
        const endY = Math.ceil(Math.min(canvas.height, area.y + area.height));

        for (let y = startY; y < endY; y++) {
            for (let x = startX; x < endX; x++) {
                const i = (y * canvas.width + x) * 4;
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];

                // Check if pixel is magenta-ish
                if (Math.abs(r - targetR) < tolerance &&
                    Math.abs(g - targetG) < tolerance &&
                    Math.abs(b - targetB) < tolerance) {

                    // Mark as part of the mask
                    maskImageData.data[i] = 0;   // R
                    maskImageData.data[i + 1] = 0; // G
                    maskImageData.data[i + 2] = 0; // B
                    maskImageData.data[i + 3] = 255; // Alpha
                }
            }
        }
        maskCtx.putImageData(maskImageData, 0, 0);

        // 2. Draw the design onto a temp canvas
        const designCanvas = document.createElement('canvas');
        designCanvas.width = canvas.width;
        designCanvas.height = canvas.height;
        const designCtx = designCanvas.getContext('2d');
        if (!designCtx) return null;

        // Draw design scaled to cover the print area
        drawImageCover(designCtx, designImg as HTMLImageElement, area);

        // 3. Composite: Mask the design with the magenta mask
        designCtx.globalCompositeOperation = 'destination-in';
        designCtx.drawImage(maskCanvas, 0, 0);

        // 4. Draw the original template again on top (to get shadows/borders)
        // using 'multiply' or similar if we wanted, but the simpler approach 
        // with magenta replacement usually puts the design BEHIND.
        // Wait, standard magenta replacement usually:
        // 1. Draw template
        // 2. Clear magenta -> transparent
        // 3. Draw design UNDER

        // Let's stick to the FrameMockupRenderer logic which likely does:
        // 1. Draw Design
        // 2. Draw Template on top? No, template has opaque parts.

        // Re-reading FrameMockupRenderer logic might be good, but standard approach:
        // If template has magenta where the image goes, we usually want to:
        // A) Make mug/frame transparent where magenta is, draw image behind.

        // Let's retry with the standard compositing approach:

        const finalCanvas = document.createElement('canvas');
        finalCanvas.width = canvas.width;
        finalCanvas.height = canvas.height;
        const finalCtx = finalCanvas.getContext('2d');
        if (!finalCtx) return null;

        // Clear magenta in original image data
        for (let y = startY; y < endY; y++) {
            for (let x = startX; x < endX; x++) {
                const i = (y * canvas.width + x) * 4;
                if (Math.abs(data[i] - targetR) < tolerance &&
                    Math.abs(data[i + 1] - targetG) < tolerance &&
                    Math.abs(data[i + 2] - targetB) < tolerance) {
                    data[i + 3] = 0; // Make transparent
                }
            }
        }
        ctx.putImageData(imageData, 0, 0); // Update template canvas with transparency

        // Fill background with white (or a very light gray) to avoid black JPEG borders
        finalCtx.fillStyle = '#ffffff';
        finalCtx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);

        // Draw design on final canvas
        drawImageCover(finalCtx, designImg as HTMLImageElement, area);

        // Draw template (with transparency) on top
        finalCtx.drawImage(canvas, 0, 0);

        return finalCanvas.toDataURL('image/jpeg', 0.85);

    } catch (e) {
        console.error("[PreviewService] Error generating preview for variant", variant.id, {
            error: e,
            errorMessage: e instanceof Error ? e.message : String(e),
            errorStack: e instanceof Error ? e.stack : undefined,
            errorName: e instanceof Error ? e.name : undefined,
            variantId: variant.id,
            hasMockupTemplateUrl: !!variant.mockup_template_url,
            hasMockupPrintArea: !!variant.mockup_print_area,
            designUrl: designUrl.substring(0, 100),
            templateUrl: variant.mockup_template_url?.substring(0, 100),
            printArea: variant.mockup_print_area
        });
        return null;
    }
}
