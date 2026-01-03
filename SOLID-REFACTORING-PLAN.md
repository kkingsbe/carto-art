# SOLID Refactoring Plan for CartoArt

## Executive Summary

- **Total files analyzed**: ~224 TypeScript/TSX files
- **High-complexity files identified**: 15
- **Test coverage**: Minimal (1 test file found)
- **Estimated refactoring effort**: 15-25 hours across 4 phases
- **Primary concerns**: Large monolithic files with mixed responsibilities, high coupling to `PosterConfig` type, missing test coverage for critical refactoring targets

## Priority Matrix

| File | LOC | Fan-In | Fan-Out | Violations | Test Coverage | Risk | Priority |
|------|-----|--------|---------|------------|---------------|------|----------|
| `lib/styles/applyPalette.ts` | 778 | 4 | 8 | S, O, D | None | High | **P1** |
| `lib/actions/maps.ts` | 523 | 8+ | 5 | S, D | None | High | **P1** |
| `lib/export/drawing.ts` | 426 | 3 | 1 | S | None | Medium | **P2** |
| `app/api/v1/posters/generate/route.ts` | 359 | 1 | 10+ | S, D | Partial | High | **P1** |
| `components/controls/AccountPanel.tsx` | 346 | 1 | 8 | S | None | Medium | **P2** |
| `hooks/usePosterConfig.ts` | 316 | 2 | 6 | S, I | None | High | **P1** |
| `components/map/MapPreview.tsx` | 292 | 3 | 4 | S | None | Medium | **P2** |
| `components/layout/PosterEditor.tsx` | 287 | 1 | 12 | S, D | None | Medium | **P2** |
| `components/controls/LocationSearch.tsx` | 253 | 1 | 3 | - | None | Low | **P3** |
| `components/layout/ControlDrawer.tsx` | 239 | 1 | 10 | I | None | Low | **P3** |
| `hooks/useSavedProjects.ts` | 226 | 2 | 6 | S | None | Medium | **P2** |
| `hooks/useProjectManager.ts` | 206 | 1 | 5 | S | None | Medium | **P2** |
| `lib/export/text-overlay.ts` | 192 | 2 | 4 | S | None | Low | **P3** |
| `mcp-server/index.ts` | 195 | 1 | 2 | S, D | None | Medium | **P2** |
| `lib/styles/styleBuilder.ts` | 196 | 7 | 10 | - | None | Low | **P3** |

---

## Dependency Graph

### P1 Files - Critical Path

#### `lib/styles/applyPalette.ts` (778 LOC)

**Depended on by (fan-in):**
- `components/layout/PosterEditor.tsx`
- `components/map/MapDetailView.tsx`
- `app/renderer/page.tsx`
- (indirect) All components using styled map output

**Depends on (fan-out):**
- `@/types/poster` (PosterConfig, ColorPalette, PosterStyle)
- `@/lib/utils/color`
- `@/lib/styles/tileUrl`
- `@/lib/logger`

**Circular dependencies:** None

**Refactor risk:** **High** — This is the core style application engine. Changes here affect all map rendering.

---

#### `lib/actions/maps.ts` (523 LOC)

**Depended on by (fan-in):**
- `hooks/useSavedProjects.ts`
- `hooks/useProjectManager.ts`
- `components/controls/AccountPanel.tsx`
- `components/profile/UserMaps.tsx`
- `app/(main)/map/[id]/page.tsx`
- `app/(main)/profile/page.tsx`
- Multiple other components

**Depends on (fan-out):**
- `@/lib/supabase/server`
- `@/lib/supabase/maps`
- `@/types/poster`
- `@/lib/middleware/rateLimit`
- Zod validation

**Circular dependencies:** None

**Refactor risk:** **High** — Server actions are called from many components. All CRUD operations for maps route through here.

---

#### `app/api/v1/posters/generate/route.ts` (359 LOC)

**Depended on by (fan-in):**
- External API clients
- MCP server
- SDK

**Depends on (fan-out):**
- `@/lib/auth/api-middleware`
- `@/lib/rendering/browser`
- `@/lib/supabase/server`
- `@/lib/styles`
- Puppeteer/Playwright browser automation
- Zod schemas

**Circular dependencies:** None

**Refactor risk:** **High** — This is the public API endpoint. Changes require API versioning consideration.

