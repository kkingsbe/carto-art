# Fix Tapestry Product Rotation Issue

## Problem Summary

The tapestry product (product ID 614, variant 33974) shows a 90° orientation mismatch between the design and the magenta print area in the client-side compositing preview. This occurs regardless of whether a portrait or landscape design is used.

## Root Cause

The `mockup_print_area` stored in the database for the tapestry variant has **incorrect orientation values**:
- **Detected magenta bounds**: Landscape orientation (width > height)
- **Stored print area**: Portrait orientation (height > width)

This causes the rotation logic in [`FrameMockupRenderer.tsx`](../components/ecommerce/FrameMockupRenderer.tsx:116-122) to make incorrect decisions:

```typescript
const designIsPortrait = designImg.height > designImg.width;
const printAreaIsPortrait = printAreaPx.height > printAreaPx.width;  // WRONG due to bad DB data
const needsRotation = designIsPortrait !== printAreaIsPortrait;      // Inverted result
```

## Behavior Analysis

| Design Type | Stored Print Area | Actual Magenta | needsRotation | Result |
|-------------|-------------------|----------------|---------------|--------|
| Landscape   | Portrait (wrong)  | Landscape      | true (wrong)  | Design rotated when it shouldn't be |
| Portrait    | Portrait (wrong)  | Landscape      | false (wrong) | Design NOT rotated when it should be |

Both cases result in a 90° mismatch.

## Solution

### Immediate Fix (Database Update)

1. Go to `/debug/mockup` page
2. Select the tapestry variant (33974)
3. Verify the "Template Analysis" card shows:
   - Magenta bounds: Landscape orientation
   - Print area: Portrait orientation (mismatch)
4. Click **"Update Database with Detected Bounds"**
5. Verify the print area now shows Landscape orientation
6. Test with both portrait and landscape designs

### Code Changes Required

None for the immediate fix - the database update will correct the issue.

### Long-term Improvements

To prevent this issue from recurring:

1. **Add validation in `detectPrintArea()`** - Log a warning if the detected bounds have a significantly different aspect ratio than expected
2. **Add orientation verification in `generateMockupTemplates()`** - After detecting print area, verify it makes sense for the product type
3. **Consider runtime detection** - Optionally detect magenta bounds at render time instead of relying solely on stored values (adds processing overhead)

## Files Involved

- [`components/ecommerce/FrameMockupRenderer.tsx`](../components/ecommerce/FrameMockupRenderer.tsx) - Client-side compositing with rotation logic
- [`lib/actions/printful.ts`](../lib/actions/printful.ts) - Server-side print area detection and database updates
- [`app/debug/mockup/page.tsx`](../app/debug/mockup/page.tsx) - Debug page with template analysis and DB update button
- [`app/api/debug/analyze-template/route.ts`](../app/api/debug/analyze-template/route.ts) - API for analyzing template images

## Testing Checklist

After applying the fix:

- [ ] Load tapestry variant on `/debug/mockup`
- [ ] Test with landscape design URL (e.g., `https://picsum.photos/300/200`)
  - [ ] Design should appear horizontal, matching the magenta area
- [ ] Test with portrait design URL (e.g., `https://picsum.photos/200/300`)
  - [ ] Design should be rotated 90° to match the landscape magenta area
- [ ] Test with square design URL (e.g., `https://picsum.photos/300/300`)
  - [ ] Design should appear without rotation
- [ ] Generate official Printful mockup and compare to client composite
