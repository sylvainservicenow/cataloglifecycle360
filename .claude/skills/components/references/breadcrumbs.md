# Breadcrumbs

**DaisyUI base:** `breadcrumbs` (`aiux-breadcrumbs` prefix)
**Production component:** None — composed from the `aiux-breadcrumbs` class family on a native `<nav>`. No shared component exists; every real usage hand-builds its own markup, so implementations vary in the details covered in §2.
**Last updated:** 2026-07-06 · v5

---

## Design Spec

<!-- SPEC ZONE: Design intent only. An agent generating UI reads this section.
     All styling uses Tailwind utility classes and DaisyUI component classes.
     No CSS custom properties, no override tables.
     Target: ≤ 2,000 tokens. -->

### 1. When to use

Use breadcrumbs to show users their location within a page hierarchy and allow navigation back to parent pages. Breadcrumbs are appropriate when content has a clear hierarchical structure and users may arrive from multiple paths.

**Do not use breadcrumbs when:**

- The page is a top-level destination with no parent hierarchy
- The content serves as primary navigation — use a navigation menu instead
- The context is inside a modal dialog
- Parallel views at the same level need switching — use tabs instead

### 2. Anatomy

Apply the `aiux-breadcrumbs` class to the `<nav>` landmark itself, or to a `<div>` wrapping the `<ol>` inside it — both are real patterns in production. Items are laid out horizontally in a single inline row with `gap-2` (8 px) between each item-separator pair. Each list item (`<li>`) contains either a link (`<a>`) or plain text for the current page.

```
+--------------------------------------------------------------+
|  [Home icon]  >  [Parent link]  >  [Current page text]      |
+--------------------------------------------------------------+
```

| Element          | Implementation                                 | Notes                                                                                                                                                                                                                                                                                                                                                |
| ---------------- | ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Container**    | `<nav aria-label="Breadcrumb">` with `<ol>`    | `aiux-breadcrumbs` class on the `<nav>` (or a `<div>` wrapping the `<ol>`).                                                                                                                                                                                                                                                                          |
| **Trail item**   | `<li><a href="...">` with optional icon + text | Ancestor pages. The `aiux-breadcrumbs` class has no built-in text-color styling — set `text-text-tertiary` on every trail item explicitly (`text-text-primary` with underline on hover). `gap-2` (8 px) between icon and label. If the trail changes a client-side view/panel rather than navigating to a URL, use `<button>` instead of `<a href>`. |
| **Current page** | `<li>` with optional icon + text, no `<a>`     | Non-interactive. `aria-current="page"`. Set `text-text-primary` explicitly — this is the only item that gets it; it is not automatic.                                                                                                                                                                                                                |
| **Separator**    | Automatic — no markup needed                   | `aiux-breadcrumbs` renders this itself via CSS between every adjacent `<li>` pair. Do not add a second, explicit separator (icon or otherwise) on top of it — see §7.                                                                                                                                                                                |
| **Item icon**    | Optional leading icon per item                 | Any item may include a leading icon (e.g., home, document) — confirmed against Figma. `aria-hidden="true"` — the label carries meaning. `aria-label` required on icon-only items.                                                                                                                                                                    |

### 3. Sizing

| Size   | Text             | Icon size  | Notes                            |
| ------ | ---------------- | ---------- | -------------------------------- |
| **md** | 14px (`text-sm`) | sm (16×16) | Default size.                    |
| **sm** | 12px (`text-xs`) | xs (12×12) | Compact contexts, dense layouts. |

Items within a single breadcrumb trail must all use the same size.

### 4. Overflow behavior

Confirmed against Figma: when breadcrumb items exceed available container width, the middle items collapse into an ellipsis ("…"); the first and last items remain visible. Make the ellipsis a keyboard-accessible button that opens a dropdown listing the hidden intermediate items (menu APG pattern) — real implementations are inconsistent here, one renders the ellipsis as a static, non-interactive tooltip instead, which loses access to the hidden items entirely.

No reusable component implements this — hand-write it following the pattern above.

Breadcrumbs at narrow viewports must reflow to remain usable at 320 px width (WCAG 1.4.10). See `@responsive-design` for reflow constraints.

### 5. Content rules

- **Sentence case:** "Incident details" not "Incident Details".
- **Concise labels:** Use short page titles. Breadcrumb labels should match the page heading they link to.
- **No redundancy:** Do not repeat the current page name if it is already visible as the page heading.
- **Item icons:** Any breadcrumb item may include a leading icon to reinforce the item type (e.g., home icon for the root, document icon for records). Icons are decorative (`aria-hidden="true"`) when a text label is present. Icon-only items (e.g., home with no label) require `aria-label`.
- **Internationalization:** All user-facing strings — breadcrumb labels and `aria-label` values — must be wrapped with `i18n.getMessage()`. See `@internationalization` for the full API and parameterized message syntax.

### 6. Current page display

The current page (last item in the trail) is always rendered as non-interactive plain text — never as a link. Apply `aria-current="page"` to the current page item. Use `text-text-primary` for the current page text. No separator follows the current page item.

### 7. Separator

`aiux-breadcrumbs` draws its own separator automatically via CSS between every adjacent pair of `<li>` elements — this fires unconditionally whenever the class is used. **Do not add an explicit separator element (icon or otherwise) between trail items** — doing so renders two separators for every gap, since the class's own separator cannot be suppressed from a single component's own markup.

Figma specifies an explicit chevron icon here, but that icon cannot be added without shared-stylesheet changes outside this sheet's scope. Use the class's built-in separator as-is.

Do not use inline text characters as separators. No separator follows the current (last) page item.

### 8. Accessibility

Follow `@accessibility` for project-wide accessibility requirements. Component-specific routing:

- **APG pattern:** Breadcrumb — see `@accessibility`
- **DaisyUI corrections:** See `@accessibility` › Breadcrumb (use `<ol>` not `<ul>`; `<nav aria-label="Breadcrumb">`; `aria-current="page"` on the current item)
- **Forced colors:** Follows the **interactive** pattern for link items; current page uses `CanvasText`; separators use `CanvasText` — see `@accessibility`

**Horizon-specific design notes:**

- **Collapsed overflow:** When middle items are collapsed into an ellipsis button, that button must be keyboard-accessible and open a dropdown with the hidden items. The dropdown follows the menu APG ARIA and keyboard pattern.
- **Separators** are generated content (`::before`) from `aiux-breadcrumbs` — already invisible to assistive technology with no extra markup. Do not use inline text characters as separators.

### 9. RTL

Breadcrumb items mirror direction in RTL layouts. The visual reading order reverses — the hierarchy root appears at the inline-end and the current page at the inline-start. The separator mirrors automatically as part of `aiux-breadcrumbs`'s own CSS — no action needed.

### 10. Scope boundary

This sheet covers single-breadcrumb-trail decisions: anatomy, overflow behavior, content rules, current page treatment, separator rendering, and accessibility requirements. It does not govern:

- **Page header assembly** (breadcrumbs + title + actions layout) — defined by header composition specs.
- **Breadcrumb data resolution** (how the trail is computed from the navigation hierarchy) — a runtime concern.
- **Placement and spacing relative to other page elements** — a layout composition concern.

The referencing direction is one-way: composition specs reference this sheet for individual breadcrumb trail rules; this sheet does not reference composition specs.
