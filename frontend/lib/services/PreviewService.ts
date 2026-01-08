import { ProductVariant } from "../constants/products";

// Helper to load an image
const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = (e) => reject(e);
        img.src = src;
    });
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
        return null;
    }

    try {
        const [templateParams, designImg] = await Promise.all([
            // Load template
            loadImage(`/api/proxy-image?url=${encodeURIComponent(variant.mockup_template_url)}`),
            // Use cached design image if provided, otherwise load it
            cachedDesignImage ? Promise.resolve(cachedDesignImage) : loadImage(designUrl)
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
        console.error("Error generating preview for variant", variant.id, e);
        return null;
    }
}
