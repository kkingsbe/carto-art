# Carto-Art Stripped-Down Migration Plan

## Executive Summary

This document outlines the migration plan to strip the Carto-Art repository down to only the core map editor and PNG export functionality. All user accounts, authentication, database dependencies, ecommerce, social features, and additional export formats will be removed.

**Target State:** A stateless, anonymous map editor with unlimited PNG exports, no database dependencies, and no user accounts.

---

## Requirements Summary

Based on stakeholder requirements, the stripped-down version will:

- ✅ Keep: Core map editor at `/editor`
- ✅ Keep: Landing/marketing page
- ✅ Keep: PNG export only (remove STL, GIF, Video)
- ✅ Keep: Editor APIs (random-location, geocode, tiles)
- ❌ Remove: All authentication and user accounts
- ❌ Remove: Project saving/loading
- ❌ Remove: Publishing/sharing maps
- ❌ Remove: Gallery and map/[id] pages
- ❌ Remove: Subscription/usage limits (make unlimited)
- ❌ Remove: All Supabase dependencies
- ❌ Remove: Ecommerce (store, checkout, Printful, Stripe)
- ❌ Remove: Admin panel
- ❌ Remove: Blog
- ❌ Remove: Developer docs
- ❌ Remove: Feedback system
- ❌ Remove: Social features (comments, votes, follows)
- ❌ Remove: Analytics and event tracking
- ❌ Remove: Feature flags

---

## Architecture Overview

