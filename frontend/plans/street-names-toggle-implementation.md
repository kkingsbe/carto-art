# Street Names Toggle Feature - Implementation Plan

## Overview

Add a toggleable street names option to the map editor, allowing users to show/hide street name labels on their map posters. This feature will enhance customization options while maintaining the clean aesthetic of the map editor.

## Goals

- ✅ Enable users to toggle street name visibility on/off
- ✅ Maintain visual consistency with existing label system
- ✅ Ensure street names display at appropriate zoom levels
- ✅ Preserve export functionality with street names enabled/disabled
- ✅ Provide intuitive UI control for the toggle

## Technical Architecture

### Current System

The map editor uses:
- **MapLibre GL** for map rendering
- **OpenMapTiles** as the data source (includes `transportation_name` layer with street names)
- **Layer toggle system** in [`lib/styles/layerToggles.ts`](../lib/styles/layerToggles.ts:1)
- **Label layer creation** in [`lib/styles/layers/labels.ts`](../lib/styles/layers/labels.ts:1)
- **Layer visibility management** in [`components/map/MapPreview.tsx`](../components/map/MapPreview.tsx:198-222)

### Data Source

OpenMapTiles `transportation_name` layer contains:
- Street names for roads, highways, paths
- Road labels with name properties
- Available at zoom levels 14+

## Implementation Plan

### Phase 1: Core Layer Implementation

#### 1.1 Create Street Name Label Layer

**File**: [`lib/styles/layers/labels.ts`](../lib/styles/layers/labels.ts:1)

Add a new function `createStreetNameLayer()` that creates a symbol layer for street names:

```typescript
export function createStreetNameLayer(
  palette: ColorPalette,
  options: LabelLayerOptions = {}
): any {
  const {
    style = 'halo',
  } = options;

  // Determine halo settings based on style
  const getHaloSettings = () => {
    switch (style) {
      case 'none':
        return { 'text-halo-width': 0, 'text-halo-blur': 0 };
      case 'strong':
        return { 'text-halo-width': 2, 'text-halo-blur': 0.5 };
      case 'elevated':
        return { 'text-halo-width': 1.5, 'text-halo-blur': 0.2 };
      case 'glass':
        return { 'text-halo-width': 3, 'text-halo-blur': 3 };
      case 'vintage':
        return { 'text-halo-width': 1, 'text-halo-blur': 0.8 };
      case 'standard':
      case 'halo':
      default:
        return { 'text-halo-width': 1.5, 'text-halo-blur': 1 };
    }
  };

  const haloSettings = getHaloSettings();

  // Determine colors based on style
  let textColor = palette.text;
  let haloColor = style !== 'none' ? palette.background : undefined;

  if (style === 'vintage') {
    textColor = '#4a3b2a';
    haloColor = '#f4e4bc';
  } else if (style === 'glass') {
    textColor = '#000000';
    haloColor = 'rgba(255, 255, 255, 0.7)';
  } else if (style === 'elevated') {
    haloColor = '#ffffff';
  }

  return {
    id: 'labels-streets',
    type: 'symbol',
    source: 'openmaptiles',
    'source-layer': 'transportation_name',
    filter: ['has', 'name'], // Only show features with names
    layout: {
      'text-field': ['get', 'name'],
      'text-font': ['Noto Sans Regular'],
      'text-size': ['interpolate', ['linear'], ['zoom'], 14, 10, 18, 14],
      'text-anchor': 'bottom',
      'text-offset': [0, 0.5],
      'text-rotation-alignment': 'map',
      'text-allow-overlap': false,
      'text-padding': 2,
    },
    paint: {
      'text-color': textColor,
      'text-opacity': 0.9,
      ...(haloColor ? { 'text-halo-color': haloColor } : {}),
      ...haloSettings,
    },
  };
}
```

**Key Design Decisions**:
- Smaller text size than city/state labels (10-14px vs 11-20px)
- Bottom anchor to place labels above roads
- Map rotation alignment for readability
- No overlap allowed to prevent clutter
- Zoom-based sizing: 10px at zoom 14, 14px at zoom 18

