# Sales Funnel Analysis Report
**Generated:** January 14, 2026
**Analysis Period:** Last 7 days
**Real Customer Purchases:** 0 (all 11 orders are test orders)

---

## Executive Summary

After 5 days live, the store has **zero real customer purchases** despite 446 people seeing the purchase modal.

**The Numbers:**
- **446 modal viewers** → **387 blocked by auth requirement** (86.8% loss)
- **59 logged-in users** → **21 attempted purchase** (35.6%)
- **21 purchase attempts** → **20 passed upload** (95%)
- **20 uploads** → **1 purchased** (5%)

**Root Cause:** The authentication wall prevents 387 anonymous sessions from reaching the store. Even removing this wall wouldn't solve everything — only 35% of logged-in users clicked buy, suggesting a CTA/UX issue as well.

---

## Funnel Data (Last 7 Days)

### By Total Events
| Step | Events | Conversion | Issue |
|------|--------|------------|-------|
| Export Modal Views | 1,000 | - | |
| ├─ Authenticated | 382 | 38.2% | |
| ├─ Anonymous | 618 | 61.8% | **Cannot buy - auth required** |
| Shop Transition Clicks | 33 | 3.3% | Very low CTR |
| Store Page Views | 1,000 | 100% | (all transitioned users) |
| Product Views | 207 | 20.7% | |
| Checkout Started | 18 | 1.8% | |
| Purchase Complete | 10 | - | All test orders |

### By Unique Users/Sessions
| Step | Unique Count | Conversion from Previous | Note |
|------|------|---------------------------|------|
| Modal Viewers | 446 total | - | 59 auth + 387 anon sessions |
| Shop Transition Attempts | 21 | 4.7% | Very low |
| Store Page Viewers | 2 | 9.5% | **Only test accounts** |
| Checkout Started | 5 | 250% | More events than users (repeats) |
| Purchase Complete | 1 | 20% | Your test account |

**Key Finding:** Only **21 unique users** out of **446** even attempted to buy. **387 anonymous sessions** were blocked by the auth wall.

---

## What Happened to Your 446 Modal Viewers

```
446 Modal Viewers
├── 59 Authenticated Users
│   ├─ 21 clicked "Buy Print" (35.6%)
│   │  ├─ 20 successfully navigated to store
│   │  └─ 3 hit upload errors
│   └─ 38 dismissed modal without clicking (64.4%)
│
└── 387 Anonymous Sessions
    ├─ 0 purchased (0%)
    ├─ ~0-1 may have clicked (data unclear)
    └─ 387 blocked by auth wall (100%)
```

**Translation:** You had 446 people ready to buy. Only 59 were logged in. Only 21 actually clicked buy. Of those 21, only 20 made it past the upload step, and of those, only 1 (your test) completed purchase.

---

## Critical Issues

### 1. Authentication Wall Blocking Sales (PRIMARY)

**Impact:** 387 potential customers lost (86.8% of shop transition attempts blocked)
**Location:** `components/layout/PosterEditor.tsx:791-793`

```typescript
onBuyPrint={isEcommerceEnabled ? async () => {
  if (!isAuthenticated) {
    setShowLoginModal(true);  // ← BLOCKS PURCHASE
    return;
  }
  // ... rest of purchase flow
```

**What Happens:**
1. User exports a poster → sees success modal
2. User clicks "Claim 10% Off Now"
3. If not logged in → redirected to login modal
4. User abandons (no tracking of this abandonment)

**Evidence (Unique Users):**
- **387 anonymous sessions** saw the modal (61.8%)
- **0 of them attempted purchase** (blocked by auth wall)
- **59 authenticated users** saw the modal (38.2%)
- **21 of them clicked buy** (35.6% conversion)
- **Only 1 completed purchase** (your test)

**Fix Options:**
1. Allow guest checkout (require email only at payment)
2. Move auth requirement to payment step, not shop transition
3. Show login prompt earlier in flow (before export)

---

### 2. Very Low CTA Click-Through (3.3%)

**Impact:** 96.7% of modal viewers don't click buy
**Location:** `components/controls/ExportSuccessModal.tsx`

**Current State:**
- Modal shows after export with "Claim 10% Off Now" CTA
- Secondary actions (Save, Share, Publish) delayed 4 seconds
- Most users dismiss via close button (97%)

**Modal Dismissal Methods:**
| Method | Count | % |
|--------|-------|---|
| Button (X) | 973 | 97.3% |
| Escape Key | 25 | 2.5% |
| Backdrop Click | 2 | 0.2% |

**Potential Fixes:**
- A/B test CTA copy ("Order Print" vs "Claim 10% Off")
- Make CTA more visually prominent
- Test removing urgency timer (may feel spammy)
- Add product preview/mockup in modal

---

### 3. Shop Transition Upload Failures

**Impact:** 40% failure rate (3 of ~8 non-test attempts)
**Location:** `components/layout/PosterEditor.tsx:814-840`

**Error:** "Failed to upload image data"

**Failures Logged:**
1. Jan 11, 2026 1:01 AM
2. Jan 11, 2026 1:07 AM
3. Jan 12, 2026 2:40 PM

**Possible Causes:**
- Large image file size
- Network timeout
- Supabase storage quota/limits
- CORS issues

**Investigation Needed:**
- Check Supabase storage logs
- Add better error logging with file size/type
- Implement retry logic

---

### 4. Checkout Step Tracking Gaps