### Current Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (Next.js)                       │
├─────────────────────────────────────────────────────────────┤
│  Pages: Editor, Store, Gallery, Profile, Admin, Blog, Dev   │
│  Components: Editor, Ecommerce, Social, Admin, UI            │
│  Hooks: Auth, Projects, Export, Subscription, Usage        │
│  Lib: Supabase, Stripe, Printful, Analytics, Export         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    External Services                         │
│  Supabase (Auth, DB, Storage)                               │
│  Stripe (Payments)                                           │
│  Printful (POD)                                              │
│  Resend (Email)                                              │
│  Google Analytics                                            │
└─────────────────────────────────────────────────────────────┘
```

### Target Architecture

```
┌─────────────────────────────────────────────────────────────┐
│              Stripped Frontend (Next.js)                     │
├─────────────────────────────────────────────────────────────┤
│  Pages: Editor, Landing                                      │
│  Components: Editor, UI only                                 │
│  Hooks: Editor, Export (PNG only)                           │
│  Lib: Map rendering, Export (PNG), Geocoding, Tiles         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    External Services                         │
│  Map Tiles (OSM/Maptiler)                                    │
│  Geocoding API (Nominatim)                                   │
└─────────────────────────────────────────────────────────────┘
```

---

## File Deletion Plan

### 1. App Routes to Delete

#### Authentication Routes
- `frontend/app/(auth)/` - Entire directory
  - `login/page.tsx`
  - `login/LoginContent.tsx`
- `frontend/app/auth/callback/route.ts`

#### Main App Routes (Non-Core)
- `frontend/app/(main)/gallery/page.tsx`
- `frontend/app/(main)/map/[id]/page.tsx`
- `frontend/app/(main)/profile/page.tsx`
- `frontend/app/(main)/profile/orders/page.tsx`
- `frontend/app/(main)/user/[username]/page.tsx`

#### Store & Ecommerce Routes
- `frontend/app/store/page.tsx`
- `frontend/app/store/[productId]/page.tsx`
- `frontend/app/store-home/page.tsx`
- `frontend/app/order/page.tsx`
- `frontend/app/order/success/page.tsx`
- `frontend/app/track-order/page.tsx`

#### Admin Routes
- `frontend/app/admin/` - Entire directory
  - All admin pages and subdirectories

#### Blog Routes
- `frontend/app/blog/page.tsx`
- `frontend/app/blog/[slug]/page.tsx`

#### Developer Routes
- `frontend/app/developer/` - Entire directory
  - `page.tsx`
  - `dashboard/page.tsx`
  - `docs/page.tsx`
  - `mcp/page.tsx`

#### Location Routes
- `frontend/app/location/[city]/page.tsx`

#### Renderer Route
- `frontend/app/renderer/page.tsx`

### 2. API Routes to Delete

#### Admin API Routes
- `frontend/app/api/admin/` - Entire directory
  - `activity/route.ts`
  - `analytics/route.ts`
  - `analytics/realtime/route.ts`
  - `debug/orders/route.ts`
  - `exports/route.ts`
  - `feature-flags/route.ts`
  - `feedback/route.ts`
  - `feedback/[id]/route.ts`
  - `settings/route.ts`
  - `stats/` - Entire subdirectory
  - `users/route.ts`
  - `users/[id]/role/route.ts`
  - `vistas/route.ts`

#### Ecommerce API Routes
- `frontend/app/api/checkout/route.ts`
- `frontend/app/api/checkout/route.test.ts`
- `frontend/app/api/printful/` - Entire directory
  - `mockup/route.ts`
  - `shipping/route.ts`
  - `shipping/route.test.ts`
  - `upload/route.ts`
  - `upload/route.test.ts`
  - `variant/[id]/route.ts`
- `frontend/app/api/order-tracking/route.ts`
- `frontend/app/api/upload-design/route.ts`
- `frontend/app/api/verify-ecommerce/route.ts`

#### Webhook API Routes
- `frontend/app/api/webhooks/` - Entire directory
  - `buymeacoffee/route.ts`
  - `resend/route.ts`
  - `stripe/route.ts`
  - `stripe/route.test.ts`

#### Cron API Routes
- `frontend/app/api/cron/sync-orders/route.ts`

#### Export API Routes (Non-PNG)
- `frontend/app/api/export/stl/route.ts`

#### Feedback API Routes
- `frontend/app/api/feedback/route.ts`
- `frontend/app/api/feedback/dismiss/route.ts`
- `frontend/app/api/feedback/should-show/route.ts`

#### Feature Flags API Routes
- `frontend/app/api/feature-flags/[key]/route.ts`

#### Publish API Routes
- `frontend/app/api/publish/route.ts`

#### V1 API Routes (Most)
- `frontend/app/api/v1/auth/` - Entire directory
- `frontend/app/api/v1/maps/route.ts`
- `frontend/app/api/v1/maps/[id]/vote/route.ts`
- `frontend/app/api/v1/maps/[id]/comments/route.ts`
- `frontend/app/api/v1/posters/generate/route.ts`
- `frontend/app/api/v1/posters/generate/route.test.ts`
- `frontend/app/api/v1/styles/route.ts`
- `frontend/app/api/v1/styles/[id]/route.ts`
- `frontend/app/api/v1/users/[id]/follow/route.ts`
- `frontend/app/api/v1/virtual-users/` - Entire directory
- `frontend/app/api/v1/openapi.json/route.ts`

#### Vistas API Routes
- `frontend/app/api/vistas/route.ts`

### 3. Components to Delete

#### Admin Components
- `frontend/components/admin/` - Entire directory

#### Analytics Components
- `frontend/components/analytics/` - Entire directory

#### Auth Components
- `frontend/components/auth/` - Entire directory

#### Blog Components
- `frontend/components/blog/` - Entire directory

#### Changelog Components
- `frontend/components/changelog/` - Entire directory

#### Comments Components
- `frontend/components/comments/` - Entire directory

#### Ecommerce Components
- `frontend/components/ecommerce/` - Entire directory
  - `CheckoutForm.tsx`
  - `FrameMockupRenderer.tsx`
  - `OrderPageClient.tsx`
  - `OrdersList.tsx`
  - `OrderSteps.tsx`
  - `OrderSuccessToast.tsx`
  - `ProductModal.tsx`
  - `ProductPreviewGrid.tsx`
  - `ShippingForm.tsx`
  - `VariantCard.tsx`

#### Feed Components
- `frontend/components/feed/` - Entire directory

#### Feedback Components
- `frontend/components/feedback/` - Entire directory

#### Gallery Components
- `frontend/components/gallery/` - Entire directory

#### Landing Components (Review - may keep some)
- `frontend/components/landing/` - Review and keep only essential marketing components

#### Notifications Components
- `frontend/components/notifications/` - Entire directory

#### Profile Components
- `frontend/components/profile/` - Entire directory

#### SEO Components
- `frontend/components/seo/` - Entire directory

#### Store Components
- `frontend/components/store/` - Entire directory

#### Third-Party Components
- `frontend/components/third-party/` - Entire directory

#### Voting Components
- `frontend/components/voting/` - Entire directory

### 4. Hooks to Delete

- `frontend/hooks/useAdmin.ts`
- `frontend/hooks/useAnonExportUsage.ts` (no longer needed without limits)
- `frontend/hooks/useInfiniteFeed.ts`
- `frontend/hooks/useProjectManager.ts` (no project saving)
- `frontend/hooks/useSavedProjects.ts` (no project saving)
- `frontend/hooks/useUsageLimits.ts` (no limits)
- `frontend/hooks/useUserSubscription.ts` (no subscriptions)
- `frontend/hooks/useVistas.ts`
- `frontend/hooks/useGifExport.ts` (GIF export removed)
- `frontend/hooks/useVideoExport.ts` (Video export removed)

### 5. Library Files to Delete

#### Supabase
- `frontend/lib/supabase/` - Entire directory

#### Stripe
- `frontend/lib/stripe/` - Entire directory

#### Printful
- `frontend/lib/printful/` - Entire directory

#### Ecommerce
- `frontend/lib/ecommerce/` - Entire directory (if exists)

#### Analytics
- `frontend/lib/analytics.ts`
- `frontend/lib/actions/analytics.ts`

#### Events
- `frontend/lib/events.ts`
- `frontend/lib/actions/events.ts`

#### Feature Flags
- `frontend/lib/feature-flags.ts`

#### Admin Auth
- `frontend/lib/admin-auth.ts`

#### Email
- `frontend/lib/email/` - Entire directory

#### Storage
- `frontend/lib/storage.ts`
- `frontend/lib/actions/storage.ts`
- `frontend/lib/actions/export-storage.ts`

#### Actions (Non-Core)
- `frontend/lib/actions/ecommerce.ts`
- `frontend/lib/actions/ecommerce.test.ts`
- `frontend/lib/actions/featured-maps.ts`
- `frontend/lib/actions/feed.ts`
- `frontend/lib/actions/maps.ts` (review - may need for publishing)
- `frontend/lib/actions/notifications.ts`
- `frontend/lib/actions/printful.ts`
- `frontend/lib/actions/printful.detect.test.ts`
- `frontend/lib/actions/subscription.ts`
- `frontend/lib/actions/tickets.ts`
- `frontend/lib/actions/usage.ts`
- `frontend/lib/actions/usage.types.ts`
- `frontend/lib/actions/user.ts`
- `frontend/lib/actions/votes.ts`
- `frontend/lib/actions/changelog.ts`
- `frontend/lib/actions/comments.ts`
- `frontend/lib/actions/referrer.ts`
- `frontend/lib/actions/stats.ts`

#### Export (Non-PNG)
- `frontend/lib/export/stl-generation.ts`

#### Services
- `frontend/lib/services/` - Review and keep only essential services

#### Data
- `frontend/lib/data/` - Review and keep only essential data

#### Middleware
- `frontend/lib/middleware/` - Review and keep only essential middleware

### 6. Test Files to Delete

All test files related to deleted functionality:
- `frontend/__tests__/` - Review and delete non-essential tests
- `frontend/__mocks__/` - Review and delete non-essential mocks
- All `.test.ts` and `.spec.ts` files for deleted components

### 7. Configuration Files to Update

#### package.json
Remove dependencies:
- `@stripe/react-stripe-js`
- `@stripe/stripe-js`
- `stripe`
- `@supabase/ssr`
- `@supabase/supabase-js`
- `resend`
- `@google-analytics/data`
- `recharts` (if only used for admin analytics)

Remove scripts:
- `test:ecommerce`
- `test:integration` (if only for ecommerce)

#### Environment Variables
Remove from `.env.example` and any config files:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `PRINTFUL_API_KEY`
- `RESEND_API_KEY`
- `GOOGLE_ANALYTICS_ID`

---

## File Modification Plan

### 1. Core Editor Components to Modify

#### PosterEditor.tsx
**Location:** `frontend/components/layout/PosterEditor.tsx`

**Changes:**
- Remove all auth-related imports and state
- Remove `useSavedProjects` hook
- Remove `useProjectManager` hook
- Remove `useUserSubscription` hook
- Remove `useUsageLimits` hook
- Remove `useAnonExportUsage` hook
- Remove `useFeatureFlag` hook
- Remove `useGifExport` hook
- Remove `useVideoExport` hook
- Remove `useFeedback` hook
- Remove all modal states related to:
  - Donation modal
  - Subscription success modal
  - Publish modal
  - Login wall
  - Project limit modal
  - Soft paywall modal
- Remove export limit checks
- Remove subscription tier checks
- Remove feedback system integration
- Remove walkthrough (or simplify)
- Remove soft paywall timer
- Remove project management UI
- Remove publish/share functionality
- Simplify export to only PNG
- Remove STL export options

**Simplified State:**
```typescript
// Keep only:
- activeTab
- isDrawerOpen
- isSidebarVisible
- mobileSheetOpen
- isAdvancedControlsOpen
- isCommandMenuOpen
- config, updateLocation, updateStyle, etc.
- isExporting, exportProgress, exportToPNG
- showHelpers, hasInteracted, isTouch
- exportedImage
```

#### Editor Toolbar
**Location:** `frontend/components/editor/EditorToolbar.tsx`

**Changes:**
- Remove save/load project buttons
- Remove publish button
- Remove subscription status indicator
- Remove export limit indicator
- Remove GIF export button
- Remove Video export button
- Remove STL export button
- Keep only PNG export button

#### Export Button
**Location:** `frontend/components/controls/ExportButton.tsx`

**Changes:**
- Remove export limit checks
- Remove subscription tier checks
- Remove GIF/Video/STL export options
- Simplify to PNG-only export

#### Control Drawer
**Location:** `frontend/components/layout/ControlDrawer.tsx`

**Changes:**
- Remove project management section
- Remove publish section
- Remove subscription section
- Remove feedback section
- Keep only editor controls

### 2. API Routes to Modify

#### Keep and Simplify:
- `frontend/app/api/random-location/route.ts` - Keep as-is
- `frontend/app/api/geocode/route.ts` - Keep as-is
- `frontend/app/api/tiles/[...path]/route.ts` - Keep as-is
- `frontend/app/api/proxy-image/route.ts` - Keep as-is

### 3. Lib Files to Modify

#### Export Resolution
**Location:** `frontend/lib/export/resolution.ts`

**Changes:**
- Remove GIF export options
- Remove Video export options
- Remove STL export options
- Keep only PNG export resolutions

#### Map Export Hook
**Location:** `frontend/hooks/useMapExport.ts`

**Changes:**
- Remove export limit checks
- Remove subscription tier checks
- Simplify to PNG-only export

#### Poster Config Hook
**Location:** `frontend/hooks/usePosterConfig.ts`

**Changes:**
- Review and ensure no auth/database dependencies

### 4. Page Files to Modify

#### Editor Page
**Location:** `frontend/app/editor/page.tsx`

**Changes:**
- Remove `getSiteConfig` call for export limits
- Remove `anonExportLimit` prop
- Simplify to just render PosterEditor

#### Landing Page
**Location:** `frontend/app/page.tsx`

**Changes:**
- Review and remove any auth/subscription references
- Remove any "Sign up" or "Login" CTAs
- Update to reflect unlimited free editor

#### Layout
**Location:** `frontend/app/layout.tsx`

**Changes:**
- Remove auth providers
- Remove analytics providers
- Simplify to basic layout

---

## Dependency Cleanup

### npm Packages to Remove

```bash
npm uninstall @stripe/react-stripe-js @stripe/stripe-js stripe
npm uninstall @supabase/ssr @supabase/supabase-js
npm uninstall resend
npm uninstall @google-analytics/data
npm uninstall recharts
npm uninstall @react-email/components
```

### Review These Packages (May Keep or Remove)
- `@hello-pangea/dnd` - Used for drag-drop, check if still needed
- `react-masonry-css` - Used for gallery, likely remove
- `framer-motion` - Used for animations, check if still needed
- `recharts` - Used for admin analytics, remove
- `date-fns` - Used for dates, check if still needed

---

## Import Cleanup Strategy

After deleting files, there will be broken imports throughout the codebase. The cleanup strategy is:

1. **Phase 1: Delete Files** - Remove all identified files and directories
2. **Phase 2: Fix Imports** - Run a search for broken imports and fix them
3. **Phase 3: Remove Unused Code** - Remove code that becomes unused after import cleanup
4. **Phase 4: Update Types** - Remove unused type definitions
5. **Phase 5: Test Build** - Run `npm run build` to identify remaining issues

### Search Patterns for Broken Imports

```bash
# Search for imports from deleted directories
grep -r "from '@/components/admin/" frontend/
grep -r "from '@/components/auth/" frontend/
grep -r "from '@/components/ecommerce/" frontend/
grep -r "from '@/components/profile/" frontend/
grep -r "from '@/components/gallery/" frontend/
grep -r "from '@/components/store/" frontend/
grep -r "from '@/lib/supabase/" frontend/
grep -r "from '@/lib/stripe/" frontend/
grep -r "from '@/lib/printful/" frontend/
grep -r "from '@/lib/actions/usage" frontend/
grep -r "from '@/lib/actions/events" frontend/
grep -r "from '@/lib/actions/subscription" frontend/
grep -r "from '@/lib/actions/maps" frontend/
grep -r "from '@/hooks/useSavedProjects" frontend/
grep -r "from '@/hooks/useProjectManager" frontend/
grep -r "from '@/hooks/useUserSubscription" frontend/
grep -r "from '@/hooks/useUsageLimits" frontend/
grep -r "from '@/hooks/useGifExport" frontend/
grep -r "from '@/hooks/useVideoExport" frontend/
```

---

## Testing Strategy

### 1. Build Test
```bash
cd frontend
npm run build
```

### 2. Lint Test
```bash
npm run lint
```

### 3. Type Check
```bash
npx tsc --noEmit
```

### 4. Manual Testing Checklist
- [ ] Landing page loads without errors
- [ ] Editor page loads without errors
- [ ] Map renders correctly
- [ ] Can pan and zoom the map
- [ ] Can change location
- [ ] Can change style
- [ ] Can change palette
- [ ] Can change typography
- [ ] Can change format (aspect ratio, border)
- [ ] Can adjust layers (buildings, terrain, etc.)
- [ ] Can adjust rendering settings
- [ ] Export to PNG works
- [ ] Export produces high-resolution image
- [ ] No auth prompts appear
- [ ] No paywall prompts appear
- [ ] No subscription prompts appear
- [ ] No project save prompts appear

---

## Rollback Strategy

If issues arise during migration:

1. **Git Branch** - Work on a dedicated branch (e.g., `feature/stripped-down`)
2. **Commit Frequently** - Commit after each major deletion phase
3. **Tag Milestones** - Tag commits after each phase for easy rollback
4. **Keep Backup** - Ensure main branch is protected

### Rollback Commands
```bash
# Rollback to specific phase
git checkout phase-1-complete

