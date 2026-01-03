import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

export async function getBrowser() {
    // Use local chrome in development
    if (process.env.NODE_ENV === 'development') {
        // Common Windows Chrome path (first one that exists will be used)
        const possiblePaths = [
            'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
            'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
        ];

        return await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
            executablePath: possiblePaths[0], // Use first path, will error if not found
            headless: true,
            defaultViewport: { width: 1920, height: 1080 }
        });
    }

    // Production (Vercel / Lambda)
    return await puppeteer.launch({
        args: [...(chromium.args || [])],
        defaultViewport: { width: 1920, height: 1080 },
        executablePath: await chromium.executablePath(),
        headless: true,
    });
}