---

#### `hooks/usePosterConfig.ts` (316 LOC)

**Depended on by (fan-in):**
- `components/layout/PosterEditor.tsx`

**Depends on (fan-out):**
- `@/lib/config/url-state`
- `@/lib/config/defaults`
- `@/lib/utils/configComparison`
- `@/lib/constants`
- `hooks/useUserLocation`
- React hooks, Next.js navigation

**Circular dependencies:** None

**Refactor risk:** **High** — Central state management hook. All editor state flows through this.

---

## Detailed Refactoring Recommendations

### P1: `lib/styles/applyPalette.ts` — Priority P1

**Current State:**
- Single 778-line file handling all palette application logic
- Contains 11 functions with mixed responsibilities
- Handles layer visibility, paint properties, contour density, road styling, and layout updates

**Identified Responsibilities:**
1. Palette color application to style layers
2. Layer visibility toggle management
3. Contour density calculations
4. Road layer styling
5. Source normalization (spaceports, contours)
6. Layer reordering for water

**Violations:**

- **[S] Single Responsibility:** File handles 6+ distinct concerns
- **[O] Open/Closed:** Adding new layer types requires modifying `updateLayerPaint` switch cases
- **[D] Dependency Inversion:** Hardcoded layer ID matching patterns throughout

**Test Coverage Status:**
- Existing tests: **No**
- Coverage assessment: **None**
- **Pre-refactor testing required:** Yes — snapshot tests for paint outputs, integration tests for visibility toggles

**Proposed Changes:**

1. **Extract `PaletteApplicator` class/module**
   - Move: `applyPaletteToStyle`, core orchestration
   - Rationale: Central coordinator with injected handlers

2. **Extract `VisibilityManager`**
   - Move: `applyVisibilityToggles`, layer visibility logic
   - Rationale: Single responsibility for visibility state

3. **Extract `PaintHandlerRegistry`**
   - Move: Layer-specific paint handlers
   - Create strategy pattern for different layer types (roads, water, buildings, etc.)
   - Rationale: OCP compliance — new layer types = new handlers, no core modification

4. **Extract `ContourDensityCalculator`**
   - Move: `applyContourDensity`
   - Rationale: Complex zoom-based calculations warrant isolation

5. **Extract `RoadStyler`**
   - Move: `updateRoadLayer`
   - Rationale: Road-specific styling logic is self-contained

**Target Directory Structure:**
```
lib/styles/
├── palette/
│   ├── index.ts              # Re-exports
│   ├── PaletteApplicator.ts  # Main orchestrator
│   ├── VisibilityManager.ts  # Layer visibility
│   └── types.ts              # Shared interfaces
├── paint-handlers/
│   ├── index.ts              # Handler registry
│   ├── types.ts              # Handler interface
│   ├── RoadHandler.ts
│   ├── WaterHandler.ts
│   ├── BuildingHandler.ts
│   ├── ContourHandler.ts
│   └── DefaultHandler.ts
└── applyPalette.ts           # Thin facade (backward compat)
```

**Before/After Sketch:**
```typescript
// Before (applyPalette.ts)
export function applyPaletteToStyle(style, palette, layers, layerToggles) {
  // 60+ lines of inline logic
  for (const layer of style.layers) {
    updateLayerPaint(layer, palette, ...); // 300+ line switch
  }
}

// After (palette/PaletteApplicator.ts)
export class PaletteApplicator {
  constructor(
    private visibilityManager: VisibilityManager,
    private paintHandlers: PaintHandlerRegistry
  ) {}
  
  apply(style: MapStyle, config: PaletteConfig): MapStyle {
    const processed = this.visibilityManager.applyToggles(style, config.layers);
    return this.paintHandlers.applyAll(processed, config.palette);
  }
}
```

**Migration Steps:**
1. Write characterization tests for current behavior using style snapshots
2. Extract `VisibilityManager` with tests
3. Create `PaintHandler` interface and registry
4. Migrate layer handlers one-by-one (roads → water → buildings → etc.)
5. Create `PaletteApplicator` façade
6. Update `applyPalette.ts` to delegate to new classes
7. Verify all tests pass

---

### P1: `lib/actions/maps.ts` — Priority P1

**Current State:**
- 523-line server actions file
- Contains 10 exported functions for map CRUD operations
- Mixes authentication, validation, database operations, and error handling

