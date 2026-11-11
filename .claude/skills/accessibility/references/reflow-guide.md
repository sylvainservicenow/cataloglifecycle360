# Reflow Accessibility Guide

## Core Requirement

**Pages must reflow down to 320px wide without loss of content or functionality.**

This meets WCAG 2.2 Success Criterion 1.4.10 (Reflow) Level AA, which requires content to be presentable without loss of information or functionality, and without requiring scrolling in two dimensions.

### Why 320px?

320px represents:

- 1280px viewport at 400% zoom
- Common mobile device width in portrait orientation
- Equivalent to a user zooming to 400% on desktop

---

## Top-Line Rules

### 1. Primary Breakpoint at 640px

Set your main responsive breakpoint at 640px (40rem). This is where layouts should transition from desktop to mobile patterns.

```css
/* Mobile-first approach */
.container {
  /* Mobile styles (default) */
}

@media (min-width: 640px) {
  .container {
    /* Desktop styles */
  }
}
```

### 2. No Sticky Headers or Footers Below 640px

**Rule:** Remove `position: sticky` and `position: fixed` from headers and footers on viewports below 640px.

**Why:** Sticky elements consume valuable vertical space on small screens and can obscure content or create scrolling issues.

```css
/* Default: No sticky positioning */
.header,
.footer {
  position: static;
}

/* Only sticky on larger screens */
@media (min-width: 640px) {
  .header {
    position: sticky;
    top: 0;
  }

  .footer {
    position: sticky;
    bottom: 0;
  }
}
```

### 3. Avoid Vertical Scrolling Regions Within the Page

**Rule:** Avoid nested vertical scrolling regions (scrollable divs within the main page). Users should only need to scroll the main page vertically.

**Why:**

- Multiple scrolling regions are confusing
- Hard to discover on mobile
- Difficult for keyboard navigation
- Creates two-dimensional scrolling

**Exceptions:**

- Canvas-based tools (drawing, diagramming applications)
- List views with large datasets
- Time-based charts (Gantt charts, timelines)
- 2D necessary interfaces (WYSIWYG editors, spreadsheets)
- Data tables (when horizontal scrolling is unavoidable)

**Constraint for all exceptions:** A permitted scroll region must NOT fill the full viewport height. At least 24px of page content must remain visible above and below the component — enough for the user to see there is more page, and to scroll past the component without getting trapped inside its scroll region.

```css
/* AVOID THIS on small screens: */
.scrollable-sidebar {
  height: 500px;
  overflow-y: auto; /* Creates nested scroll region */
}

/* PREFER THIS: */
.sidebar {
  /* Let it flow naturally with the page */
  /* No fixed height, no overflow */
}

/* Exception: Only use when truly necessary */
@media (min-width: 640px) {
  .data-table-wrapper {
    overflow-x: auto; /* Horizontal scroll acceptable for tables */
  }
}
```

### 4. Use Long Scrolling Pages

**Rule:** Prefer long scrolling pages over constrained containers, at any viewport width. Do not set `height: 100dvh` or `overflow-y: auto` on individual content sections — that scroll architecture belongs at the shell level only, not on content containers.

**Why:**

- A content section with a fixed height and `overflow-y: auto` creates a nested scroll region (see the nested-scroll exceptions above)
- It risks clipping content for users who zoom — a WCAG 1.4.10 failure
- Users are comfortable with vertical page scrolling
- Simpler interaction model; more content accessible without tapping

```css
/* Good: Let content flow naturally */
.content {
  /* No fixed height */
  /* No overflow properties */
  padding-bottom: 2rem; /* Space at bottom */
}

/* Avoid: Constrained containers (at any viewport width) */
.content {
  /* Don't do this: */
  /* height: 100vh; */
  /* overflow-y: auto; */
}
```

### 5. Use Full Column Width with Minimal Side Padding

**Rule:** On viewports below 640px, use full or near-full width with minimal horizontal padding.

**Why:**

- Maximizes usable screen space
- More room for content and touch targets
- Easier to read full-width text
- Better use of limited screen real estate

```css
/* Mobile: Minimal side padding */
.container {
  padding: 1rem 0.75rem; /* Small horizontal padding */
  width: 100%;
}

.content {
  width: 100%;
  /* No max-width constraint on mobile */
}

/* Desktop: Add more padding and constraints */
@media (min-width: 640px) {
  .container {
    padding: 2rem;
  }

  .content {
    max-width: 800px;
  }
}
```

**Padding Guidelines:**

- **Mobile (< 640px):** 0.75rem to 1rem side padding
- **Tablet (640px+):** 1.5rem to 2rem side padding
- **Desktop (1024px+):** 2rem to 3rem side padding

### 6. Stack Items in Source Order

**Rule:** When reflowing to mobile, stack elements in the order they appear in the HTML source.

**Why:**

- Maintains logical reading order
- Predictable for screen readers
- Easier to implement and maintain
- Preserves content hierarchy

```css
/* Mobile: Natural stacking (source order) */
.layout {
  display: block;
}

.item {
  width: 100%;
  margin-bottom: 1rem;
}

/* Desktop: Can rearrange visually if needed */
@media (min-width: 640px) {
  .layout {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 2rem;
  }

  /* Visual order can differ from source order on desktop */
  .item.sidebar {
    order: 2;
  }
}
```

**Best Practice:**

- Don't use CSS to significantly reorder content on mobile
- If visual order needs to change, consider adjusting HTML source order
- Use `order` property sparingly and only on larger screens

---

## Reflow Techniques

### 1. Navigation Must Not Persist as a Side Column

**Principle:** At narrow viewport widths, navigation must not remain visible as a side column — a persistent sidebar eliminates usable content width and breaks the single-column requirement.

**Patterns:**

- Place navigation horizontally above the content — no horizontal scrolling within it; use an overflow menu if items don't fit.
- Or hide navigation behind a disclosed trigger that communicates state with `aria-expanded` and `aria-controls`.

```css
/* Narrow viewport: navigation horizontal above content */
.sidebar {
  width: 100%;
  margin-bottom: 1rem;
}

.main-content {
  width: 100%;
}
```

### 2. Drawers with Pull Tabs

**Pattern:** Hide non-essential content off-screen with a button/tab to reveal it when needed.

```html
<button
  class="drawer-toggle"
  aria-expanded="false"
  aria-controls="drawer-content"
>
  Filters
</button>

<aside id="drawer-content" class="drawer" hidden>
  <!-- Filter content -->
</aside>
```

### 3. Stacking Content

**Pattern:** Stack previously side-by-side elements vertically on small screens.

```css
/* Mobile: Stack vertically */
.card-grid {
  display: block;
}

.card {
  width: 100%;
  margin-bottom: 1rem;
}
```

### 4. Transform Vertical Content to Horizontal

**Pattern:** Toolbars and icon action groups arranged vertically in wider layouts must reflow to a horizontal row at narrow viewport widths. Examples: record action toolbars, form section toolbars, editor formatting bars. Do not allow the toolbar to wrap or scroll horizontally. If items don't fit in a single row, collapse the lowest-priority actions into an overflow menu (3-dot icon).

```css
/* Narrow viewport (default): Horizontal toolbar */
.toolbar {
  display: flex;
  flex-direction: row;
  justify-content: space-around;
  gap: 0.25rem;
}

.toolbar-button {
  flex: 1;
  min-width: 44px; /* Minimum touch target */
}

/* Desktop: Vertical toolbar */
@media (min-width: 640px) {
  .toolbar {
    flex-direction: column;
    gap: 0.5rem;
  }

  .toolbar-button {
    width: 100%;
  }
}
```