# Or reset to main
git checkout main
git branch -D feature/stripped-down
```

---

## Migration Phases

### Phase 1: Delete Non-Core App Routes
- Delete authentication routes
- Delete main app routes (gallery, profile, user)
- Delete store routes
- Delete admin routes
- Delete blog routes
- Delete developer routes
- Delete location routes
- Delete renderer route

### Phase 2: Delete Non-Core API Routes
- Delete admin API routes
- Delete ecommerce API routes
- Delete webhook API routes
- Delete cron API routes
- Delete non-PNG export API routes
- Delete feedback API routes
- Delete feature flags API routes
- Delete publish API routes
- Delete most V1 API routes
- Delete vistas API routes

### Phase 3: Delete Non-Core Components
- Delete admin components
- Delete analytics components
- Delete auth components
- Delete blog components
- Delete changelog components
- Delete comments components
- Delete ecommerce components
- Delete feed components
- Delete feedback components
- Delete gallery components
- Delete notifications components
- Delete profile components
- Delete SEO components
- Delete store components
- Delete third-party components
- Delete voting components

### Phase 4: Delete Non-Core Hooks
- Delete useAdmin
- Delete useAnonExportUsage
- Delete useInfiniteFeed
- Delete useProjectManager
- Delete useSavedProjects
- Delete useUsageLimits
- Delete useUserSubscription
- Delete useVistas
- Delete useGifExport
- Delete useVideoExport

### Phase 5: Delete Non-Core Library Files
- Delete Supabase directory
- Delete Stripe directory
- Delete Printful directory
- Delete analytics files
- Delete events files
- Delete feature flags files
- Delete admin auth files
- Delete email directory
- Delete storage files
- Delete non-core actions
- Delete non-PNG export files
- Review and clean services, data, middleware

### Phase 6: Delete Test Files
- Delete non-essential test files
- Delete non-essential mock files

### Phase 7: Modify Core Editor Components
- Modify PosterEditor.tsx
- Modify EditorToolbar.tsx
- Modify ExportButton.tsx
- Modify ControlDrawer.tsx
- Remove other editor components that depend on deleted features

### Phase 8: Modify API Routes
- Review and simplify kept API routes
- Remove any auth/database dependencies

### Phase 9: Modify Lib Files
- Modify export resolution
- Modify map export hook
- Review poster config hook

### Phase 10: Modify Page Files
- Modify editor page
- Modify landing page
- Modify layout

### Phase 11: Clean Up Dependencies
- Remove npm packages
- Update package.json
- Remove environment variables

### Phase 12: Fix Broken Imports
- Search for broken imports
- Fix or remove them
- Remove unused code
- Update types

### Phase 13: Test and Validate
- Run build test
- Run lint test
- Run type check
- Manual testing

---

## Success Criteria

The migration is successful when:

1. ✅ Application builds without errors
2. ✅ No TypeScript errors
3. ✅ No linting errors
4. ✅ Landing page loads and functions correctly
5. ✅ Editor page loads and functions correctly
6. ✅ Map rendering works correctly
7. ✅ All editor controls work correctly
8. ✅ PNG export works correctly
9. ✅ No authentication prompts
10. ✅ No paywall prompts
11. ✅ No subscription prompts
12. ✅ No database dependencies
13. ✅ No Supabase dependencies
14. ✅ No Stripe dependencies
15. ✅ No Printful dependencies
16. ✅ No analytics/event tracking
17. ✅ No feature flags

---

## Estimated File Count

Based on the file structure:

- **App Routes to Delete:** ~30 files
- **API Routes to Delete:** ~50 files
- **Components to Delete:** ~100 files
- **Hooks to Delete:** ~10 files
- **Library Files to Delete:** ~50 files
- **Test Files to Delete:** ~30 files
- **Files to Modify:** ~20 files

**Total:** ~290 files to delete or modify

---

## Next Steps

1. Review this migration plan
2. Approve or request changes
3. Switch to Code mode for implementation
4. Execute migration phases sequentially
5. Test and validate after each phase
6. Deploy stripped-down version

---

## Appendix: File Tree Reference

### Keep These Directories/Files

```
frontend/
├── app/
│   ├── editor/page.tsx
│   ├── page.tsx (landing)
│   ├── layout.tsx
│   ├── globals.css
│   ├── favicon.ico
│   ├── icon.svg
│   ├── robots.ts
│   └── sitemap.ts
├── app/api/
│   ├── random-location/route.ts
│   ├── geocode/route.ts
│   ├── tiles/[...path]/route.ts
│   └── proxy-image/route.ts
├── components/
│   ├── editor/ (keep core editor components)
│   ├── map/ (keep map components)
│   ├── controls/ (keep control components)
│   ├── ui/ (keep UI components)
│   └── layout/ (keep layout components)
├── hooks/
│   ├── usePosterConfig.ts
│   ├── useMapExport.ts
│   ├── useMapAnimation.ts
│   ├── useEditorKeyboardShortcuts.ts
│   ├── useErrorHandler.ts
│   └── useUserLocation.ts
├── lib/
│   ├── export/ (keep PNG export only)
│   ├── styles/ (keep all)
│   ├── map/ (keep all)
│   ├── terrain/ (keep all)
│   ├── typography/ (keep all)
│   ├── geocoding/ (keep all)
│   ├── rendering/ (keep all)
│   ├── constants.ts
│   ├── utils.ts
│   └── logger.ts
└── package.json (update)
```

### Delete These Directories/Files

```
frontend/
├── app/(auth)/
├── app/(main)/gallery/
├── app/(main)/map/
├── app/(main)/profile/
├── app/(main)/user/
├── app/admin/
├── app/api/admin/
├── app/api/checkout/
├── app/api/cron/
├── app/api/export/stl/
├── app/api/feedback/
├── app/api/feature-flags/
├── app/api/printful/
├── app/api/publish/
├── app/api/v1/
├── app/api/vistas/
├── app/api/webhooks/
├── app/auth/
├── app/blog/
├── app/developer/
├── app/location/
├── app/order/
├── app/renderer/
├── app/store/
├── app/store-home/
├── app/track-order/
├── components/admin/
├── components/analytics/
├── components/auth/
├── components/blog/
├── components/changelog/
├── components/comments/
├── components/ecommerce/
├── components/feed/
├── components/feedback/
├── components/gallery/
├── components/notifications/
├── components/profile/
├── components/seo/
├── components/store/
├── components/third-party/
├── components/voting/
├── lib/supabase/
├── lib/stripe/
├── lib/printful/
├── lib/email/
├── lib/actions/analytics.ts
├── lib/actions/changelog.ts
├── lib/actions/comments.ts
├── lib/actions/ecommerce.ts
├── lib/actions/events.ts
├── lib/actions/featured-maps.ts
├── lib/actions/feed.ts
├── lib/actions/maps.ts
├── lib/actions/notifications.ts
├── lib/actions/printful.ts
├── lib/actions/referrer.ts
├── lib/actions/stats.ts
├── lib/actions/storage.ts
├── lib/actions/subscription.ts
├── lib/actions/tickets.ts
├── lib/actions/usage.ts
├── lib/actions/user.ts
├── lib/actions/votes.ts
├── lib/export/stl-generation.ts
└── hooks/useAdmin.ts, useAnonExportUsage.ts, useGifExport.ts, useInfiniteFeed.ts, useProjectManager.ts, useSavedProjects.ts, useUsageLimits.ts, useUserSubscription.ts, useVistas.ts, useVideoExport.ts
```
