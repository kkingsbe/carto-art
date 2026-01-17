# Fix Tapestry Rotation Issue - Implementation Plan

## Problem Summary

The tapestry product (Product ID: 614, Variant ID: 33974) has a 90° orientation mismatch between the design and the print area in client-side compositing. This causes portrait images to appear rotated incorrectly in the mockup preview.

## Root Cause Analysis

### Current State
- **Template Reality**: The tapestry template has a **landscape** magenta print area (842×702 pixels)
- **Database Storage**: Contains **incorrect portrait** values (760×840 pixels)
- **Client Rotation Logic**: Compares design orientation to stored print area orientation
- **The Bug**: When a portrait image (400×500) is uploaded:
  - Design orientation: Portrait (400×500)
  - Stored print area orientation: Portrait (760×840) ← **WRONG**
  - Rotation decision: No rotation needed
  - **Result**: Portrait image placed on landscape template without rotation → 90° mismatch

### Why It Happens
The stored print area values in the database are incorrect. The magenta detection correctly identifies the landscape print area (842×702), but the database contains old/incorrect portrait values (760×840).

### Key Files Involved
1. [`components/ecommerce/FrameMockupRenderer.tsx`](components/ecommerce/FrameMockupRenderer.tsx) - Client-side rotation logic (lines 116-122)
2. [`app/debug/mockup/page.tsx`](app/debug/mockup/page.tsx) - Debug page with "Update Database" button (line 522-539)
3. [`lib/actions/printful.ts`](lib/actions/printful.ts) - Server-side print area update function (line 647-675)
4. [`app/api/debug/analyze-template/route.ts`](app/api/debug/analyze-template/route.ts) - Magenta detection API

## Solution

### Option 1: Update Database with Correct Values (Recommended)
Update the database with the correctly detected landscape print area values.

**Steps:**
1. Navigate to `/debug/mockup` page
2. Select the tapestry variant (ID: 33974)
3. Verify the detected magenta bounds show landscape orientation (842×702)
4. Click "Update Database with Detected Bounds" button
5. Verify the update was successful by checking the database

**Why this should work:**
- The [`updateVariantPrintArea()`](lib/actions/printful.ts:647) function correctly updates the `mockup_print_area` field
- Once updated, the rotation logic will correctly detect:
  - Design: Portrait (400×500)
  - Print area: Landscape (842×702) ← **CORRECT**
  - Decision: Rotation needed → Apply 90° rotation

### Option 2: Regenerate Template (Alternative)
Force regenerate the entire mockup template from Printful API.

**Steps:**
1. Navigate to `/debug/mockup` page
2. Select the tapestry variant (ID: 33974)
3. Click "Regenerate Template Data" button
4. This will:
   - Request new mockup from Printful with magenta placeholder
   - Detect print area from the new template
   - Save to Supabase storage
   - Update database with new values

**Why this might be needed:**
- If the template URL itself is also incorrect or outdated
- Ensures both template and print area are in sync

## Implementation Steps

### Step 1: Verify Current State
```sql
-- Check current print area values for tapestry variant
SELECT id, name, mockup_print_area, mockup_template_url
FROM product_variants
WHERE id = 33974;
```

Expected current values (incorrect):
```json
{
  "x": 0.12,
  "y": 0.08,
  "width": 0.76,
  "height": 0.84
}
```

### Step 2: Update with Correct Values
Use the debug page to update with detected values:
```json
{
  "x": 0.079,
  "y": 0.149,
  "width": 0.842,
  "height": 0.702
}
```

### Step 3: Verify Fix
1. Test with portrait image (400×500):
   - Should now rotate 90° to fit landscape print area
   - Design and print area should align correctly

2. Test with landscape image (500×400):
   - Should NOT rotate (already matches print area orientation)
   - Design should fit directly into print area

### Step 4: Check for Other Affected Products
```sql
-- Find other variants where detected orientation doesn't match stored orientation
-- This query would need to be run with actual magenta detection
SELECT id, name, mockup_print_area
FROM product_variants
WHERE mockup_print_area IS NOT NULL
  AND mockup_template_url IS NOT NULL;
```

## Rotation Logic Explanation

The rotation logic in [`FrameMockupRenderer.tsx`](components/ecommerce/FrameMockupRenderer.tsx:116-122):

