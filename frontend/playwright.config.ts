import { defineConfig, devices } from '@playwright/experimental-ct-react';

/**
 * Playwright Component Testing configuration for FrameMockupRenderer
 * visual regression tests.
 * 
 * @see https://playwright.dev/docs/test-components
 */
export default defineConfig({
    testDir: './components',
    testMatch: '**/*.spec.tsx',

    // Snapshot directory for visual regression tests
    snapshotDir: './playwright/.snapshots',

    // Run tests in headless mode
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,

    // Reporter configuration
    reporter: 'html',

    use: {
        // Consistent viewport for visual comparisons
        viewport: { width: 800, height: 600 },

        // Visual comparison settings
        screenshot: 'only-on-failure',

        // Component testing bundle configuration
        ctPort: 3100,
        ctViteConfig: {
            resolve: {
                alias: {
                    '@': '.',
                },
            },
        },
    },

    // Configure projects for different screen sizes
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
        {
            name: 'mobile',
            use: { ...devices['Pixel 5'] },
        },
    ],
});
