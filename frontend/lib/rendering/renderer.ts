import { getBrowser } from './browser';
import { logger } from '@/lib/logger';
import type { PosterConfig } from '@/types/poster';

export interface RenderOptions {
    width: number;
    height: number;
    pixelRatio?: number;
    timeout?: number;
}

/**
 * Standardizes the map rendering process using Puppeteer
 */
export async function renderMapToBuffer(config: PosterConfig, options: RenderOptions): Promise<Buffer> {
    const { width, height, pixelRatio = 1, timeout = 45000 } = options;
    let browser = null;

    try {
        browser = await getBrowser();
        const page = await browser.newPage();

        // Forward console logs in development
        if (process.env.NODE_ENV === 'development') {
            page.on('console', msg => {
                console.log(`[Browser Console] ${msg.type().toUpperCase()}: ${msg.text()}`);
            });
        }

        page.on('pageerror', (err: unknown) => {
            logger.error(`[Browser Page Error] ${String(err)}`);
        });

        await page.setViewport({
            width: 1920,
            height: 1080,
            deviceScaleFactor: 1,
        });

        const appUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://cartoart.net';
        const rendererUrl = `${appUrl}/renderer`;

        // Navigate to renderer
        await page.goto(rendererUrl, { waitUntil: 'domcontentloaded' });

        // Wait for renderPoster to be exposed
        await page.waitForFunction('typeof window.renderPoster === "function"', { timeout: 10000 });

        // Inject Config
        await page.evaluate((cfg) => {
            window.renderPoster(cfg);
        }, config as any);

        // Wait for rendering to complete
        const result = await Promise.race([
            page.waitForSelector('#render-complete', { timeout }).then(() => 'complete'),
            page.waitForSelector('#render-error', { timeout }).then(() => 'error')
        ]);

        if (result === 'error') {
            throw new Error('Renderer reported a configuration error');
        }

        await page.waitForFunction(() => {
            return (window as any).generatePosterImage !== undefined;
        }, { timeout: 5000 });

        // Execute export
        const base64Image = await page.evaluate(async (res) => {
            return await window.generatePosterImage(res);
        }, { width, height, dpi: 72 * pixelRatio, name: 'poster' });

        return Buffer.from(base64Image, 'base64');

    } catch (error) {
        logger.error('Map rendering failed', { error });
        throw error;
    } finally {
        if (browser) await browser.close();
    }
}