**Identified Responsibilities:**
1. Authentication/authorization checks
2. Input validation
3. Database operations (Supabase queries)
4. Rate limiting
5. Response serialization
6. Error handling

**Violations:**

- **[S] Single Responsibility:** Each function handles auth + validation + DB + error handling
- **[D] Dependency Inversion:** Direct Supabase client calls embedded in business logic

**Test Coverage Status:**
- Existing tests: **No**
- Coverage assessment: **None**
- **Pre-refactor testing required:** Yes — mock Supabase, test auth flows, validation edge cases

**Proposed Changes:**

1. **Extract `MapRepository`**
   - Move: All Supabase query logic
   - Rationale: Isolate data access, enable testing with mocks

2. **Extract `MapValidator`**
   - Move: Zod schema definitions, sanitization logic
   - Rationale: Validation as separate concern, reusable across endpoints

3. **Create `MapService`**
   - Orchestrate: auth → validate → repository → serialize
   - Rationale: Clear separation of concerns, testable business logic

4. **Introduce `Result<T>` pattern**
   - Replace: Thrown errors with Result objects
   - Rationale: Explicit error handling, easier testing

**Target Directory Structure:**
```
lib/actions/
├── maps/
│   ├── index.ts              # Re-exports server actions
│   ├── MapService.ts         # Business logic orchestration
│   ├── MapRepository.ts      # Data access layer
│   ├── MapValidator.ts       # Validation schemas
│   └── types.ts              # DTOs, result types
├── maps.ts                   # Thin facade (backward compat)
```

**Migration Steps:**
1. Write integration tests for existing server actions
2. Extract `MapRepository` with Supabase logic
3. Extract `MapValidator` with Zod schemas
4. Create `MapService` that composes them
5. Update `maps.ts` to delegate to `MapService`
6. Verify all tests pass

---

### P1: `app/api/v1/posters/generate/route.ts` — Priority P1

**Current State:**
- 359-line API route handler
- Single `POST` function doing everything
- Mixes authentication, validation, browser automation, file storage, response formatting

**Identified Responsibilities:**
1. Request authentication
2. Request validation
3. Style resolution
4. Browser automation (Puppeteer rendering)
5. Screenshot capture
6. File upload to storage
7. Response formatting

**Violations:**

- **[S] Single Responsibility:** One function handles entire request lifecycle
- **[D] Dependency Inversion:** Direct browser and storage dependencies

**Test Coverage Status:**
- Existing tests: **Partial** (`route.test.ts` exists)
- Coverage assessment: **Partial**
- **Pre-refactor testing required:** Expand existing tests

**Proposed Changes:**

1. **Extract `PosterGenerationService`**
   - Move: All business logic
   - Rationale: Route handler should only handle HTTP concerns

2. **Extract `BrowserRenderer` interface**
   - Move: Puppeteer/Playwright logic
   - Rationale: Enable testing with mocks, swap implementations

3. **Extract `StorageUploader` interface**
   - Move: Supabase storage logic
   - Rationale: Testable, swappable storage backends

4. **Create request/response DTOs**
   - Rationale: Clear API contract, validation at boundary

**Target Directory Structure:**
```
lib/services/
├── poster-generation/
│   ├── index.ts
│   ├── PosterGenerationService.ts
│   ├── BrowserRenderer.ts
│   ├── StorageUploader.ts
│   └── types.ts

app/api/v1/posters/generate/
├── route.ts                  # Thin handler
├── route.test.ts             # Existing + expanded
└── schemas.ts                # Request/response schemas
```

**Migration Steps:**
1. Expand existing test coverage
2. Extract `BrowserRenderer` with interface
3. Extract `StorageUploader` with interface
4. Create `PosterGenerationService`
5. Simplify route handler to orchestration only
6. Verify all tests pass

---

### P1: `hooks/usePosterConfig.ts` — Priority P1

**Current State:**
- 316-line React hook
- Manages poster configuration state
- Handles URL sync, undo/redo, auto-location, reducer logic

**Identified Responsibilities:**
1. State management (reducer)
2. URL serialization/deserialization
3. Undo/redo history
4. Auto-location detection
5. Action dispatchers

**Violations:**

