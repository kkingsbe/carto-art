# Store Home Page Implementation Plan

## Overview
Create a new store home page at `/store-home` that displays a gallery-style showcase of featured products with maps from the featured maps list. Each product card shows a different featured map, and clicking navigates to the product detail page with the map pre-loaded.

## Requirements Summary

| Requirement | Details |
|-------------|---------|
| **Route** | `/store-home` (new page) |
| **Featured Maps** | Each product card displays a different featured map (cycle through list) |
| **Image Source** | Use `image_url` from `featured_maps` table (high-res generated images) |
| **Product Count** | Show 3-6 featured products (subset) |
| **Design Style** | Gallery/hero style with featured maps prominently displayed |
| **Click Behavior** | Navigate to `/store/[productId]?image=<featured_map_url>` |

## Architecture Overview

```mermaid
flowchart TD
    A[User visits /store-home] --> B[Server Component]
    B --> C[getActiveFeaturedMaps]
    B --> D[getMarginAdjustedVariants]
    B --> E[getProducts]
    C --> F[FeaturedMap array]
    D --> G[ProductVariant array]
    E --> H[Product array]
    F --> I[StoreHomePageClient]
    G --> I
    H --> I
    I --> J[FeaturedProductCard components]
    J --> K[User clicks product]
    K --> L[Navigate to /store/[productId]?image=...]
```

## Implementation Tasks

### 1. Create Server Page Component
**File**: `app/store-home/page.tsx`

**Responsibilities**:
- Fetch featured maps using [`getActiveFeaturedMaps()`](lib/actions/featured-maps.ts:38)
- Fetch products using [`getMarginAdjustedVariants()`](lib/actions/ecommerce.ts:517) and [`getProducts()`](lib/actions/ecommerce.ts:421)
- Group variants by products using [`groupVariantsByProduct()`](lib/utils/store.ts:151)
- Select 3-6 featured products (based on `display_order` or first N)
- Pass data to client component

**Data Flow**:
```typescript
const [featuredMaps, allVariants, productsData] = await Promise.all([
    getActiveFeaturedMaps(),
    getMarginAdjustedVariants(),
    getProducts()
]);
const products = groupVariantsByProduct(allVariants, productsData);
const featuredProducts = products.slice(0, 6); // First 6 products
```

### 2. Create Client Component
**File**: `components/store/StoreHomePageClient.tsx`

**Responsibilities**:
- Receive products and featured maps as props
- Cycle featured maps across products (modulo operation)
- Render gallery-style layout
- Handle responsive design

**Featured Map Assignment Logic**:
```typescript
const getFeaturedMapForProduct = (productIndex: number) => {
    return featuredMaps[productIndex % featuredMaps.length];
};
```

### 3. Create Featured Product Card Component
**File**: `components/store/FeaturedProductCard.tsx`

**Design Requirements**:
- Gallery/hero style (larger, more prominent than standard ProductCard)
- Featured map image displayed prominently on product mockup
- Product title, description, and price
- "View Options" CTA button
- Hover effects for interactivity

**Key Props**:
```typescript
interface FeaturedProductCardProps {
    product: ProductGroup;
    featuredMap: FeaturedMap;
}
```

**Link Construction**:
```typescript
const href = `/store/${product.id}?image=${encodeURIComponent(featuredMap.image_url)}`;
```

### 4. Add Metadata and SEO
**File**: `app/store-home/page.tsx`

Add appropriate metadata for the store home page:
- Title: "Store | Carto Art"
- Description: "Browse our collection of custom map prints, posters, and canvas art featuring stunning designs from our featured artists."
- Open Graph and Twitter cards

### 5. Add Navigation Link
**File**: Update navigation component (location TBD)

Add a link to `/store-home` in the main navigation so users can access the store home page.

## Component Structure

```
app/store-home/
└── page.tsx                    # Server component (data fetching, metadata)

components/store/
├── StoreHomePageClient.tsx     # Client component (layout, state)
└── FeaturedProductCard.tsx     # Gallery-style product card with featured map
```

## Data Models Used

### FeaturedMap (from lib/actions/featured-maps.ts)
```typescript
interface FeaturedMap {
    id: string;
    title: string;
    description: string | null;
    image_url: string;          // High-res generated image
    link_url: string;           // /map/[uuid]
    display_order: number;
    is_active: boolean;
    created_at: string;
}
```

### ProductGroup (from lib/utils/store.ts)
```typescript
interface ProductGroup {
    id: number;
    title: string;
    description: string;
    features: string[];
    minPrice: number;
    variants: ProductVariant[];
    thumbnailVariant: ProductVariant;
    startingPrice: number;
}
```

## Design Considerations

### Gallery/Hero Style Layout
- Larger product cards with more prominent imagery
- Featured map should be the focal point of each card
- Clean, modern aesthetic matching the existing design system
- Responsive grid (1 column mobile, 2 tablet, 3 desktop)

### Featured Map Display
- Use [`FrameMockupRenderer`](components/ecommerce/FrameMockupRenderer.tsx) to overlay featured map on product mockup
- Fallback to product's default image if featured map fails to load
- Ensure aspect ratio compatibility between map and product

### Responsive Breakpoints
- Mobile (< 768px): 1 column
- Tablet (768px - 1024px): 2 columns
- Desktop (> 1024px): 3 columns

## Edge Cases to Handle

| Edge Case | Handling Strategy |
|-----------|-------------------|
| No featured maps exist | Show products with default images, display message |
| Fewer featured maps than products | Cycle through available maps (modulo) |
| Featured map image fails to load | Fallback to product's default thumbnail |
| No products exist | Display empty state with CTA to create products |
| Featured map image_url is invalid | Skip that map, use next available |

## Testing Checklist

- [ ] Page loads successfully at `/store-home`
- [ ] Featured maps are fetched and displayed correctly
- [ ] Products are displayed with correct featured maps
- [ ] Clicking a product navigates to `/store/[productId]?image=...`
- [ ] Featured map image is pre-loaded on product detail page
- [ ] Responsive layout works on mobile, tablet, and desktop
- [ ] Empty states display correctly when no data exists
- [ ] Fallback behavior works when images fail to load

## Future Enhancements (Out of Scope)

- Admin configuration for which products appear on store home
- Filtering/sorting options for products
- "Load More" functionality for additional products
- Featured map carousel/hero section above products
- Analytics tracking for store home page interactions
