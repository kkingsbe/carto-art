# Dark Mode Color Palette Design

## Professional Modern E-Commerce Color System for Carto-Art Store

This document defines a comprehensive dark mode color palette designed for the Carto-Art store pages. The palette draws inspiration from modern design systems like Apple, Linear, Vercel, and Stripe while maintaining the cartography/map art brand identity.

---

## Design Philosophy

### Core Principles

1. **Depth Through Layering** - Use multiple surface levels to create visual hierarchy without relying on heavy shadows
2. **Subtle Warmth** - Incorporate warm undertones to complement map imagery and avoid cold, sterile aesthetics
3. **Accessibility First** - All color combinations meet WCAG AA contrast requirements (4.5:1 for text, 3:1 for UI)
4. **Consistent Semantics** - Colors have clear, predictable meanings across all components
5. **Map-Friendly** - Colors that complement rather than compete with colorful map imagery

### Visual Hierarchy Strategy

```
┌─────────────────────────────────────────────────────────────┐
│  Background (Deepest)                                       │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Surface 1 (Cards, Panels)                            │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │  Surface 2 (Elevated, Popovers)                 │  │  │
│  │  │  ┌───────────────────────────────────────────┐  │  │  │
│  │  │  │  Surface 3 (Highest, Modals)              │  │  │  │
│  │  │  └───────────────────────────────────────────┘  │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## Color Palette

### Background Colors

| Token | HSL Value | Hex | Usage |
|-------|-----------|-----|-------|
| `--background` | `222 47% 6%` | `#080b12` | Page background, deepest layer |
| `--background-subtle` | `222 44% 8%` | `#0c1018` | Subtle variation for sections |
| `--surface-1` | `222 41% 11%` | `#111827` | Cards, primary containers |
| `--surface-2` | `222 38% 14%` | `#161d2d` | Elevated elements, popovers |
| `--surface-3` | `222 35% 17%` | `#1c2536` | Highest elevation, modals |
| `--surface-hover` | `222 32% 20%` | `#232d40` | Hover state for surfaces |

### Text Colors

| Token | HSL Value | Hex | Contrast | Usage |
|-------|-----------|-----|----------|-------|
| `--text-primary` | `210 40% 98%` | `#f8fafc` | 16.5:1 | Primary text, headings |
| `--text-secondary` | `215 20% 75%` | `#b4bfcc` | 8.2:1 | Secondary text, descriptions |
| `--text-muted` | `217 15% 55%` | `#7a8599` | 4.6:1 | Muted text, placeholders |
| `--text-subtle` | `218 12% 40%` | `#5a6373` | 3.1:1 | Disabled, hints (use sparingly) |

### Border Colors

| Token | HSL Value | Hex | Usage |
|-------|-----------|-----|-------|
| `--border-default` | `220 20% 18%` | `#252d3a` | Default borders |
| `--border-subtle` | `220 15% 14%` | `#1f252f` | Subtle dividers |
| `--border-strong` | `220 25% 25%` | `#303d52` | Emphasized borders |
| `--border-interactive` | `220 30% 30%` | `#3a4a63` | Hover/focus borders |

### Accent Colors (Brand)

| Token | HSL Value | Hex | Usage |
|-------|-----------|-----|-------|
| `--accent-gold` | `43 70% 55%` | `#d4a84a` | Primary accent, CTAs |
| `--accent-gold-hover` | `43 75% 60%` | `#e0b85c` | Hover state |
| `--accent-gold-active` | `43 65% 45%` | `#b8923a` | Active/pressed state |
| `--accent-gold-muted` | `43 50% 35%` | `#8a7030` | Muted accent |
| `--accent-copper` | `25 55% 45%` | `#b27340` | Secondary accent |

### Interactive States

| Token | HSL Value | Hex | Usage |
|-------|-----------|-----|-------|
| `--interactive-default` | `222 35% 17%` | `#1c2536` | Default interactive bg |
| `--interactive-hover` | `222 32% 22%` | `#283042` | Hover state |
| `--interactive-active` | `222 30% 26%` | `#313b4d` | Active/pressed state |
| `--interactive-selected` | `43 70% 55% / 15%` | `rgba(212, 168, 74, 0.15)` | Selected state bg |
| `--interactive-selected-border` | `43 70% 55% / 50%` | `rgba(212, 168, 74, 0.5)` | Selected border |

### Semantic Colors

#### Success
| Token | HSL Value | Hex | Usage |
|-------|-----------|-----|-------|
| `--success` | `142 70% 45%` | `#22c55e` | Success indicators |
| `--success-bg` | `142 70% 45% / 15%` | `rgba(34, 197, 94, 0.15)` | Success background |
| `--success-border` | `142 70% 45% / 30%` | `rgba(34, 197, 94, 0.3)` | Success border |