**Issue:** Steps not being tracked properly

| Step | Expected | Actual |
|------|----------|--------|
| Checkout Started | ✓ | 18 |
| Size Selected | ✓ | 0 |
| Shipping Entered | ✓ | 0 |
| Payment View | ✓ | 0 |
| Purchase Complete | ✓ | 10 |

**Location to check:** `components/ecommerce/OrderSteps.tsx`

Events defined in `lib/events/types.ts` but not firing:
- `checkout_step_complete` with `event_name: 'size_selected'`
- `checkout_step_complete` with `event_name: 'shipping_entered'`
- `checkout_payment_view`

---

## Traffic Overview (Last 7 Days)

```
Page Views:        1,000
Unique Sessions:      63
Unique Users:          2
New Signups:         465
Maps Created:        183
Maps Published:      346
Poster Exports:    1,000
Purchases:             0 (real customers)
```

### Traffic Sources
| Source | Count |
|--------|-------|
| Direct | 1,095 |
| accounts.google.com | 176 |
| google.com | 9 |
| github.com | 8 |
| bing.com | 2 |
| duckduckgo.com | 1 |

### Top Pages
| Page | Views |
|------|-------|
| /editor | 960 |
| / | 23 |
| /gallery | 6 |
| /login | 5 |

---

## Orders in Database

All orders are test orders from development:

| # | Status | Amount | Date |
|---|--------|--------|------|
| 1 | paid | $107.10 | Jan 9, 2:05 PM |
| 2 | paid | $153.08 | Jan 9, 2:02 PM |
| 3 | paid | $134.16 | Jan 9, 1:59 PM |
| 4 | paid | $134.16 | Jan 9, 1:28 PM |
| 5 | paid | $107.10 | Jan 9, 1:23 PM |
| 6 | paid | $44.98 | Jan 9, 1:06 PM |
| 7 | paid | $55.47 | Jan 9, 1:05 PM |
| 8 | paid | $134.16 | Jan 9, 12:52 PM |
| 9 | paid | $107.10 | Jan 9, 12:37 AM |
| 10 | paid | $82.82 | Jan 9, 12:04 AM |
| 11 | paid | $61.90 | Jan 8, 7:24 PM |

**Total Test Revenue:** $1,122.03

---

## Recommended Fixes (Priority Order)

### Priority 1: Remove Auth Wall for Shop Browsing
**Effort:** Medium | **Impact:** High

Allow anonymous users to:
- Click "Buy Print"
- View store and products
- Select size/options

Only require authentication at payment submission.

**Files to modify:**
- `components/layout/PosterEditor.tsx` - Remove early auth check
- Potentially add guest checkout flow

---

### Priority 2: Add Auth Redirect Tracking
**Effort:** Low | **Impact:** Medium (visibility)

Track when users hit the auth wall:

```typescript
// Add before setShowLoginModal(true)
trackEventAction({
  eventType: 'shop_auth_required',
  eventName: 'anonymous_user_blocked',
  sessionId: getSessionId(),
  metadata: { source: 'export_modal' }
});
```

---

### Priority 3: Fix Upload Failures
**Effort:** Medium | **Impact:** Medium

1. Add detailed error logging (file size, type, duration)
2. Implement retry logic with exponential backoff
3. Check Supabase storage limits
4. Consider client-side image compression

---

### Priority 4: Fix Checkout Step Tracking
**Effort:** Low | **Impact:** Low (analytics only)

Verify events are firing in:
- `components/ecommerce/OrderSteps.tsx`
- `components/ecommerce/CheckoutForm.tsx`

---

### Priority 5: A/B Test Modal CTA
**Effort:** Medium | **Impact:** Unknown

Test variations:
- Button text: "Order Print" vs "Claim 10% Off" vs "Get This Printed"
- Remove urgency timer
- Different button colors/sizes
- Inline product selection (skip store page)

---

## CLI Tools for Ongoing Analysis

```bash
# Sales funnel diagnosis (shows unique users at each step)
npx tsx cli_tools/diagnose_sales.ts 7     # Last 7 days
npx tsx cli_tools/diagnose_sales.ts 30    # Last 30 days

# Full traffic analysis overview
npx tsx cli_tools/traffic_analysis.ts 7
npx tsx cli_tools/traffic_analysis.ts 30

# Check feature flags status
npm run pcli check-feature-flags

# View orders in database
npm run pcli db:inspect orders 20

# Check paywall stats
npm run pcli check-paywall-stats

# Query specific events
npm run pcli db:rpc get_period_analytics start_time=2026-01-01
```

**Recommended:** Run `diagnose_sales.ts` weekly to track if your fixes are working.

---

## Feature Flag Status

| Flag | Dev | Prod | Status |
|------|-----|------|--------|
| ecommerce | true | true | Active |
| carto_plus | true | true | Active |
| gif_export | true | true | Active |
| video_export | true | true | Active |
| mcp_server | true | false | Dev only |
| blog | true | false | Dev only |
| stl_export | true | false | Dev only |

---

## Next Steps

1. [ ] Decide on auth wall approach (guest checkout vs early login prompt)
2. [ ] Implement chosen fix
3. [ ] Add auth redirect tracking
4. [ ] Investigate upload failures in Supabase logs
5. [ ] Fix checkout step tracking
6. [ ] Re-run analysis after 7 days with fixes

---

*Report generated by Claude Code sales funnel analysis*
