# SOLID Refactoring Plan for CartoArt

## Executive Summary
- **Total files analyzed**: 117 TypeScript/TSX source files in frontend
- **High-complexity files identified**: 15
- **Estimated refactoring effort**: 40-60 hours across all phases
- **Test coverage status**: Minimal (2 test files found: `applyPalette.test.ts`, `route.test.ts`)

> [!CAUTION]
> Test coverage is critically low. Many refactoring tasks are **HIGH RISK** without additional test scaffolding. Pre-refactor tests should be written for P1 items before changes begin.

---

## Priority Matrix

| File | LOC | Fan-In | Fan-Out | Violations | Test Coverage | Risk | Priority |
|------|-----|--------|---------|------------|---------------|------|----------|
| [applyPalette.ts](file:///c:/Users/Kyle/Documents/code/carto-art/frontend/lib/styles/applyPalette.ts) | 780 | 4 | 5 | S, O, I | Partial | High | **P1** |
| [route.ts](file:///c:/Users/Kyle/Documents/code/carto-art/frontend/app/api/v1/posters/generate/route.ts) | 453 | 0 | 10 | S, D | Partial | High | **P1** |
| [maps.ts](file:///c:/Users/Kyle/Documents/code/carto-art/frontend/lib/actions/maps.ts) | 529 | 8 | 5 | S, O | None | Medium | **P1** |
| [drawing.ts](file:///c:/Users/Kyle/Documents/code/carto-art/frontend/lib/export/drawing.ts) | 472 | 2 | 0 | S, I | None | Medium | **P2** |
| [exportCanvas.ts](file:///c:/Users/Kyle/Documents/code/carto-art/frontend/lib/export/exportCanvas.ts) | 313 | 3 | 3 | S | None | Medium | **P2** |
| [usePosterConfig.ts](file:///c:/Users/Kyle/Documents/code/carto-art/frontend/hooks/usePosterConfig.ts) | 316 | 1 | 6 | S, O | None | Medium | **P2** |
| [AccountPanel.tsx](file:///c:/Users/Kyle/Documents/code/carto-art/frontend/components/controls/AccountPanel.tsx) | 346 | 1 | 5 | S | None | Low | **P2** |
| [PosterEditor.tsx](file:///c:/Users/Kyle/Documents/code/carto-art/frontend/components/layout/PosterEditor.tsx) | 305 | 1 | 12 | S | None | Medium | **P2** |
| [text-overlay.ts](file:///c:/Users/Kyle/Documents/code/carto-art/frontend/lib/export/text-overlay.ts) | 192 | 1 | 3 | S | None | Low | **P3** |
| [useSavedProjects.ts](file:///c:/Users/Kyle/Documents/code/carto-art/frontend/hooks/useSavedProjects.ts) | 226 | 1 | 5 | S, O | None | Low | **P3** |
| [LocationSearch.tsx](file:///c:/Users/Kyle/Documents/code/carto-art/frontend/components/controls/LocationSearch.tsx) | 259 | 1 | 3 | S | None | Low | **P3** |
| [SaveButton.tsx](file:///c:/Users/Kyle/Documents/code/carto-art/frontend/components/controls/SaveButton.tsx) | 217 | 1 | 2 | S | None | Low | **P3** |
| [SaveCopyButton.tsx](file:///c:/Users/Kyle/Documents/code/carto-art/frontend/components/controls/SaveCopyButton.tsx) | 211 | 1 | 2 | S | None | Low | **P3** |
| [styleBuilder.ts](file:///c:/Users/Kyle/Documents/code/carto-art/frontend/lib/styles/styleBuilder.ts) | 196 | 3 | 9 | - | None | Low | **P3** |
| [renderer/page.tsx](file:///c:/Users/Kyle/Documents/code/carto-art/frontend/app/renderer/page.tsx) | 262 | 0 | 5 | S, D | None | Medium | **P3** |

---

## Dependency Graph

### P1 Files

#### [applyPalette.ts](file:///c:/Users/Kyle/Documents/code/carto-art/frontend/lib/styles/applyPalette.ts)

**Depended on by (fan-in: 4):**
- `components/layout/PosterEditor.tsx`
- `components/map/MapDetailView.tsx`
- `app/renderer/page.tsx`
- `lib/styles/applyPalette.test.ts`

**Depends on (fan-out: 5):**
- `@/types/poster` (PosterConfig, PosterStyle, ColorPalette)
- `@/lib/utils/color` (isColorDark, hexToRgb, etc.)
- `@/lib/styles/tileUrl`
- `@/lib/logger`
- `./palette/VisibilityManager`

**Circular dependencies:** None

**Refactor risk:** **High** — Core styling logic; changes affect all map rendering

---

#### [route.ts](file:///c:/Users/Kyle/Documents/code/carto-art/frontend/app/api/v1/posters/generate/route.ts)

**Depended on by (fan-in: 0):**
- None (API endpoint entry point)

**Depends on (fan-out: 10):**
- `@/lib/auth/api-middleware`
- `@/lib/rendering/browser`
- `@/lib/supabase/server`
- `@/lib/logger`
- `@/lib/styles`
- `@/lib/events`
- `zod`, `crypto`, `next/server`

**Circular dependencies:** None

**Refactor risk:** **High** — Critical API endpoint for poster generation; 360 LOC in single function

---

#### [maps.ts](file:///c:/Users/Kyle/Documents/code/carto-art/frontend/lib/actions/maps.ts)

**Depended on by (fan-in: 8):**
- `hooks/useSavedProjects.ts`
- `hooks/useProjectManager.ts`
- `components/profile/ProfileMapsGrid.tsx`
- `components/profile/MyMapsList.tsx`
- `components/profile/FeaturedMapsEditor.tsx`
- `components/map/MapDetailView.tsx`
- `components/controls/AccountPanel.tsx`
- Multiple page components

**Depends on (fan-out: 5):**
- `@/lib/supabase/server`
- `@/lib/supabase/maps`
- `@/types/poster`, `@/types/database`
- `@/lib/middleware/rateLimit`
- `@/lib/utils/sanitize`, `@/lib/events`

**Circular dependencies:** None

**Refactor risk:** **Medium** — High fan-in but functions are relatively isolated

---

## Detailed Refactoring Recommendations

### [applyPalette.ts](file:///c:/Users/Kyle/Documents/code/carto-art/frontend/lib/styles/applyPalette.ts) - Priority P1

**Current State:**
- 780 lines handling palette application to MapLibre styles
- 11 functions: `scaleExpression`, `applyPaletteToStyle`, `handleContourSource`, `normalizeSpaceportsSource`, `reorderLayersForWater`, `applyVisibilityToggles`, `updateLayerPaint`, `applyContourDensity`, `updateRoadLayer`, `updateLayerLayout`
- `updateLayerPaint` alone is 335 lines with massive if-else chains

**Identified Responsibilities:**
1. Source normalization (contours, spaceports)
2. Layer ordering (water/hillshade)
3. Visibility toggling
4. Color palette application per layer type
5. Contour density filtering
6. Road styling
7. Layout configuration

**Violations:**

- **[S] Single Responsibility Principle:**
  - `updateLayerPaint` handles 15+ layer types (background, hillshade, water, bathymetry, parks, landcover, landuse, contours, population, roads, buildings, boundaries, labels, grid)
  - Each layer type has distinct styling logic that should be isolated

- **[O] Open/Closed Principle:**
  - Adding a new layer type requires modifying `updateLayerPaint`
  - No strategy pattern or registry for layer paint handlers

- **[I] Interface Segregation Principle:**
  - Functions accept entire `PosterConfig['layers']` when only a few properties are needed

**Proposed Changes:**

1. **Extract layer paint handlers to strategy pattern**
   - Move to: `lib/styles/paint-handlers/*.ts`
   - Create a `PaintHandler` interface with `matches(layer, id)` and `apply(layer, palette, config)` methods
   - Handlers: `BackgroundHandler`, `HillshadeHandler`, `WaterHandler`, `RoadsHandler`, `BuildingsHandler`, `LabelsHandler`, `ContourHandler`, `LandcoverHandler`, `LanduseHandler`

2. **Extract `applyContourDensity` to separate module**
   - Move to: `lib/styles/contour-filter.ts`
   - Single responsibility: contour filter expression generation

3. **Extract source normalization**
   - Move to: `lib/styles/source-normalizers.ts`
   - Functions: `normalizeContourSource`, `normalizeSpaceportsSource`

4. **Simplify main function to orchestrator**
   - `applyPaletteToStyle` becomes a coordinator that:
     - Normalizes sources
     - Reorders layers
     - Applies visibility
     - Delegates paint updates to handlers

**Target Directory Structure:**
```
lib/styles/
├── applyPalette.ts              # Orchestrator (reduced to ~100 LOC)
├── applyPalette.test.ts         # Existing tests
├── source-normalizers.ts        # NEW: Source URL normalization
├── layer-reordering.ts          # NEW: Water/hillshade ordering
├── contour-filter.ts            # NEW: Contour density expressions
├── paint-handlers/
│   ├── index.ts                 # Handler registry
│   ├── types.ts                 # PaintHandler interface
│   ├── BackgroundHandler.ts     # ~20 LOC
│   ├── HillshadeHandler.ts      # ~40 LOC
│   ├── WaterHandler.ts          # ~30 LOC
│   ├── RoadsHandler.ts          # ~70 LOC
│   ├── BuildingsHandler.ts      # ~60 LOC
│   ├── LabelsHandler.ts         # ~50 LOC
│   ├── ContourHandler.ts        # ~40 LOC
│   ├── LandcoverHandler.ts      # ~50 LOC
│   ├── BoundariesHandler.ts     # ~20 LOC
│   └── PopulationHandler.ts     # ~20 LOC
└── palette/
    └── VisibilityManager.ts     # Existing
```

**Before/After Sketch:**

```typescript
// BEFORE: updateLayerPaint (335 lines, massive if-else)
function updateLayerPaint(layer, palette, layers, ...) {
  if (id === 'background') { /* 5 lines */ }
  if (id === 'hillshade') { /* 25 lines */ }
  if (id === 'water') { /* 20 lines */ }
  if (id.startsWith('landcover-')) { /* 40 lines */ }
  if (id.startsWith('landuse-')) { /* 35 lines */ }
  if (id.startsWith('road-') || id.startsWith('bridge-')) { /* call updateRoadLayer */ }
  if (id.includes('building')) { /* 55 lines */ }
  // ... continues for 15+ layer types
}

// AFTER: Strategy pattern with handler registry
const paintHandlers: PaintHandler[] = [
  new BackgroundHandler(),
  new HillshadeHandler(),
  new WaterHandler(),
  new RoadsHandler(),
  new LandcoverHandler(),
  new BuildingsHandler(),
  new LabelsHandler(),
  // easily extensible
];

function updateLayerPaint(layer, palette, config) {
  const handler = paintHandlers.find(h => h.matches(layer));
  if (handler) {
    handler.apply(layer, palette, config);
  }
}
```

**Migration Steps:**
1. ☐ Write unit tests for each layer type in `updateLayerPaint` (characterization tests)
2. ☐ Extract `PaintHandler` interface and base infrastructure
3. ☐ Extract `BackgroundHandler`, `HillshadeHandler` (simplest)
4. ☐ Run tests, verify behavior unchanged
5. ☐ Extract remaining handlers one at a time
6. ☐ Convert `updateLayerPaint` to use handler registry
7. ☐ Extract source normalizers and layer reordering
8. ☐ Final cleanup and documentation

**Test Coverage Status:**
- Existing tests: **Yes** — [applyPalette.test.ts](file:///c:/Users/Kyle/Documents/code/carto-art/frontend/lib/styles/applyPalette.test.ts)
- Coverage assessment: **Partial** — Tests exist but may not cover all layer types
- **Pre-refactor testing required:** Yes — Add characterization tests for each layer type before extraction

---

### [route.ts](file:///c:/Users/Kyle/Documents/code/carto-art/frontend/app/api/v1/posters/generate/route.ts) - Priority P1

**Current State:**
- 453 lines in a single `POST` function (360 LOC in the handler)
- Handles: authentication, validation, config transformation, browser rendering, storage upload, usage tracking, response formatting
- Complex Zod schema (80 lines) mixed with handler logic

**Identified Responsibilities:**
1. Request authentication
2. Request validation (Zod schema)
3. Simplified API → PosterConfig transformation
4. Browser-based rendering orchestration
5. Storage upload with retry logic
6. Usage tracking/analytics
7. Response formatting (JSON vs image)

**Violations:**

- **[S] Single Responsibility Principle:**
  - Single 360-line function handling 7 distinct responsibilities
  - Schema definition mixed with handler logic

- **[D] Dependency Inversion Principle:**
  - Direct dependency on `getBrowser()` (concrete Puppeteer impl)
  - Direct Supabase client creation inline
  - No abstraction for storage or rendering

**Proposed Changes:**

1. **Extract Zod schema to separate file**
   - Move to: `lib/api/schemas/poster-generate.ts`
   - Export `SimplifiedPosterSchema` and inferred types

2. **Extract config transformer**
   - Move to: `lib/api/transformers/poster-config.ts`
   - Function: `transformApiRequestToConfig(data, style): PosterConfig`

3. **Extract rendering service**
   - Move to: `lib/rendering/poster-renderer.ts`
   - Class: `PosterRenderer` with `render(config, resolution): Promise<Buffer>`
   - Abstracts browser management, page lifecycle, error handling

4. **Extract storage service**
   - Move to: `lib/storage/poster-storage.ts`
   - Function: `uploadPosterWithRetry(buffer, filename): Promise<string>`

5. **Extract usage tracking**
   - Already has `trackEvent` — consolidate API usage logging there

**Target Directory Structure:**
```
app/api/v1/posters/generate/
└── route.ts                     # Reduced to ~100 LOC orchestrator

lib/api/
├── schemas/
│   └── poster-generate.ts       # NEW: Zod schema + types
└── transformers/
    └── poster-config.ts         # NEW: API → PosterConfig

lib/rendering/
├── browser.ts                   # Existing
└── poster-renderer.ts           # NEW: Rendering orchestration

lib/storage/
└── poster-storage.ts            # NEW: Upload with retry
```

**Before/After Sketch:**

```typescript
// BEFORE: 360-line POST function
export async function POST(req: NextRequest) {
  // 1. Auth (15 lines)
  // 2. Parse body (20 lines)
  // 3. Validate (10 lines)
  // 4. Transform config (70 lines)
  // 5. Launch browser & render (80 lines)
  // 6. Upload with retries (50 lines)
  // 7. Track usage (30 lines)
  // 8. Return response (20 lines)
}

// AFTER: Clean orchestrator
export async function POST(req: NextRequest) {
  const authResult = await authenticateApiRequest(req);
  if (!authResult.success) return authError(authResult);

  const validation = SimplifiedPosterSchema.safeParse(await req.json());
  if (!validation.success) return validationError(validation.error);

  const config = transformApiRequestToConfig(validation.data);
  const buffer = await posterRenderer.render(config, resolution);
  const publicUrl = await uploadPosterWithRetry(buffer, requestId);

  await trackPosterExport(authResult.context, config, duration);

  return formatResponse(req, buffer, publicUrl, requestId);
}
```

**Migration Steps:**
1. ☐ Ensure existing tests pass
2. ☐ Extract Zod schema to separate file
3. ☐ Extract config transformer
4. ☐ Extract `PosterRenderer` class
5. ☐ Extract storage upload logic
6. ☐ Refactor POST to use extracted modules
7. ☐ Add integration tests for each extracted module

**Test Coverage Status:**
- Existing tests: **Yes** — [route.test.ts](file:///c:/Users/Kyle/Documents/code/carto-art/frontend/app/api/v1/posters/generate/route.test.ts)
- Coverage assessment: **Partial** — Integration tests exist
- **Pre-refactor testing required:** Yes — Expand error case coverage before extraction

---

### [maps.ts](file:///c:/Users/Kyle/Documents/code/carto-art/frontend/lib/actions/maps.ts) - Priority P1

**Current State:**
- 529 lines containing 10 server actions for map CRUD operations
- Functions: `saveMap`, `saveMapWithThumbnail`, `updateMap`, `updateMapThumbnail`, `deleteMap`, `publishMap`, `unpublishMap`, `getUserMaps`, `getMapById`
- Each function ~50-70 lines with similar patterns (auth check, rate limit, DB operation, error handling)

**Identified Responsibilities:**
1. Authentication/authorization checks
2. Rate limiting
3. Input validation (Zod)
4. Database operations (Supabase)
5. Error handling and logging

**Violations:**

- **[S] Single Responsibility Principle:**
  - Each function handles auth + rate limit + validation + DB + error handling
  - Repetitive boilerplate across all functions

- **[O] Open/Closed Principle:**
  - Adding a new action requires duplicating the same auth/rate-limit/error pattern

**Proposed Changes:**

1. **Extract common middleware pattern**
   - Create: `lib/actions/middleware/withAuth.ts`
   - Higher-order function: `withAuthAction<T>(action, rateLimit?): ServerAction<T>`

2. **Split by operation type**
   - `lib/actions/maps/create.ts` — saveMap, saveMapWithThumbnail
   - `lib/actions/maps/update.ts` — updateMap, updateMapThumbnail
   - `lib/actions/maps/delete.ts` — deleteMap
   - `lib/actions/maps/publish.ts` — publishMap, unpublishMap
   - `lib/actions/maps/read.ts` — getUserMaps, getMapById
   - `lib/actions/maps/index.ts` — re-exports all

3. **Extract database operations**
   - Create: `lib/db/maps.ts` — pure DB queries without auth/rate-limiting

**Target Directory Structure:**
```
lib/actions/
├── maps.ts                      # Deleted (barrel export from maps/)
├── maps/
│   ├── index.ts                 # Re-exports all
│   ├── create.ts                # saveMap, saveMapWithThumbnail
│   ├── update.ts                # updateMap, updateMapThumbnail
│   ├── delete.ts                # deleteMap
│   ├── publish.ts               # publishMap, unpublishMap
│   └── read.ts                  # getUserMaps, getMapById
└── middleware/
    └── withAuth.ts              # HOF for auth + rate limiting

lib/db/
└── maps.ts                      # Pure Supabase queries
```

**Migration Steps:**
1. ☐ Write integration tests for each action
2. ☐ Extract `withAuthAction` middleware
3. ☐ Migrate one action at a time using middleware
4. ☐ Split into separate files by operation type
5. ☐ Update all imports across codebase
6. ☐ Verify all dependent files still work

**Test Coverage Status:**
- Existing tests: **None**
- Coverage assessment: **None**
- **Pre-refactor testing required:** **Yes** — Write integration tests before refactoring

---

### [drawing.ts](file:///c:/Users/Kyle/Documents/code/carto-art/frontend/lib/export/drawing.ts) - Priority P2

**Current State:**
- 472 lines with 11 functions for Canvas 2D drawing
- Functions: `drawMarker`, `drawHeartMarker`, `drawHomeMarker`, `drawCrosshairMarker`, `drawPinMarker`, `drawDotMarker`, `drawRingMarker`, `drawTextWithHalo`, `applyTexture`, `drawCompassRose`
- `drawTextWithHalo` is 123 lines with complex layout calculations

**Identified Responsibilities:**
1. Marker drawing (6 marker types)
2. Text rendering with halo effects
3. Texture application
4. Compass rose drawing

**Violations:**

- **[S] Single Responsibility Principle:**
  - File handles unrelated concerns (markers, text, textures, compass)
  - `drawMarker` uses switch statement to dispatch to helper functions

- **[I] Interface Segregation Principle:**
  - Consumers importing `drawing.ts` get all functions even if they only need markers

**Proposed Changes:**

1. **Split into focused modules**
   - `lib/export/markers.ts` — All marker drawing functions
   - `lib/export/text-rendering.ts` — `drawTextWithHalo` and helpers
   - `lib/export/textures.ts` — `applyTexture`
   - `lib/export/compass.ts` — `drawCompassRose`
   - `lib/export/drawing.ts` — Barrel export for backward compatibility

**Target Directory Structure:**
```
lib/export/
├── drawing.ts                   # Barrel export (re-exports all)
├── markers.ts                   # NEW: 6 marker functions (~200 LOC)
├── text-rendering.ts            # NEW: drawTextWithHalo (~130 LOC)
├── textures.ts                  # NEW: applyTexture (~35 LOC)
└── compass.ts                   # NEW: drawCompassRose (~75 LOC)
```

**Migration Steps:**
1. ☐ Create new files with extracted functions
2. ☐ Update `drawing.ts` to re-export from new files
3. ☐ Add unit tests for each drawing function
4. ☐ Verify visual output unchanged

**Test Coverage Status:**
- Existing tests: **None**
- Coverage assessment: **None**
- **Pre-refactor testing required:** No (low risk, pure functions, can add snapshot tests post-refactor)

---

### [usePosterConfig.ts](file:///c:/Users/Kyle/Documents/code/carto-art/frontend/hooks/usePosterConfig.ts) - Priority P2

**Current State:**
- 316 lines managing poster configuration state
- Combines: reducer logic, URL sync, undo/redo history, auto-location
- `usePosterConfig` is 230 lines

**Identified Responsibilities:**
1. State management (useReducer)
2. URL parameter synchronization
3. Undo/redo history management
4. Auto-location detection

**Violations:**

- **[S] Single Responsibility Principle:**
  - Single hook handling 4 distinct concerns
  - History management mixed with URL sync mixed with state

- **[O] Open/Closed Principle:**
  - Adding new state fields requires modifying reducer, URL encoder, and history logic

**Proposed Changes:**

1. **Extract history management**
   - Create: `hooks/useUndoRedo.ts`
   - Generic hook: `useUndoRedo<T>(initialState, maxHistory)`

2. **Extract URL synchronization**
   - Create: `hooks/useUrlSync.ts`
   - Hook: `useUrlSync<T>(config, encode, decode)`

3. **Keep main hook as coordinator**
   - `usePosterConfig` composes the extracted hooks

**Target Directory Structure:**
```
hooks/
├── usePosterConfig.ts           # Reduced to ~100 LOC coordinator
├── useUndoRedo.ts               # NEW: Generic undo/redo (~80 LOC)
└── useUrlSync.ts                # NEW: URL parameter sync (~60 LOC)
```

**Migration Steps:**
1. ☐ Extract `useUndoRedo` with tests
2. ☐ Extract `useUrlSync` with tests
3. ☐ Refactor `usePosterConfig` to compose hooks
4. ☐ Verify editor behavior unchanged

**Test Coverage Status:**
- Existing tests: **None**
- **Pre-refactor testing required:** No (can add hook tests during extraction)

---

### [AccountPanel.tsx](file:///c:/Users/Kyle/Documents/code/carto-art/frontend/components/controls/AccountPanel.tsx) - Priority P2

**Current State:**
- 346 lines for account panel component
- Handles: auth state, sign out, sharing, publishing, unpublishing, admin link
- Multiple modal states and event handlers

**Violations:**

- **[S] Single Responsibility Principle:**
  - UI component handling business logic (publish/unpublish actions)
  - Multiple distinct UI sections in one component

**Proposed Changes:**

1. **Extract action handlers to custom hook**
   - Create: `hooks/useAccountActions.ts`
   - Handles: signOut, shareMap, publish, unpublish

2. **Extract sub-components**
   - `components/controls/account/UserMenu.tsx`
   - `components/controls/account/PublishButton.tsx`
   - `components/controls/account/ShareButton.tsx`

**Migration Steps:**
1. ☐ Extract `useAccountActions` hook
2. ☐ Extract sub-components
3. ☐ Simplify `AccountPanel` to compose sub-components

---

## Proposed Target Architecture

After all refactors are complete:

```
frontend/
├── lib/
│   ├── actions/
│   │   ├── maps/
│   │   │   ├── index.ts
│   │   │   ├── create.ts
│   │   │   ├── update.ts
│   │   │   ├── delete.ts
│   │   │   ├── publish.ts
│   │   │   └── read.ts
│   │   └── middleware/
│   │       └── withAuth.ts
│   ├── api/
│   │   ├── schemas/
│   │   │   └── poster-generate.ts
│   │   └── transformers/
│   │       └── poster-config.ts
│   ├── db/
│   │   └── maps.ts
│   ├── export/
│   │   ├── drawing.ts          # Barrel export
│   │   ├── markers.ts
│   │   ├── text-rendering.ts
│   │   ├── textures.ts
│   │   ├── compass.ts
│   │   ├── exportCanvas.ts
│   │   └── text-overlay.ts
│   ├── rendering/
│   │   ├── browser.ts
│   │   └── poster-renderer.ts
│   ├── storage/
│   │   └── poster-storage.ts
│   └── styles/
│       ├── applyPalette.ts     # Orchestrator
│       ├── source-normalizers.ts
│       ├── layer-reordering.ts
│       ├── contour-filter.ts
│       └── paint-handlers/
│           ├── index.ts
│           ├── types.ts
│           ├── BackgroundHandler.ts
│           ├── HillshadeHandler.ts
│           ├── WaterHandler.ts
│           ├── RoadsHandler.ts
│           ├── BuildingsHandler.ts
│           ├── LabelsHandler.ts
│           ├── ContourHandler.ts
│           ├── LandcoverHandler.ts
│           ├── BoundariesHandler.ts
│           └── PopulationHandler.ts
├── hooks/
│   ├── usePosterConfig.ts      # Coordinator
│   ├── useUndoRedo.ts
│   └── useUrlSync.ts
└── components/
    └── controls/
        └── account/
            ├── UserMenu.tsx
            ├── PublishButton.tsx
            └── ShareButton.tsx
```

---

## Implementation Phases

### Phase 1: Foundation & Testing (Days 1-3)
- Write characterization tests for P1 files
- Set up test infrastructure for server actions
- Extract `PaintHandler` interface and first handlers

### Phase 2: Core Extractions (Days 4-8)
- Complete `applyPalette.ts` handler extraction
- Extract API route components (schema, transformer, renderer)
- Split `maps.ts` into operation-specific modules

### Phase 3: Secondary Refactors (Days 9-12)
- Split `drawing.ts` into focused modules
- Extract `usePosterConfig` composition hooks
- Refactor `AccountPanel` components

### Phase 4: Polish & Documentation (Days 13-15)
- Add JSDoc documentation to extracted modules
- Update any stale imports across codebase
- Visual/manual regression testing

---

## Testing Strategy

### Pre-Refactor Requirements

| Test | File | Blocks Phase |
|------|------|--------------|
| Layer paint characterization tests | applyPalette.ts | Phase 1 |
| API route integration tests expansion | route.ts | Phase 2 |
| Server action integration tests | maps.ts | Phase 2 |

### Test Additions During Refactor
- Unit tests for each paint handler
- Unit tests for `PosterRenderer` class
- Unit tests for storage upload with retry
- Unit tests for `useUndoRedo` hook
- Snapshot tests for marker/drawing functions

### Regression Prevention
- Run `npm run lint` and `npm run type-check` after each extraction
- Visual comparison of map exports before/after
- Manual smoke test of editor functionality after each phase

---

## Risk Assessment

- **Breaking change risks:**
  - Changing import paths for `maps.ts` actions affects 8+ files
  - Middleware pattern changes error handling behavior
  
- **High fan-in files:**
  - `maps.ts` — 8 dependents, requires coordinated import updates
  - `applyPalette.ts` — 4 dependents, core rendering path

- **Performance considerations:**
  - Handler registry lookup adds minimal overhead (~0.1ms per layer)
  - Ensure paint handler matching is O(1) via Map-based registry

- **Team knowledge requirements:**
  - Strategy pattern familiarity for paint handlers
  - React hooks composition patterns

- **Rollback plan:**
  - Keep original files with `.backup` suffix until phase completion
  - Feature flag for new vs old code paths if needed

---

## Notes on Lower Priority Items (P3)

### [SaveButton.tsx](file:///c:/Users/Kyle/Documents/code/carto-art/frontend/components/controls/SaveButton.tsx) / [SaveCopyButton.tsx](file:///c:/Users/Kyle/Documents/code/carto-art/frontend/components/controls/SaveCopyButton.tsx)
- **Why lower priority:** Isolated components, moderate complexity
- **Violations found:** SRP (UI + state + modal logic combined)
- **When to address:** After P1/P2 complete; consider extracting shared save dialog

### [LocationSearch.tsx](file:///c:/Users/Kyle/Documents/code/carto-art/frontend/components/controls/LocationSearch.tsx)
- **Why lower priority:** Self-contained search component
- **Violations found:** SRP (search logic + debouncing + caching + UI)
- **When to address:** Opportunistically; extract `useLocationSearch` hook

### [renderer/page.tsx](file:///c:/Users/Kyle/Documents/code/carto-art/frontend/app/renderer/page.tsx)
- **Why lower priority:** Internal page for API rendering
- **Violations found:** SRP + DIP (mixes config handling + rendering + window API exposure)
- **When to address:** During Phase 2 when extracting `PosterRenderer`

### [styleBuilder.ts](file:///c:/Users/Kyle/Documents/code/carto-art/frontend/lib/styles/styleBuilder.ts)
- **Why lower priority:** Already well-structured with clear factory pattern
- **Violations found:** None significant
- **When to address:** No immediate action needed
