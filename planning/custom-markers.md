# Feature Planning: Custom Markers

## Feature Overview
- **Title**: Custom Markers
- **Goal**: Allow users to add, manage, and customize specific points of interest on their map poster.
- **Success Criteria**:
    - Users can right-click the map (or use sidebar button) to add a marker at that location.
    - Users can see a list of markers in the sidebar.
    - Users can edit marker label, color, icon, and position.
    - Markers are rendered on the map preview AND in the final high-res export.
    - Feature is restricted to "Carto Plus" users (enforced in UI and Export).

## Technical Context
- **Affected Systems**:
    - Frontend: `types/poster.ts`, `components/map/`, `components/controls/panels/`, `hooks/usePosterConfig.ts`.
    - Export Engine: `lib/export/exportCanvas.ts`, `lib/export/drawing.ts`.
- **Key Dependencies**:
    - `react-map-gl` / `maplibre-gl` for map interaction and rendering.
    - `lucide-react` for icons.
- **Constraints**:
    - Must persist within the `PosterConfig` JSON.
    - Must be compatible with existing `MarkerIcon` component.
    - Export rendering must be manually calculated (projecting lat/lng to canvas coordinates).

## Task Breakdown

## Task 1: Data Model Updates

**Objective**: Update the TypeScript interfaces to support custom markers in the poster configuration.

**Scope**:
- IN: Update `types/poster.ts` to include `CustomMarker` interface.
- IN: Add `markers` array to `PosterConfig`.
- IN: Define marker properties: `id` (uuid), `lat`, `lng`, `label` (optional text), `type` (icon), `color`, `size`, `labelStyle`.
- OUT: Migration of existing "center marker" (keep it separate for now to ensure backward compatibility, or treat it as special). *Decision: Keep existing center marker as "Focal Point" and new markers as "Annotations" to avoid breaking existing saves.*

**Deliverables**:
- [ ] `frontend/types/poster.ts`

**Acceptance Criteria**:
- [ ] `PosterConfig` includes `markers: CustomMarker[]`.
- [ ] `CustomMarker` supports labels and placement properties.

## Task 2: Map Interaction (Context Menu & Handling)

**Objective**: Create a context menu component and handle map interactions.

**Scope**:
- IN: Create `MapContextMenu.tsx` (using Portal or high Z-index to stand out above overlays).
- IN: Implement `onContextMenu` handler in `MapPreview`.
- **Critical Interaction Details**:
    - **Right-Click vs. Rotate**: To prevent conflict, the context menu should ONLY open if:
        1. The map is NOT rotating/moving.
        2. The interaction was a "click" (mousedown and mouseup in same location) rather than a drag.
    - Use `map.on('contextmenu')` which MapLibre typically fires only on clean right-clicks.
    - If conflict persists, check `map.preview.isMoving()` or a ref tracking drag state.
- OUT: Long-press support for mobile (handled by map touch events).

**Deliverables**:
- [ ] `frontend/components/map/MapContextMenu.tsx`
- [ ] `frontend/components/map/MapPreview.tsx` (Logic update)

**Acceptance Criteria**:
- [ ] Clean right-click opens menu.
- [ ] Right-click drag (rotate) does NOT open menu.
- [ ] Menu closes on map move or click elsewhere.

## Task 3: Map Interaction & Rendering (Preview)

**Objective**: Render custom markers in the live preview.

**Scope**:
- IN: Map over `config.markers` and render `MarkerIcon` using `react-map-gl`'s `<Marker>` component.
- IN: Support optional labels below/beside the marker in `MarkerIcon` (or separate HTML overlay).
- IN: Ensure markers are clickable (to select in sidebar) or draggable (optional nice-to-have).
- **Security**: Only render markers if `isPlusEnabled` (subscription check).

**Deliverables**:
- [ ] `frontend/components/map/MapPreview.tsx`
- [ ] `frontend/components/map/MarkerIcon.tsx` (Update for labels)

**Acceptance Criteria**:
- [ ] Markers render at correct lat/lng.
- [ ] Labels render with text shadow/halo for readability.
- [ ] Security check prevents rendering for non-subscribers.

## Task 4: Sidebar Management UI

**Objective**: specific UI to manage markers.

**Scope**:
- IN: Create `MarkersList` component in `AnnotationPanel`.
- IN: **Mobile/Accessibility**: Add "Add Marker at Center" button in the sidebar (crucial for users who can't right-click).
- IN: List view with Edit (Label, Color, Icon) and Delete controls.
- IN: Limit marker count (e.g., max 20) to prevent performance issues.

**Deliverables**:
- [ ] `frontend/components/controls/markers/MarkersList.tsx`
- [ ] `frontend/components/controls/panels/AnnotationPanel.tsx`

**Acceptance Criteria**:
- [ ] "Add Marker at Center" works.
- [ ] Form allows editing label, color, icon.
- [ ] Plus-tier verification before action.

## Task 5: Export Engine Updates (Critical)

**Objective**: Ensure specific markers appear in the generated high-res PNG/PDF.

**Scope**:
- IN: Update `lib/export/exportCanvas.ts`.
- **Logic**:
    1. Iterate through `config.markers`.
    2. detailed validation: `if (!isPlusUser) return`.
    3. Project marker `lat/lng` to canvas `x/y` using `exportMap.project(lngLat)`.
    4. Call `drawMarker` for each.
    5. Call `drawTextWithHalo` for marker labels (new utility).
- IN: Update `lib/export/drawing.ts` to support label rendering.

**Deliverables**:
- [ ] `lib/export/exportCanvas.ts`
- [ ] `lib/export/drawing.ts`

**Acceptance Criteria**:
- [ ] markers appear in downloaded file.
- [ ] Labels have correct font/scale in high-res export.
- [ ] Features hidden for non-subscribers.

## Execution Order
1. [Task 1: Data Model]
2. [Task 2: Context Menu & Interaction Logic]
3. [Task 3: Map Preview Rendering]
4. [Task 4: Sidebar UI & Accessibility]
5. [Task 5: Export Engine]

## Risk Assessment
- **Export vs Preview Alignment**: Preview uses CSS/DOM (Marker component), Export uses Canvas API. Visuals must be carefully matched (size, color, label offset).
- **Control Conflict**: MapLibre right-click behavior can be tricky.
    - *Mitigation*: Use MapLibre's native 'contextmenu' event which usually handles the 'click-only' distinction, but verify on trackpads/magic mice.
- **Performance**: Too many markers/labels could clutter the canvas export.
    - *Mitigation*: Hard cap on marker count.
