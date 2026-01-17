# Move Debug Pages to Admin Dashboard

## Overview
Move all debug pages from `/debug/*` to `/admin/debug/*` and integrate them into the admin dashboard navigation. This consolidates debugging tools within the admin interface and removes standalone debug routes.

## Current State

### Pages to Move
| Current Path | Description | Type |
|--------------|-------------|------|
| `/debug/mockup/page.tsx` | Mockup Renderer Laboratory (~1090 lines) | Client Component |
| `/debug/product-data/[id]/page.tsx` | View product variants by ID | Server Component |
| `/debug/regen-616/page.tsx` | Regenerate mockups for specific variants | Server Component |

### API Route to Move
| Current Path | Description |
|--------------|-------------|
| `/api/debug/analyze-template/route.ts` | Template analysis for magenta bounds detection |

### Admin Dashboard Structure
- Layout: [`app/admin/layout.tsx`](../app/admin/layout.tsx) - Uses `AdminSidebarLayout` component
- Sidebar: [`components/admin/AdminSidebarLayout.tsx`](../components/admin/AdminSidebarLayout.tsx)
- Navigation items defined in `navItems` array

## Target State

### New Page Routes
| New Path | Description |
|----------|-------------|
| `/admin/debug/mockup/page.tsx` | Mockup Renderer Laboratory |
| `/admin/debug/product-data/[id]/page.tsx` | View product variants by ID |
| `/admin/debug/regen-616/page.tsx` | Regenerate mockups for specific variants |

### New API Route
| New Path | Description |
|----------|-------------|
| `/api/admin/debug/analyze-template/route.ts` | Template analysis for magenta bounds detection |

### Sidebar Navigation
Add three new top-level items to the admin sidebar:
- "Mockup Lab" → `/admin/debug/mockup`
- "Product Data" → `/admin/debug/product-data`
- "Regen Mockups" → `/admin/debug/regen-616`

## Implementation Plan

### Phase 1: Component Refactoring (Mockup Page)

The mockup page is a large monolithic component (~1090 lines). Refactor into smaller, reusable components:

#### New Components to Create
| Component | Purpose | Location |
|-----------|---------|----------|
| `TemplateAnalysisCard` | Template analysis with magenta bounds overlay | `components/admin/debug/TemplateAnalysisCard.tsx` |
| `ConfigurationPanel` | Variant selection, template URL, print area controls | `components/admin/debug/ConfigurationPanel.tsx` |
| `PreviewComparison` | Side-by-side client vs official mockup preview | `components/admin/debug/PreviewComparison.tsx` |
| `ProcessingStagesCard` | Display debug processing stages | `components/admin/debug/ProcessingStagesCard.tsx` |
| `DebugConsole` | Log output console | `components/admin/debug/DebugConsole.tsx` |
| `ApiDebugInspector` | API request/response debugging panel | `components/admin/debug/ApiDebugInspector.tsx` |

#### Component Structure
```
components/admin/debug/
├── TemplateAnalysisCard.tsx
├── ConfigurationPanel.tsx
├── PreviewComparison.tsx
├── ProcessingStagesCard.tsx
├── DebugConsole.tsx
└── ApiDebugInspector.tsx
```

### Phase 2: Move Pages

#### Step 2.1: Move Mockup Page
1. Create `app/admin/debug/mockup/page.tsx`
2. Refactor to use new components from Phase 1
3. Update API endpoint reference from `/api/debug/analyze-template` to `/api/admin/debug/analyze-template`

#### Step 2.2: Move Product Data Page
1. Create `app/admin/debug/product-data/[id]/page.tsx`
2. Copy content from `app/debug/product-data/[id]/page.tsx`
3. No changes needed (simple server component)

#### Step 2.3: Move Regen-616 Page
1. Create `app/admin/debug/regen-616/page.tsx`
2. Copy content from `app/debug/regen-616/page.tsx`
3. No changes needed (simple server component)

### Phase 3: Move API Route

#### Step 3.1: Move Analyze Template API
1. Create `app/api/admin/debug/analyze-template/route.ts`
2. Copy content from `app/api/debug/analyze-template/route.ts`
3. No changes needed (stateless API route)

### Phase 4: Update Admin Sidebar

#### Step 4.1: Add Navigation Items
Update [`components/admin/AdminSidebarLayout.tsx`](../components/admin/AdminSidebarLayout.tsx):

```typescript
// Add to imports
import { FlaskConical, Database, RefreshCw } from 'lucide-react';

// Add to navItems array
{ label: 'Mockup Lab', href: '/admin/debug/mockup', icon: FlaskConical },
{ label: 'Product Data', href: '/admin/debug/product-data', icon: Database },
{ label: 'Regen Mockups', href: '/admin/debug/regen-616', icon: RefreshCw },
```

### Phase 5: Cleanup