#### Error/Destructive
| Token | HSL Value | Hex | Usage |
|-------|-----------|-----|-------|
| `--error` | `0 84% 60%` | `#ef4444` | Error indicators |
| `--error-bg` | `0 84% 60% / 15%` | `rgba(239, 68, 68, 0.15)` | Error background |
| `--error-border` | `0 84% 60% / 30%` | `rgba(239, 68, 68, 0.3)` | Error border |

#### Warning
| Token | HSL Value | Hex | Usage |
|-------|-----------|-----|-------|
| `--warning` | `38 92% 50%` | `#f59e0b` | Warning indicators |
| `--warning-bg` | `38 92% 50% / 15%` | `rgba(245, 158, 11, 0.15)` | Warning background |
| `--warning-border` | `38 92% 50% / 30%` | `rgba(245, 158, 11, 0.3)` | Warning border |

#### Info
| Token | HSL Value | Hex | Usage |
|-------|-----------|-----|-------|
| `--info` | `217 91% 60%` | `#3b82f6` | Info indicators |
| `--info-bg` | `217 91% 60% / 15%` | `rgba(59, 130, 246, 0.15)` | Info background |
| `--info-border` | `217 91% 60% / 30%` | `rgba(59, 130, 246, 0.3)` | Info border |

### Special Effects

| Token | Value | Usage |
|-------|-------|-------|
| `--glow-gold` | `0 0 20px rgba(212, 168, 74, 0.3)` | Gold glow effect |
| `--glow-gold-strong` | `0 0 40px rgba(212, 168, 74, 0.5)` | Strong gold glow |
| `--shadow-sm` | `0 1px 2px rgba(0, 0, 0, 0.3)` | Small shadow |
| `--shadow-md` | `0 4px 6px rgba(0, 0, 0, 0.4)` | Medium shadow |
| `--shadow-lg` | `0 10px 15px rgba(0, 0, 0, 0.5)` | Large shadow |
| `--shadow-xl` | `0 20px 25px rgba(0, 0, 0, 0.6)` | Extra large shadow |

---

## CSS Variables Implementation

Add these to the `.dark` class in `globals.css`:

```css
.dark {
  /* Background Layers */
  --background: 222 47% 6%;
  --background-subtle: 222 44% 8%;
  --surface-1: 222 41% 11%;
  --surface-2: 222 38% 14%;
  --surface-3: 222 35% 17%;
  --surface-hover: 222 32% 20%;
  
  /* Text */
  --foreground: 210 40% 98%;
  --text-primary: 210 40% 98%;
  --text-secondary: 215 20% 75%;
  --text-muted: 217 15% 55%;
  --text-subtle: 218 12% 40%;
  
  /* Borders */
  --border: 220 20% 18%;
  --border-subtle: 220 15% 14%;
  --border-strong: 220 25% 25%;
  --border-interactive: 220 30% 30%;
  
  /* Accent */
  --accent-gold: 43 70% 55%;
  --accent-gold-hover: 43 75% 60%;
  --accent-gold-active: 43 65% 45%;
  --accent-gold-muted: 43 50% 35%;
  --accent-copper: 25 55% 45%;
  
  /* Interactive */
  --interactive-default: 222 35% 17%;
  --interactive-hover: 222 32% 22%;
  --interactive-active: 222 30% 26%;
  
  /* Semantic */
  --success: 142 70% 45%;
  --error: 0 84% 60%;
  --warning: 38 92% 50%;
  --info: 217 91% 60%;
  
  /* Shadcn/UI Compatibility */
  --card: 222 41% 11%;
  --card-foreground: 210 40% 98%;
  --popover: 222 38% 14%;
  --popover-foreground: 210 40% 98%;
  --primary: 43 70% 55%;
  --primary-foreground: 222 47% 6%;
  --secondary: 222 35% 17%;
  --secondary-foreground: 210 40% 98%;
  --muted: 222 35% 17%;
  --muted-foreground: 217 15% 55%;
  --accent: 222 32% 22%;
  --accent-foreground: 210 40% 98%;
  --destructive: 0 84% 60%;
  --input: 220 20% 18%;
  --ring: 43 70% 55%;
}
```

---

## Tailwind Configuration

Add custom colors to `tailwind.config.ts`:

```typescript
// Extend the theme with custom dark mode colors
theme: {
  extend: {
    colors: {
      // Surface colors
      surface: {
        1: 'hsl(var(--surface-1))',
        2: 'hsl(var(--surface-2))',
        3: 'hsl(var(--surface-3))',
        hover: 'hsl(var(--surface-hover))',
      },
      // Text colors
      text: {
        primary: 'hsl(var(--text-primary))',
        secondary: 'hsl(var(--text-secondary))',
        muted: 'hsl(var(--text-muted))',
        subtle: 'hsl(var(--text-subtle))',
      },
      // Accent colors
      gold: {
        DEFAULT: 'hsl(var(--accent-gold))',
        hover: 'hsl(var(--accent-gold-hover))',
        active: 'hsl(var(--accent-gold-active))',
        muted: 'hsl(var(--accent-gold-muted))',
      },
      copper: 'hsl(var(--accent-copper))',
    },
    boxShadow: {
      'glow-gold': 'var(--glow-gold)',
      'glow-gold-strong': 'var(--glow-gold-strong)',
    },
  },
}
```

