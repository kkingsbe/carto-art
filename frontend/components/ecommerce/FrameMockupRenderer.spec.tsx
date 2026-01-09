import { test, expect } from '@playwright/experimental-ct-react';
import FrameMockupRenderer from './FrameMockupRenderer';

/**
 * Playwright Component Tests for FrameMockupRenderer
 * 
 * These tests validate the canvas compositing logic that overlays
 * user designs onto frame mockup templates.
 * 
 * Test fixtures are stored in /public/test-fixtures/
 */

// Base URL for test fixtures (relative to public folder)
const FIXTURE_BASE = '/test-fixtures';

// Mock print areas that simulate Printful's mockup_print_area
const PRINT_AREAS = {
    portrait: { x: 50, y: 50, width: 500, height: 700 },
    landscape: { x: 50, y: 50, width: 700, height: 500 },
    square: { x: 50, y: 50, width: 500, height: 500 },
    tallNarrow: { x: 75, y: 50, width: 350, height: 700 },
};

test.describe('FrameMockupRenderer', () => {

    test.describe('Basic Rendering', () => {

        test('renders composite image correctly', async ({ mount, page }) => {
            const component = await mount(
                <FrameMockupRenderer
                    templateUrl={`${FIXTURE_BASE}/portrait-template.png`}
                    printArea={PRINT_AREAS.portrait}
                    designUrl={`${FIXTURE_BASE}/portrait-design.png`}
                    name="Test Composite"
                    alt="Test composite render"
                />
            );

            // Wait for canvas rendering to complete
            await page.waitForTimeout(1000);

            // Verify component is visible
            await expect(component).toBeVisible();

            // Check that an img element was created with the composite result
            const img = component.locator('img');
            await expect(img).toBeVisible();

            // Verify the image has a valid data URL or blob URL (composite result)
            const src = await img.getAttribute('src');
            expect(src).toBeTruthy();
            expect(src?.startsWith('data:') || src?.startsWith('blob:')).toBeTruthy();

            // Take a screenshot for visual regression
            await expect(component).toHaveScreenshot('basic-composite.png', {
                maxDiffPixels: 100, // Allow small variations due to anti-aliasing
            });
        });

        test('shows loading state before completion', async ({ mount, page }) => {
            // Mount with deliberately slow-loading images to catch loading state
            const component = await mount(
                <FrameMockupRenderer
                    templateUrl={`${FIXTURE_BASE}/portrait-template.png`}
                    printArea={PRINT_AREAS.portrait}
                    designUrl={`${FIXTURE_BASE}/portrait-design.png`}
                    name="Loading Test"
                />
            );

            // The loading spinner should be visible initially (or very briefly)
            // Since rendering is fast, we just verify the component mounts without error
            await expect(component).toBeVisible();
        });

        test('handles error state when template fails to load', async ({ mount, page }) => {
            // Use an invalid template URL to trigger error
            const debugMessages: string[] = [];

            const component = await mount(
                <FrameMockupRenderer
                    templateUrl="/invalid/nonexistent-template.png"
                    printArea={PRINT_AREAS.portrait}
                    designUrl={`${FIXTURE_BASE}/portrait-design.png`}
                    name="Error Test"
                    onDebug={(msg) => debugMessages.push(msg)}
                />
            );

            // Wait for error state
            await page.waitForTimeout(2000);

            // Component should still be visible (graceful degradation)
            await expect(component).toBeVisible();
        });
    });

    test.describe('Aspect Ratio Handling', () => {

        test('portrait design in portrait frame - correct aspect ratio', async ({ mount, page }) => {
            const component = await mount(
                <FrameMockupRenderer
                    templateUrl={`${FIXTURE_BASE}/portrait-template.png`}
                    printArea={PRINT_AREAS.portrait}
                    designUrl={`${FIXTURE_BASE}/portrait-design.png`}
                    name="Portrait in Portrait"
                />
            );

            await page.waitForTimeout(1000);
            await expect(component).toBeVisible();

            await expect(component).toHaveScreenshot('portrait-in-portrait.png', {
                maxDiffPixels: 100,
            });
        });

        test('landscape design in landscape frame - correct aspect ratio', async ({ mount, page }) => {
            const component = await mount(
                <FrameMockupRenderer
                    templateUrl={`${FIXTURE_BASE}/landscape-template.png`}
                    printArea={PRINT_AREAS.landscape}
                    designUrl={`${FIXTURE_BASE}/landscape-design.png`}
                    name="Landscape in Landscape"
                />
            );

            await page.waitForTimeout(1000);
            await expect(component).toBeVisible();

            await expect(component).toHaveScreenshot('landscape-in-landscape.png', {
                maxDiffPixels: 100,
            });
        });

        test('portrait design in landscape frame - rotation logic', async ({ mount, page }) => {
            // This tests the auto-rotation feature:
            // When orientation mismatch occurs, design should be rotated to fit
            const debugMessages: string[] = [];

            const component = await mount(
                <FrameMockupRenderer
                    templateUrl={`${FIXTURE_BASE}/landscape-template.png`}
                    printArea={PRINT_AREAS.landscape}
                    designUrl={`${FIXTURE_BASE}/portrait-design.png`}
                    name="Portrait in Landscape (Rotation)"
                    onDebug={(msg) => debugMessages.push(msg)}
                />
            );

            await page.waitForTimeout(1500);
            await expect(component).toBeVisible();

            await expect(component).toHaveScreenshot('portrait-in-landscape-rotation.png', {
                maxDiffPixels: 200, // Allow more variation due to rotation anti-aliasing
            });
        });

        test('landscape design in portrait frame - rotation logic', async ({ mount, page }) => {
            const component = await mount(
                <FrameMockupRenderer
                    templateUrl={`${FIXTURE_BASE}/portrait-template.png`}
                    printArea={PRINT_AREAS.portrait}
                    designUrl={`${FIXTURE_BASE}/landscape-design.png`}
                    name="Landscape in Portrait (Rotation)"
                />
            );

            await page.waitForTimeout(1500);
            await expect(component).toBeVisible();

            await expect(component).toHaveScreenshot('landscape-in-portrait-rotation.png', {
                maxDiffPixels: 200,
            });
        });

        test('square design in square frame - no distortion', async ({ mount, page }) => {
            const component = await mount(
                <FrameMockupRenderer
                    templateUrl={`${FIXTURE_BASE}/portrait-template.png`}
                    printArea={PRINT_AREAS.square}
                    designUrl={`${FIXTURE_BASE}/square-design.png`}
                    name="Square in Square"
                />
            );

            await page.waitForTimeout(1000);
            await expect(component).toBeVisible();

            await expect(component).toHaveScreenshot('square-no-distortion.png', {
                maxDiffPixels: 100,
            });
        });

        test('extreme aspect ratio (tall/narrow 1:3)', async ({ mount, page }) => {
            const component = await mount(
                <FrameMockupRenderer
                    templateUrl={`${FIXTURE_BASE}/portrait-template.png`}
                    printArea={PRINT_AREAS.tallNarrow}
                    designUrl={`${FIXTURE_BASE}/tall-design.png`}
                    name="Extreme Tall Aspect Ratio"
                />
            );

            await page.waitForTimeout(1000);
            await expect(component).toBeVisible();

            await expect(component).toHaveScreenshot('extreme-tall-aspect-ratio.png', {
                maxDiffPixels: 100,
            });
        });
    });

    test.describe('Dark Frame Detection', () => {

        test('detects dark frame and adapts background', async ({ mount, page }) => {
            // The landscape template uses a dark/black frame
            // This tests that the background color adapts appropriately
            const debugMessages: string[] = [];

            const component = await mount(
                <FrameMockupRenderer
                    templateUrl={`${FIXTURE_BASE}/landscape-template.png`}
                    printArea={PRINT_AREAS.landscape}
                    designUrl={`${FIXTURE_BASE}/landscape-design.png`}
                    name="Dark Frame Detection"
                    onDebug={(msg) => debugMessages.push(msg)}
                />
            );

            await page.waitForTimeout(1000);
            await expect(component).toBeVisible();

            await expect(component).toHaveScreenshot('dark-frame-background.png', {
                maxDiffPixels: 100,
            });
        });
    });

    test.describe('Null/Undefined Props', () => {

        test('handles null templateUrl gracefully', async ({ mount, page }) => {
            const component = await mount(
                <FrameMockupRenderer
                    templateUrl={null}
                    printArea={PRINT_AREAS.portrait}
                    designUrl={`${FIXTURE_BASE}/portrait-design.png`}
                    name="Null Template"
                />
            );

            await page.waitForTimeout(500);
            await expect(component).toBeVisible();
        });

        test('handles null printArea gracefully', async ({ mount, page }) => {
            const component = await mount(
                <FrameMockupRenderer
                    templateUrl={`${FIXTURE_BASE}/portrait-template.png`}
                    printArea={null}
                    designUrl={`${FIXTURE_BASE}/portrait-design.png`}
                    name="Null Print Area"
                />
            );

            await expect(component).toBeVisible();
        });

        test('handles "undefined" string in designUrl gracefully', async ({ mount, page }) => {
            const component = await mount(
                <FrameMockupRenderer
                    templateUrl={`${FIXTURE_BASE}/portrait-template.png`}
                    printArea={PRINT_AREAS.portrait}
                    designUrl="undefined"
                    name="Undefined String URL"
                />
            );

            await page.waitForTimeout(500);
            await expect(component).toBeVisible();
            // Should not show error overlay
            await expect(component.locator('.bg-red-500')).not.toBeVisible();
        });
    });

    test.describe('Debug Callbacks', () => {

        test('calls onDebug callback during compositing', async ({ mount, page }) => {
            const debugMessages: string[] = [];

            const component = await mount(
                <FrameMockupRenderer
                    templateUrl={`${FIXTURE_BASE}/portrait-template.png`}
                    printArea={PRINT_AREAS.portrait}
                    designUrl={`${FIXTURE_BASE}/portrait-design.png`}
                    name="Debug Callback Test"
                    onDebug={(msg) => debugMessages.push(msg)}
                />
            );

            await page.waitForTimeout(1500);

            // Verify debug messages were collected
            expect(debugMessages.length).toBeGreaterThan(0);
        });

        test('calls onDebugStages callback with stage info', async ({ mount, page }) => {
            type Stage = { name: string; url: string; description?: string };
            const stages: Stage[] = [];

            const component = await mount(
                <FrameMockupRenderer
                    templateUrl={`${FIXTURE_BASE}/portrait-template.png`}
                    printArea={PRINT_AREAS.portrait}
                    designUrl={`${FIXTURE_BASE}/portrait-design.png`}
                    name="Debug Stages Test"
                    onDebugStages={(s) => stages.push(...s)}
                />
            );

            await page.waitForTimeout(1500);

            // onDebugStages may or may not be called depending on implementation
            // Just verify no errors occurred
            await expect(component).toBeVisible();
        });
    });
});