#### Step 5.1: Delete Old Routes
Delete the following directories and files:
- `app/debug/mockup/page.tsx`
- `app/debug/product-data/[id]/page.tsx`
- `app/debug/regen-616/page.tsx`
- `app/api/debug/analyze-template/route.ts`

#### Step 5.2: Delete Empty Directories
- `app/debug/mockup/`
- `app/debug/product-data/`
- `app/debug/regen-616/`
- `app/debug/` (if empty)
- `app/api/debug/analyze-template/`
- `app/api/debug/` (if empty)

## Component Interface Specifications

### TemplateAnalysisCard
```typescript
interface TemplateAnalysisCardProps {
    templateUrl: string;
    printArea: { x: number; y: number; width: number; height: number };
    magentaBounds: { x: number; y: number; width: number; height: number } | null;
    templateAnalysis: {
        templateDimensions: { width: number; height: number };
        detectedBounds: { x: number; y: number; width: number; height: number };
        printAreaPixels: { x: number; y: number; width: number; height: number };
    } | null;
}
```

### ConfigurationPanel
```typescript
interface ConfigurationPanelProps {
    variants: any[];
    selectedVariantId: string;
    templateUrl: string;
    designUrl: string;
    printArea: { x: number; y: number; width: number; height: number };
    isGenerating: boolean;
    onVariantChange: (id: string) => void;
    onTemplateUrlChange: (url: string) => void;
    onDesignUrlChange: (url: string) => void;
    onPrintAreaChange: (area: { x: number; y: number; width: number; height: number }) => void;
    onGenerateOfficial: () => void;
    onDebugMockup: () => void;
    onInspectTemplates: () => void;
    onRegenerateTemplate: () => void;
    onAnalyzeTemplate: () => void;
    onUseDetectedBounds: () => void;
    onUpdateDatabase: () => void;
    onClearLogs: () => void;
}
```

### PreviewComparison
```typescript
interface PreviewComparisonProps {
    templateUrl: string;
    designUrl: string;
    printArea: { x: number; y: number; width: number; height: number };
    officialMockupUrl: string;
    onDebug: (message: string) => void;
    onDebugStages: (stages: { name: string; url: string; description?: string }[]) => void;
}
```

### ProcessingStagesCard
```typescript
interface ProcessingStagesCardProps {
    debugStages: { name: string; url: string; description?: string }[];
}
```

### DebugConsole
```typescript
interface DebugConsoleProps {
    logs: string[];
    onClear: () => void;
}
```

### ApiDebugInspector
```typescript
interface ApiDebugInspectorProps {
    selectedVariant: any;
    printArea: { x: number; y: number; width: number; height: number };
    templateAnalysis: any;
    designImageInfo: any;
    uploadRequest: any;
    uploadResponse: any;
    mockupRequest: any;
    mockupResponse: any;
    forceRotation: boolean | null;
    manualVariantId: string;
    onForceRotationChange: (value: boolean | null) => void;
    onManualVariantIdChange: (value: string) => void;
    onResetOverrides: () => void;
    onCopyToClipboard: (text: string, section: string) => void;
    copiedSection: string | null;
}
```

## File Structure After Migration

```
app/
├── admin/
│   ├── debug/
│   │   ├── mockup/
│   │   │   └── page.tsx
│   │   ├── product-data/
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   └── regen-616/
│   │       └── page.tsx
│   └── ...
├── api/
│   └── admin/
│       └── debug/
│           └── analyze-template/
│               └── route.ts
└── ...

components/
└── admin/
    └── debug/
        ├── TemplateAnalysisCard.tsx
        ├── ConfigurationPanel.tsx
        ├── PreviewComparison.tsx
        ├── ProcessingStagesCard.tsx
        ├── DebugConsole.tsx
        └── ApiDebugInspector.tsx
```

## Testing Checklist

- [ ] Mockup Lab page loads at `/admin/debug/mockup`
- [ ] Product Data page loads at `/admin/debug/product-data/123`
- [ ] Regen Mockups page loads at `/admin/debug/regen-616`
- [ ] API endpoint `/api/admin/debug/analyze-template` responds correctly
- [ ] Sidebar navigation items appear and link correctly
- [ ] Active state highlighting works for debug pages
- [ ] Template analysis functionality works in new location
- [ ] Print area configuration works
- [ ] Official mockup generation works
- [ ] Debug console displays logs
- [ ] API debug inspector shows request/response data
- [ ] Old `/debug/*` routes return 404
- [ ] Old `/api/debug/analyze-template` route returns 404

## Notes

1. The mockup page uses `FrameMockupRenderer` from `@/components/ecommerce/FrameMockupRenderer` - this component will remain in its current location
2. The mockup page imports actions from `@/lib/actions/ecommerce` and `@/lib/actions/printful` - these will remain unchanged
3. The admin layout already includes `protectAdminPage()` for authentication, so no additional auth is needed
4. All debug pages will inherit the admin dashboard styling and layout