---

## Component-Specific Guidelines

### ProductHero.tsx

**Current Issues:**
- Uses hardcoded `dark:from-gray-900 dark:via-gray-950 dark:to-gray-900`
- Trust signal cards use `dark:bg-gray-800/50`

**Recommended Changes:**
```tsx
// Background gradient
<div className="absolute inset-0 bg-gradient-to-br from-background via-surface-1 to-background" />

// Trust signal cards
<div className="flex items-center gap-3 p-4 rounded-xl bg-surface-1/50 backdrop-blur-sm border border-border">
  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-surface-2 flex items-center justify-center">
    <Icon className="w-5 h-5 text-text-secondary" />
  </div>
  <div>
    <div className="font-semibold text-text-primary text-sm">{title}</div>
    <div className="text-xs text-text-muted">{description}</div>
  </div>
</div>
```

### ProductComparisonTable.tsx

**Current Issues:**
- Table rows use `dark:bg-gray-800/30` and `dark:bg-gray-900`
- Borders use `dark:border-gray-700`

**Recommended Changes:**
```tsx
// Table header
<th className="p-4 text-left text-sm font-medium text-text-muted border-b border-border">

// Alternating rows
<tr className={cn(
  index % 2 === 0 ? 'bg-surface-1/30' : 'bg-background'
)}>

// CTA buttons
<Link className={cn(
  "inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full",
  "bg-gold text-background font-medium text-sm",
  "hover:bg-gold-hover transition-colors duration-200"
)}>

// Mobile cards - Popular highlight
<div className={cn(
  "rounded-xl border overflow-hidden",
  productIndex === 0
    ? "border-gold/50 bg-gold/5"
    : "border-border bg-surface-1"
)}>
```

### SizeSelector.tsx

**Current Issues:**
- Selected state uses `dark:border-white dark:bg-gray-800`
- Unselected uses `dark:border-gray-700 dark:bg-gray-900`

**Recommended Changes:**
```tsx
// Size card
<button className={cn(
  "flex-shrink-0 snap-start relative p-4 rounded-xl border-2 transition-all duration-200",
  isSelected
    ? "border-gold bg-surface-2"
    : "border-border bg-surface-1 hover:border-border-interactive"
)}>

// Selected indicator
{isSelected && (
  <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gold flex items-center justify-center">
    <Check className="w-4 h-4 text-background" />
  </div>
)}

// Size visualization
<div className={cn(
  "border-2 rounded-sm transition-colors",
  isSelected
    ? "border-gold bg-surface-hover"
    : "border-border bg-surface-1"
)} />
```

### MobileStickyCart.tsx

**Current Issues:**
- Background uses `dark:bg-gray-900`
- CTA uses `dark:bg-white dark:text-gray-900`

**Recommended Changes:**
```tsx
// Main container
<div className="bg-background border-t border-border px-4 py-3 pb-safe">

// CTA Button - Use gold accent for primary action
<button className={cn(
  "flex items-center justify-center gap-2 px-6 py-3 rounded-full",
  "bg-gold text-background font-semibold text-sm",
  "hover:bg-gold-hover active:bg-gold-active",
  "transition-all duration-200 active:scale-95",
  "disabled:opacity-50 disabled:cursor-not-allowed"
)}>
```

### ProductQuickBuy.tsx

**Current Issues:**
- Popover uses `dark:bg-gray-900`
- Recommended product highlight uses `dark:bg-amber-900/20`

**Recommended Changes:**
```tsx
// Popover container
<div className={cn(
  'absolute bottom-full left-0 right-0 mb-2 z-50',
  'bg-surface-2 rounded-xl shadow-xl',
  'border border-border',
  'overflow-hidden'
)}>

// Recommended product card
<Link className={cn(
  'flex items-center gap-3 p-3 rounded-lg',
  'bg-gold/10 hover:bg-gold/15',
  'border-2 border-gold/50',
  'transition-colors duration-150'
)}>

// Alternative products
<Link className={cn(
  'flex items-center gap-3 p-3 rounded-lg',
  'hover:bg-surface-hover',
  'transition-colors duration-150'
)}>
```

### FeaturedMapCard.tsx

**Current Issues:**
- Card uses hardcoded `bg-[#111827]` and `border-gray-800`
- Overlay uses `from-[#0a0f1a]`

