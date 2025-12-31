# Map Poster Generator - Project Context

## Overview

We're building a web application that generates beautifully stylized map posters from real geographic data. Users select a location, choose an artistic style, customize colors and typography, then export high-resolution images suitable for large-format printing.

Think of it as a cartographic art tool - turning real OpenStreetMap/terrain data into gallery-worthy prints.

## Gallery

| ![Chesapeake Bay](examples/chesapeke-poster.png) | ![Denver](examples/denver-poster.png) |
|:---:|:---:|
| **Chesapeake Bay** | **Denver** |
| ![DMV](examples/dmv-poster.png) | ![Salt Lake City](examples/salt-lake-city-poster.png) |
| **DMV Area** | **Salt Lake City** |
| ![Hawaii](examples/hawaii-poster.png) | ![Reggio Calabria](examples/reggio-calabria-poster.png) |
| **Hawaii** | **Reggio Calabria** |
| ![Washington DC Artistic](examples/washington-artistic-poster.png) | ![Washington DC Artistic 2](examples/washington-artistic-poster-2.png) |
| **Washington DC (Artistic)** | **Washington DC (Artistic 2)** |

---

## Core User Flow

1. **Search/Select Location** - User enters a place name or coordinates, map centers on that location
2. **Adjust Bounds** - User can pan/zoom to frame exactly what they want on the poster
3. **Choose Style** - Select from predefined artistic styles (see Style Library below)
4. **Customize** - Tweak colors, toggle layers, adjust typography
5. **Preview** - See the poster as it will appear with text overlay
6. **Export** - Download high-DPI image (PNG/PDF) ready for printing

---

## Tech Stack

### Frontend
- **Next.js 14+** with App Router
- **TypeScript**
- **Tailwind CSS** for UI styling
- **MapLibre GL JS** for map rendering (open-source, no API key required for basic usage)
- **React Map GL** (Maplibre fork) for React integration

### Map Data Sources
- **OpenStreetMap** via vector tiles (OpenFreeMap, MapTiler free tier, or self-hosted)
- **Terrain/Elevation**: Mapbox Terrain RGB tiles, or open terrain tile sources
- Consider **Protomaps** for serverless PMTiles hosting

### Export Strategy
- For high-DPI export, we'll render the map at a higher resolution than screen display
- MapLibre's `preserveDrawingBuffer: true` enables canvas export
- Composite the map canvas with text overlays using HTML Canvas API or a library like `html-to-image`
- Target export sizes: up to 24x36 inches at 300 DPI (7200x10800 pixels)

---

## Style Library

Each style is essentially a MapLibre style JSON definition plus metadata about recommended color palettes and typography.

### 1. Minimal Line Art
- Streets only, no fills
- Monochromatic or duotone
- Clean, modern aesthetic
- **Good for**: Cities with interesting street patterns
- **Typography**: Sans-serif, bold, modern (e.g., Inter, Helvetica Neue)

### 2. Topographic/Contour
- Elevation contour lines as primary visual element
- Optional street overlay
- **Good for**: Mountainous regions, coastal areas, anywhere with terrain
- **Typography**: Clean and technical, or vintage naturalist style

### 3. Vintage/Antique Cartography
- Parchment/cream backgrounds
- Warm sepia and ink tones
- Decorative, hand-drawn feel
- **Good for**: Historic cities, sentimental pieces
- **Typography**: Serif, ornate, possibly with flourishes (e.g., Playfair Display, IM Fell)

### 4. Blueprint/Technical
- White or cyan lines on deep blue background
- Grid overlays, coordinate markers
- Precise, architectural feel
- **Good for**: Urban areas, architectural landmarks
- **Typography**: Monospace or drafting-style (e.g., IBM Plex Mono, Courier)

### 5. Watercolor/Painted
- Soft edges, color bleeds
- Parks and water as color washes
- Organic, artistic interpretation
- **Good for**: Gift pieces, areas with parks/water features
- **Typography**: Hand-lettered or script style

### 6. Dark Mode / Noir
- Dark backgrounds (black, navy, charcoal)
- Luminous/glowing streets
- Dramatic, cinematic
- **Good for**: Urban areas, modern aesthetic
- **Typography**: High contrast, metallics, modern sans-serif

### 7. Isometric / 3D
- Buildings rendered with height
- Model/diorama appearance
- **Good for**: Dense urban cores with skylines
- **Typography**: Floating or on separate plane
- **Note**: More complex, may require building height data from OSM

### 8. Abstract/Artistic
- Map data as raw material for art
- Neighborhoods as color blocks, stylized shapes
- Less literal, more expressive
- **Good for**: Artistic interpretation, less about navigation
- **Typography**: Integrated into composition

---

## Customization Options

### Per-Style Color Palettes
Each style should have 3-5 preset color palettes, plus custom color picker for:
- Background color
- Primary line/feature color
- Secondary/accent color
- Water color
- Green space color
- Text color

### Typography Controls
- Location name (large, prominent)
- Optional subtitle (coordinates, country, custom text)
- Font family selection (curated list per style)
- Font size/weight adjustments
- Text position (top, bottom, centered)

### Layer Toggles
- Streets (major/minor)
- Buildings
- Water bodies
- Parks/green space
- Terrain/contours
- Labels (usually off for art prints)

### Poster Format
- Aspect ratio presets: 2:3, 3:4, 4:5, 1:1, custom
- Orientation: Portrait/Landscape
- Border/margin options

---

## Export Requirements