```typescript
const designIsPortrait = designImg.height > designImg.width;
const printAreaIsPortrait = printAreaPx.height > printAreaPx.width;
const needsRotation = designIsPortrait !== printAreaIsPortrait;
```

**How it works:**
- Compares design aspect ratio to print area aspect ratio
- If orientations differ → rotate 90°
- If orientations match → no rotation

**Example scenarios:**

| Design | Print Area | Rotation? | Result |
|--------|-----------|-----------|--------|
| Portrait (400×500) | Portrait (760×840) | No | ✅ Correct |
| Portrait (400×500) | Landscape (842×702) | Yes | ✅ Correct |
| Landscape (500×400) | Portrait (760×840) | Yes | ✅ Correct |
| Landscape (500×400) | Landscape (842×702) | No | ✅ Correct |

**Current tapestry bug:**
- Design: Portrait (400×500)
- Stored print area: Portrait (760×840) ← **WRONG**
- Actual template: Landscape (842×702)
- Rotation: No (because stored values say portrait)
- Result: ❌ 90° mismatch

**After fix:**
- Design: Portrait (400×500)
- Stored print area: Landscape (842×702) ← **CORRECT**
- Actual template: Landscape (842×702)
- Rotation: Yes (because orientations differ)
- Result: ✅ Correct alignment

## Testing Plan

### Test Case 1: Portrait Design on Tapestry
- Input: 400×500 portrait image
- Expected: Image rotated 90° to fit landscape print area
- Verify: Design fills print area correctly, no gaps or overflow

### Test Case 2: Landscape Design on Tapestry
- Input: 500×400 landscape image
- Expected: Image placed directly without rotation
- Verify: Design fills print area correctly, no gaps or overflow

### Test Case 3: Square Design on Tapestry
- Input: 500×500 square image
- Expected: Image placed without rotation (square has no orientation)
- Verify: Design fills print area correctly

### Test Case 4: Other Products (Regression Test)
- Test a few other products (posters, canvases, etc.)
- Verify: No regression in rotation behavior
- Confirm: Other products still work correctly

## Potential Issues & Solutions

### Issue 1: "Update Database" Button Doesn't Work
**Symptoms:** Clicking the button doesn't update the database

**Possible causes:**
1. Permission issue (not admin)
2. Network error
3. Database constraint violation

**Solution:**
- Check browser console for errors
- Verify admin permissions
- Try "Regenerate Template Data" instead

### Issue 2: Rotation Still Wrong After Update
**Symptoms:** Even after updating, rotation is still incorrect

**Possible causes:**
1. Database cache not refreshed
2. Client-side cache of variant data
3. Wrong values were applied

**Solution:**
- Hard refresh the page (Ctrl+Shift+R)
- Clear browser cache
- Verify database values were actually updated
- Check that the correct variant ID was selected

### Issue 3: Template URL is Also Wrong
**Symptoms:** Print area is correct but mockup still looks wrong

**Possible causes:**
1. Template URL points to wrong/outdated template
2. Template image itself has wrong orientation

**Solution:**
- Use "Regenerate Template Data" to get fresh template from Printful
- This will regenerate both template URL and print area

## Success Criteria

✅ Portrait images (400×500) display correctly on tapestry mockup
✅ Landscape images (500×400) display correctly on tapestry mockup
✅ No regression on other product types
✅ Database contains correct landscape print area values (842×702)
✅ Template analysis shows "Match: Yes" for orientation

## Next Steps

1. **Immediate Fix**: Update database with correct print area values using debug page
2. **Verification**: Test with both portrait and landscape images
3. **Documentation**: Update any documentation about tapestry product handling
4. **Monitoring**: Check if other products have similar issues
5. **Prevention**: Consider adding validation to detect orientation mismatches during template generation

## Additional Notes

### Why Magenta Detection is Correct
The magenta detection algorithm scans every pixel and finds the bounding box of all magenta pixels. For the tapestry:
- Detected: 842×702 (landscape)
- This matches the actual visible magenta region in the template
- The detection is working correctly

### Why Stored Values are Wrong
The stored values (760×840 portrait) were likely:
- Manually entered incorrectly
- Copied from another product
- Generated with an old/buggy version of the detection algorithm
- Never properly validated against the actual template

### Special Handling for Product 614
The user mentioned "there is one product with special handling for generating the templates; this is the same product (id and everything)". This suggests the tapestry (product 614) may have had custom logic that introduced this bug. We should search for any special-case code for product 614 and review it.