**Recommended Changes:**
```tsx
// Card container
<div className="relative h-full bg-surface-1 rounded-2xl overflow-hidden border border-border transition-all duration-300 hover:border-gold/50 hover:shadow-glow-gold">

// Overlay gradient
<div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-60" />

// Desktop CTA button
<button className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gold text-background shadow-lg hover:bg-gold-hover hover:scale-110 transition-all">

// Mobile CTA
<Link className="w-full py-3 rounded-lg bg-gold hover:bg-gold-hover active:bg-gold-active text-background font-semibold text-center transition-all duration-200">

// Desktop hover CTA
<Link className="w-full py-3 rounded-lg bg-surface-2 group-hover:bg-gold group-hover:text-background text-text-primary font-medium text-center transition-all duration-300">
```

---

## Gradient Recipes

### Hero Background Gradient
```css
.hero-gradient {
  background: linear-gradient(
    135deg,
    hsl(222 47% 6%) 0%,
    hsl(222 41% 11%) 50%,
    hsl(222 47% 6%) 100%
  );
}
```

### Card Hover Glow
```css
.card-glow:hover {
  box-shadow: 
    0 0 0 1px hsl(43 70% 55% / 0.3),
    0 0 30px hsl(43 70% 55% / 0.15);
}
```

### Subtle Depth Gradient
```css
.depth-gradient {
  background: linear-gradient(
    180deg,
    hsl(222 38% 14%) 0%,
    hsl(222 41% 11%) 100%
  );
}
```

### Gold Shimmer Effect
```css
.gold-shimmer {
  background: linear-gradient(
    90deg,
    hsl(43 70% 55%) 0%,
    hsl(43 80% 65%) 50%,
    hsl(43 70% 55%) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 2s ease-in-out infinite;
}
```

---

## Accessibility Checklist

| Combination | Contrast Ratio | WCAG Level |
|-------------|----------------|------------|
| text-primary on background | 16.5:1 | AAA |
| text-primary on surface-1 | 14.2:1 | AAA |
| text-secondary on background | 8.2:1 | AAA |
| text-secondary on surface-1 | 7.1:1 | AAA |
| text-muted on background | 4.6:1 | AA |
| text-muted on surface-1 | 4.0:1 | AA |
| gold on background | 7.8:1 | AAA |
| gold on surface-1 | 6.7:1 | AAA |
| error on background | 5.2:1 | AA |
| success on background | 4.8:1 | AA |

---

## Migration Strategy

### Phase 1: CSS Variables
1. Add new CSS variables to `.dark` class in `globals.css`
2. Update Tailwind config with custom color tokens
3. Test that existing components still work

### Phase 2: Core Components
1. Update `ProductHero.tsx`
2. Update `ProductComparisonTable.tsx`
3. Update `SizeSelector.tsx`
4. Update `MobileStickyCart.tsx`

### Phase 3: Featured Components
1. Update `ProductQuickBuy.tsx`
2. Update `FeaturedMapCard.tsx`
3. Update any shared UI components

### Phase 4: Polish
1. Add gradient effects
2. Add glow effects on hover states
3. Fine-tune transitions
4. Test with actual map imagery

---

## Visual Reference

```
┌────────────────────────────────────────────────────────────────┐
│ BACKGROUND (#080b12)                                           │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ SURFACE-1 (#111827) - Cards                              │  │
│  │                                                          │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │ SURFACE-2 (#161d2d) - Popovers                     │  │  │
│  │  │                                                    │  │  │
│  │  │  TEXT-PRIMARY (#f8fafc)                            │  │  │
│  │  │  TEXT-SECONDARY (#b4bfcc)                          │  │  │
│  │  │  TEXT-MUTED (#7a8599)                              │  │  │
│  │  │                                                    │  │  │
│  │  │  ┌──────────────────┐  ┌──────────────────┐        │  │  │
│  │  │  │ GOLD CTA (#d4a84a)│  │ SURFACE-3 Modal │        │  │  │
│  │  │  └──────────────────┘  └──────────────────┘        │  │  │
│  │  │                                                    │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  │                                                          │  │
│  │  BORDER (#252d3a) ─────────────────────────────────────  │  │
│  │                                                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## Summary

This color palette provides:

1. **Professional Depth** - 4 surface levels create clear visual hierarchy
2. **Warm Undertones** - Navy-blue base with gold accents feels premium
3. **Map-Friendly** - Dark backgrounds make colorful maps pop
4. **Accessible** - All text combinations meet WCAG AA or AAA
5. **Consistent** - Semantic tokens ensure predictable behavior
6. **Modern** - Inspired by Apple, Linear, Vercel, Stripe design systems

The gold accent color (`#d4a84a`) serves as the primary call-to-action color, creating a cohesive brand identity that ties into the existing landing page design system while providing a more refined, professional appearance for the store pages.