### Resolution Targets
- **Preview**: Screen resolution, fast rendering
- **Print Export**: 
  - Small (12x18"): 3600x5400px at 300 DPI
  - Medium (18x24"): 5400x7200px at 300 DPI  
  - Large (24x36"): 7200x10800px at 300 DPI
  - Custom dimensions with DPI selector

### File Formats
- **PNG**: Default, transparent background option
- **PDF**: Vector where possible, better for some print shops
- **SVG**: If feasible for simpler styles (may be complex)

### Export Process
1. User clicks Export
2. Show export options modal (size, format, DPI)
3. Show loading state with progress if possible
4. Render map at target resolution (may need to tile/stitch for very large)
5. Composite text overlays
6. Trigger download

---

## Data Architecture

### Location State
```typescript
interface PosterLocation {
  name: string;
  subtitle?: string;
  center: [number, number]; // [lng, lat]
  bounds: [[number, number], [number, number]]; // SW, NE corners
  zoom: number;
}
```

### Style Configuration
```typescript
interface PosterStyle {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  mapStyle: MapLibreStyle; // Full MapLibre style spec
  defaultPalette: ColorPalette;
  palettes: ColorPalette[];
  recommendedFonts: string[];
  layerToggles: LayerToggle[];
}

interface ColorPalette {
  id: string;
  name: string;
  background: string;
  primary: string;
  secondary: string;
  water: string;
  greenSpace: string;
  text: string;
}
```

### Poster Configuration (Full State)
```typescript
interface PosterConfig {
  location: PosterLocation;
  style: PosterStyle;
  palette: ColorPalette;
  typography: {
    titleFont: string;
    titleSize: number;
    titleWeight: number;
    subtitleFont: string;
    subtitleSize: number;
    position: 'top' | 'bottom' | 'center';
  };
  format: {
    aspectRatio: string;
    orientation: 'portrait' | 'landscape';
    margin: number;
  };
  layers: {
    streets: boolean;
    buildings: boolean;
    water: boolean;
    parks: boolean;
    terrain: boolean;
    labels: boolean;
  };
}
```

---

## UI Layout Concept

### Desktop (Primary Target)
```
+------------------------------------------+
|  Logo    [Location Search]        [Export]|
+----------+-------------------------------+
|          |                               |
|  Style   |                               |
|  Panel   |      Map Preview              |
|          |      (Live updating)          |
| -------- |                               |
|  Colors  |                               |
| -------- |      [Location Name]          |
|  Text    |      [Subtitle/Coords]        |
| -------- |                               |
|  Layers  |                               |
|          |                               |
+----------+-------------------------------+
```

### Mobile
- Simplified flow, bottom sheet for controls
- May limit export resolution options

---

## Implementation Phases

### Phase 1: Core MVP
- Location search with geocoding (Nominatim or similar)
- Map display with MapLibre
- 2-3 initial styles (Minimal, Dark Mode, Blueprint)
- Basic color customization
- Text overlay with location name
- PNG export at fixed resolution

### Phase 2: Style Expansion
- Full style library
- Multiple palettes per style
- Typography customization
- Layer toggles
- Format/aspect ratio options

### Phase 3: High-Res Export
- Multi-resolution export options
- Progress indicator for large exports
- PDF export
- Possibly tiled rendering for very large outputs

### Phase 4: Polish & Features
- Save/load poster configurations
- Share links
- Gallery of examples
- Print partner integration (optional)

---

## Technical Considerations

### MapLibre Style Customization
- Base styles will need to be created/modified for each aesthetic
- Consider using style expressions for dynamic color swapping
- May need to self-host or adapt existing open styles

### Performance
- High-res export is CPU/memory intensive
- Consider Web Workers for export processing
- May need to warn users about export time for large sizes
- Debounce style updates during customization

### Tile Sources
- Need reliable, free-tier-friendly tile sources
- OpenFreeMap: Free, no API key, based on OpenMapTiles schema
- MapTiler: Free tier with API key, good style support
- Stadia Maps: Free tier available
- Protomaps: PMTiles format, can self-host

### Fonts
- Google Fonts for web display
- Need to embed fonts in export (may need canvas font loading strategy)

---

## Open Questions

1. **Terrain data**: Best source for contour/elevation data that's free and global?
2. **Building heights**: OSM has some, but coverage varies - how to handle missing data?
3. **Export approach**: Canvas-based vs. server-side rendering for very large exports?
4. **State management**: URL-based state for shareability? Local storage for persistence?

---

## Reference & Inspiration

- Mapbox Studio style editor (for style authoring patterns)
- Grafomap, Mapiful (commercial map poster products)
- Stamen maps (Toner, Watercolor - artistic map styles)
- OS OpenData stylesheets (cartographic design)

---

## Environment Variables

Optional configuration for Nominatim geocoding API (in `frontend/.env.local`):

```bash
# User-Agent header for Nominatim API requests
# Format: "app-name (contact-url-or-email)"
# Example: NOMINATIM_USER_AGENT=carto-art (https://yourdomain.com)
NOMINATIM_USER_AGENT=

# From email header for Nominatim API requests (optional but recommended)
# Nominatim prefers contact information for API usage
# Example: NOMINATIM_FROM_EMAIL=you@yourdomain.com
NOMINATIM_FROM_EMAIL=
```

These are optional - defaults will work for development. For production, it's recommended to set these to comply with Nominatim's usage policy.

## Getting Started

1. Set up Next.js project with TypeScript and Tailwind
2. Integrate MapLibre GL JS with React
3. Implement location search with Nominatim API
4. Create first style definition (recommend starting with Minimal Line Art)
5. Build basic UI shell with map preview and controls panel
6. Implement text overlay system
7. Add PNG export functionality
8. Iterate from there

---

Let me know if you need clarification on any section or want to dive deeper into a specific area.