- **[S] Single Responsibility:** Hook handles 5+ distinct concerns
- **[I] Interface Segregation:** Returns 15+ items, most consumers use subset

**Test Coverage Status:**
- Existing tests: **No**
- Coverage assessment: **None**
- **Pre-refactor testing required:** Yes — test reducer, URL sync, undo/redo

**Proposed Changes:**

1. **Extract `posterReducer` to separate file**
   - Move: Reducer function, action types
   - Rationale: Testable pure function

2. **Extract `useUrlSync` hook**
   - Move: URL encode/decode, searchParams sync
   - Rationale: Reusable, testable

3. **Extract `useConfigHistory` hook**
   - Move: Undo/redo logic
   - Rationale: Generic history management

4. **Compose in `usePosterConfig`**
   - Rationale: Main hook becomes orchestration layer

**Target Directory Structure:**
```
hooks/
├── poster-config/
│   ├── index.ts              # Re-export usePosterConfig
│   ├── posterReducer.ts      # Pure reducer + types
│   ├── useUrlSync.ts         # URL synchronization
│   ├── useConfigHistory.ts   # Undo/redo
│   └── usePosterConfig.ts    # Composed hook
```

**Migration Steps:**
1. Write tests for reducer (pure function, easy to test)
2. Extract reducer to separate file
3. Extract `useUrlSync` with tests
4. Extract `useConfigHistory` with tests
5. Update main hook to compose extracted hooks
6. Verify app behavior unchanged

---

### P2: `components/controls/AccountPanel.tsx` — Priority P2

**Current State:**
- 346-line component
- Handles user auth state, map publishing, share functionality, navigation
- Contains multiple inline handlers and modal management

**Violations:**

- **[S] Single Responsibility:** Component handles 4+ distinct UI concerns

**Proposed Changes:**

1. **Extract `UserProfileSection` component**
2. **Extract `MapActionsSection` component** (publish/unpublish/share)
3. **Extract `NavigationLinks` component**
4. **Use composition in main component**

---

### P2: `hooks/useSavedProjects.ts` & `useProjectManager.ts`

**Current State:**
- Two related hooks with overlapping responsibilities
- Both manage project state, storage, and sync

**Proposed Changes:**

1. **Clarify separation of concerns**
   - `useSavedProjects`: Pure data layer (CRUD operations)
   - `useProjectManager`: Orchestration layer (project lifecycle)

2. **Extract shared utilities**
   - `ProjectSyncManager` class for localStorage/Supabase sync

---

### P2: `mcp-server/index.ts` — Priority P2

**Current State:**
- 195-line single file MCP server
- Mixes server setup, tool definitions, and request handling

**Violations:**

- **[S] Single Responsibility:** Server configuration + business logic in one file
- **[D] Dependency Inversion:** HTTP calls embedded in handler

**Proposed Changes:**

1. **Extract tool definitions**
   - Move: Schema definitions, tool metadata
   
2. **Extract `PosterGeneratorTool` class**
   - Move: Geocoding + API call logic
   
3. **Create `HttpClient` wrapper**
   - Rationale: Testable, mockable

**Target Directory Structure:**
```
mcp-server/
├── src/
│   ├── index.ts              # Server setup only
│   ├── tools/
│   │   ├── index.ts          # Tool registry
│   │   ├── generate-poster.ts
│   │   └── types.ts
│   └── clients/
│       └── http.ts
```

---

## Proposed Target Architecture

```
frontend/
├── app/
│   └── api/v1/
│       └── posters/generate/
│           ├── route.ts           # Thin HTTP handler
│           └── schemas.ts         # Request/response validation
├── components/
│   ├── controls/
│   │   ├── account/              # AccountPanel split
│   │   │   ├── UserProfile.tsx
│   │   │   ├── MapActions.tsx
│   │   │   └── NavigationLinks.tsx
│   │   └── AccountPanel.tsx      # Composition component
│   └── layout/
│       └── PosterEditor.tsx      # Slimmed, delegates to hooks
├── hooks/
│   └── poster-config/
│       ├── index.ts
│       ├── posterReducer.ts
│       ├── useUrlSync.ts
│       ├── useConfigHistory.ts
│       └── usePosterConfig.ts
├── lib/
│   ├── actions/maps/
│   │   ├── MapService.ts
│   │   ├── MapRepository.ts
│   │   └── MapValidator.ts
│   ├── services/
│   │   └── poster-generation/
│   │       ├── PosterGenerationService.ts
│   │       ├── BrowserRenderer.ts
│   │       └── StorageUploader.ts
│   └── styles/
│       ├── palette/
│       │   ├── PaletteApplicator.ts
│       │   └── VisibilityManager.ts
│       └── paint-handlers/
│           ├── RoadHandler.ts
│           ├── WaterHandler.ts
│           └── ...
└── types/
    └── poster.ts                  # Unchanged (stable interface)

mcp-server/
└── src/
    ├── index.ts
    ├── tools/
    │   └── generate-poster.ts
    └── clients/
        └── http.ts

sdk/
└── src/                           # Already well-structured
    ├── client.ts
    ├── resources/
    └── types.ts
```