#### 1.2 Add Layer Toggle Configuration

**File**: [`lib/styles/layerToggles.ts`](../lib/styles/layerToggles.ts:1)

Add street names toggle to the `getBaseLayerToggles()` function:

```typescript
const toggles: LayerToggle[] = [
  // ... existing toggles ...
  {
    id: 'labels-streets',
    name: 'Street Names',
    layerIds: ['labels-streets'],
  },
  // ... rest of toggles ...
];
```

**Placement**: Add after `labels-cities` toggle (around line 166) to group all label toggles together.

#### 1.3 Update Style Builder

**File**: [`lib/styles/styleBuilder.ts`](../lib/styles/styleBuilder.ts:1)

Modify the style builder to include the street name layer in the layer stack:

```typescript
// In the layer composition section, add:
const streetNameLayer = createStreetNameLayer(palette, labelOptions);

// Add to layers array in correct order (after roads, before other labels)
const allLayers = [
  // ... base layers ...
  ...roadLayers,
  streetNameLayer, // Add street names here
  ...cityLabels,
  ...stateLabels,
  ...countryLabels,
  // ... overlay layers ...
];
```

**Layer Order Considerations**:
- Street names should appear **after** road layers (so they're visible)
- **Before** city/state/country labels (to maintain hierarchy)
- **After** POI labels (to avoid conflicts)

### Phase 2: UI Implementation

#### 2.1 Add Toggle Control to Layer Controls

**File**: [`components/controls/LayerControls.tsx`](../components/controls/LayerControls.tsx) (or equivalent)

Add a checkbox/toggle for street names:

```typescript
// In the layer controls section
<LayerToggleItem
  id="labels-streets"
  label="Street Names"
  checked={layers.labelsStreets ?? false}
  onChange={(checked) => updateLayers({ labelsStreets: checked })}
  icon={<MapPin className="w-4 h-4" />}
/>
```

**Default State**: `false` (off by default to maintain clean aesthetic)

#### 2.2 Update TypeScript Types

**File**: [`types/poster.ts`](../types/poster.ts)

Add street names to the layers interface:

```typescript
export interface PosterLayers {
  // ... existing properties ...
  labelsStreets?: boolean;
  // ... rest of properties ...
}
```

### Phase 3: Integration & Testing

#### 3.1 Verify Layer Visibility

**File**: [`components/map/MapPreview.tsx`](../components/map/MapPreview.tsx:198-222)

The existing layer visibility logic should automatically handle the new toggle:

```typescript
// This existing code should work without modification:
layerToggles.forEach(toggle => {
  const isVisible = layers[toggle.id as keyof typeof layers];
  if (typeof isVisible === 'boolean') {
    toggle.layerIds.forEach(layerId => {
      if (map.getLayer(layerId)) {
        map.setLayoutProperty(
          layerId,
          'visibility',
          isVisible ? 'visible' : 'none'
        );
      }
    });
  }
});
```

**Verification**: Test that toggling `labelsStreets` in config updates map visibility.

#### 3.2 Test Export Functionality

Ensure street names are included/excluded in exports based on toggle state:

- Test PNG export with street names enabled
- Test PNG export with street names disabled
- Verify export matches live preview
- Test at different zoom levels

#### 3.3 Performance Testing

- Test with street names enabled at high zoom levels (dense urban areas)
- Verify no performance degradation
- Check for label collision issues
- Test on mobile devices

## File Changes Summary

| File | Change Type | Description |
|------|-------------|-------------|
| `lib/styles/layers/labels.ts` | Add | New `createStreetNameLayer()` function |
| `lib/styles/layerToggles.ts` | Modify | Add street names toggle to `getBaseLayerToggles()` |
| `lib/styles/styleBuilder.ts` | Modify | Include street name layer in layer stack |
| `components/controls/LayerControls.tsx` | Modify | Add UI toggle control |
| `types/poster.ts` | Modify | Add `labelsStreets` to `PosterLayers` interface |

## Testing Strategy

### Unit Tests

1. **Layer Creation**: Verify `createStreetNameLayer()` generates correct layer structure
2. **Toggle Configuration**: Verify street names toggle is included in `getBaseLayerToggles()`
3. **Type Safety**: Verify TypeScript types include `labelsStreets`

### Integration Tests

1. **Toggle Functionality**: Verify toggle shows/hides street names
2. **Zoom Levels**: Verify street names appear at zoom 14+
3. **Styling**: Verify colors and halo match palette
4. **Export**: Verify exports include/exclude street names correctly

### Manual Testing Checklist

- [ ] Street names toggle appears in layer controls
- [ ] Toggle defaults to off
- [ ] Enabling toggle shows street names at zoom 14+
- [ ] Disabling toggle hides street names
- [ ] Street names match label style (halo, colors)
- [ ] Street names don't overlap excessively
- [ ] Export with street names enabled works correctly
- [ ] Export with street names disabled works correctly
- [ ] Performance is acceptable in dense urban areas
- [ ] Mobile display is readable

## Edge Cases & Considerations

### Visual Clutter

**Issue**: Street names can create visual clutter in dense urban areas

**Solutions**:
- Default to off
- Add zoom-based visibility (only show at zoom 15+)
- Implement label collision detection
- Consider opacity reduction at lower zoom levels

### Label Overlap

**Issue**: Street names may overlap with other labels or POIs

**Solutions**:
- Set `text-allow-overlap: false`
- Adjust `text-padding` value
- Consider priority-based rendering

### Performance

**Issue**: Many street names at high zoom levels may impact performance

**Solutions**:
- Limit zoom range (14-18)
- Use `text-allow-overlap: false` to reduce rendering
- Consider label density filtering

### Language Support

**Issue**: Street names may be in different languages

**Solutions**:
- Use `coalesce` for name fallback (similar to existing labels)
- Consider language-specific filtering
- Document language behavior

### Export Consistency

**Issue**: Exported image may differ from live preview

**Solutions**:
- Ensure layer visibility is preserved during export
- Test export at various zoom levels
- Verify export timing (wait for idle state)

## Future Enhancements

### Phase 2 Features (Post-MVP)

1. **Label Filtering**: Filter by road type (highways only, local roads only)
2. **Custom Styling**: Allow users to customize street name font size, color, opacity
3. **Language Selection**: Choose preferred language for street names
4. **Label Density Control**: Adjust maximum number of street names visible
5. **Smart Labeling**: AI-powered label placement to minimize overlap

### Phase 3 Features

1. **Animated Labels**: Fade in/out street names based on zoom
2. **Label Categories**: Separate toggles for different road types
3. **Custom Label Overrides**: Allow users to add custom street labels
4. **Label Export Options**: Export street names as separate layer (for editing)

## Success Criteria

- ✅ Street names toggle is functional and accessible
- ✅ Street names display correctly at appropriate zoom levels
- ✅ Styling matches existing label aesthetics
- ✅ Export functionality works with street names enabled/disabled
- ✅ Performance is acceptable across devices
- ✅ UI is intuitive and discoverable
- ✅ No regressions in existing functionality

## Timeline Estimate

- **Phase 1 (Core Implementation)**: 2-3 hours
- **Phase 2 (UI Implementation)**: 1-2 hours
- **Phase 3 (Integration & Testing)**: 2-3 hours
- **Total**: 5-8 hours

## Dependencies

- None (uses existing infrastructure)
- OpenMapTiles data source (already in use)
- MapLibre GL (already in use)

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Visual clutter in dense areas | Medium | Default to off, add zoom-based visibility |
| Performance degradation | Medium | Limit zoom range, test on various devices |
| Label overlap issues | Low | Use collision detection, adjust padding |
| Export inconsistencies | Low | Thorough testing at various zoom levels |
| TypeScript type errors | Low | Update types before implementation |

## References

- [MapLibre GL Symbol Layers](https://maplibre.org/maplibre-style-spec/layers/#symbol)
- [OpenMapTiles Schema](https://openmaptiles.org/schema/)
- [Existing Label Implementation](../lib/styles/layers/labels.ts:1)
- [Layer Toggle System](../lib/styles/layerToggles.ts:1)