---

## Implementation Phases

### Phase 1: Foundation & Testing (3-5 hours)
- [ ] Set up test infrastructure (Jest already configured)
- [ ] Write characterization tests for `applyPaletteToStyle`
- [ ] Write tests for `posterReducer`
- [ ] Expand `route.test.ts` coverage

### Phase 2: State Management Refactors (4-6 hours)
- [ ] Extract `posterReducer.ts`
- [ ] Extract `useUrlSync.ts`
- [ ] Extract `useConfigHistory.ts`
- [ ] Refactor `usePosterConfig.ts` to compose hooks

### Phase 3: Style System Refactors (5-8 hours)
- [ ] Create `PaintHandler` interface
- [ ] Extract individual paint handlers
- [ ] Create `PaletteApplicator` façade
- [ ] Extract `VisibilityManager`

### Phase 4: Service Layer (4-6 hours)
- [ ] Extract `MapRepository` and `MapService`
- [ ] Refactor API route to use `PosterGenerationService`
- [ ] Refactor MCP server to use extracted tools

---

## Testing Strategy

### Pre-Refactor Requirements

| Test Description | File | Blocks Phase |
|------------------|------|--------------|
| Style snapshot tests for `applyPaletteToStyle` | `applyPalette.test.ts` | Phase 3 |
| Reducer unit tests | `posterReducer.test.ts` | Phase 2 |
| URL sync integration tests | `useUrlSync.test.ts` | Phase 2 |
| Map save/load integration tests | `maps.test.ts` | Phase 4 |

### Test Additions During Refactor
- Unit tests for all extracted modules
- Integration tests for composed hooks
- Snapshot tests for paint handler outputs
- API contract tests for route handlers

### Regression Prevention
- Run full test suite after each phase
- Visual smoke test in browser after each phase
- Check URL state persistence works
- Verify undo/redo functionality
- Test export pipeline end-to-end

---

## Risk Assessment

### Breaking Change Risks
- `applyPaletteToStyle` signature unchanged — low risk
- Server actions maintain same signatures — low risk
- API route unchanged from client perspective — low risk

### High Fan-In Files
- `@/types/poster` — **Do not modify** during refactoring
- `@/lib/styles` — Maintain backward-compatible exports

### Performance Considerations
- Paint handler registry lookup should be O(1) with Map
- No runtime performance impact expected

### Team Knowledge Requirements
- Familiarity with React hook composition
- Understanding of strategy pattern for handlers
- TypeScript interface segregation

### Rollback Plan
- Each phase can be reverted independently
- Old exports maintained as facades
- Feature flags not required (backward compatible)

---

## Notes on Lower Priority Items

### P3: `LocationSearch.tsx` (253 LOC)
- **Why lower priority:** Well-structured, single-purpose component
- **Violations found:** Minor — could extract search cache logic
- **When to address:** Opportunistically during UX improvements

### P3: `ControlDrawer.tsx` (239 LOC)
- **Why lower priority:** UI composition component, coupling is expected
- **Violations found:** Takes many props (ISP concern)
- **When to address:** When adding new control tabs

### P3: `text-overlay.ts` (192 LOC)
- **Why lower priority:** Single rendering function, complex but focused
- **Violations found:** Minor SRP (positioning + drawing)
- **When to address:** After Phase 3 palette refactors

### P3: `styleBuilder.ts` (196 LOC)
- **Why lower priority:** Factory function, deliberately orchestrating
- **Violations found:** None critical
- **When to address:** When adding new styles
