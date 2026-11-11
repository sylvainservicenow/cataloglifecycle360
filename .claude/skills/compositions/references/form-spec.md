# Form — Design Spec

## 1. Overview

A form composition arranges editable fields into sections and presents those sections using one of three layout variants — accordion, tabs, or flat.

This spec governs how sections, fields, and messages are arranged within a form. Individual field rendering follows the relevant component sheet.

## 2. Layout Variants

Every form uses exactly one layout variant. The variant determines how sections are presented — collapsed, tabbed, or stacked. **Accordion is the default.** The variant is a user or developer preference — see §3 Variant Selection for usability recommendations.

### 2.1 Three Variants

| Variant                 | DaisyUI Class                                              | Section Header                                    | Expand/Collapse                              | Limit        | When to Use                                                                                      |
| ----------------------- | ---------------------------------------------------------- | ------------------------------------------------- | -------------------------------------------- | ------------ | ------------------------------------------------------------------------------------------------ |
| **Accordion** (default) | `aiux-collapse aiux-collapse-arrow border border-base-300` | `aiux-collapse-title` per section                 | Yes — sections expand/collapse independently | Any          | Default layout. Works at any width including side panels and narrow containers.                  |
| **Tabs**                | `tabs tabs-lift`                                           | Tab label per section                             | No — tab switch replaces visible content     | 2–4 sections | Moderate sections (2–4) of roughly equal weight, user switches between them                      |
| **Flat**                | No DaisyUI container — bare stacking                       | `text-lg font-semibold text-text-primary` heading | No — all sections visible                    | 1–3 sections | Few sections (1–3), all fields needed simultaneously, or constrained containers (modals, panels) |

> ⚠️ **Not yet shipped.** Additional tab styles:
>
> | Tab Style            | DaisyUI Class   | Description                                    |
> | -------------------- | --------------- | ---------------------------------------------- |
> | **Lifted** (current) | `tabs-lift`     | Raised active tab with connected panel border  |
> | **Bordered**         | `tabs-bordered` | Underline border on active tab                 |
> | **Boxed**            | `tabs-boxed`    | Contained/pill-style tabs with background fill |

### 2.2 General Form Anatomy

All three variants share this vertical structure:

```
┌─────────────────────────────────────────────────────┐
│  Form-level messages (aiux-alert)            │           │  ← 0–n alerts
├─────────────────────────────────────────┤  Section  │
│  Layout variant region                  │   nav     │  ← optional
│    ┌─ Section ──────────────────────┐   │  (TBD)   │
│    │  grid grid-cols-2 gap-3        │   │           │
│    │  ┌─────────┐ ┌─────────────┐   │   │           │
│    │  │ Field 1 │ │ Field 2     │   │   │           │
│    │  └─────────┘ └─────────────┘   │   │           │
│    │  ┌─────────────────────────┐   │   │           │
│    │  │ Field 3 (col-span-full) │   │   │           │
│    │  └─────────────────────────┘   │   │           │
│    └────────────────────────────────┘   │           │
└─────────────────────────────────────────────────────┘
```

> ⚠️ **Not yet shipped.** Section Navigation Menu: An optional sidebar navigation listing all section headers, allowing users to jump directly to a section. Anatomy and interaction rules will be defined when this feature ships.

## 3. Variant Selection

The layout variant is a developer or user preference — there is no strict rule dictating when to use one over another. The three variants exist to support different workflows inherited from Seismic (accordion) and CoreUI (tabs, flat).

The following are usability recommendations, not requirements.

### 3.1 Container Guidance

The strongest recommendation is container-driven: **avoid tabs in small containers** — they look awkward at narrow widths. Prefer accordion or flat in panels and narrow containers.

| Container                    | Recommendation    | Why                                                               |
| ---------------------------- | ----------------- | ----------------------------------------------------------------- |
| **Page body (wide)**         | Any variant       | Full width accommodates all three                                 |
| **Modal / Dialog**           | Flat or Tabs      | Accordion adds unnecessary toggle friction in a constrained space |
| **Panel / Side panel**       | Flat or Accordion | Tabs look awkward at narrow widths                                |
| **Small container / widget** | Accordion or Flat | Tabs don't fit; accordion collapses content to save space         |

### 3.2 Variant Characteristics

When choosing a variant, consider what each offers:

| Variant       | Strengths                                                       | Consider when                                                   |
| ------------- | --------------------------------------------------------------- | --------------------------------------------------------------- |
| **Accordion** | Collapses content, reduces visual overwhelm, works at any width | Many sections, user focuses on one at a time, narrow containers |
| **Tabs**      | Quick scanning between sections, equal-weight categories        | Few sections of similar size, wide containers                   |
| **Flat**      | All content visible, no interaction required to reveal fields   | Few sections, user needs to see everything, modals              |

### 3.3 Examples

| Form Context                                        | Likely Variant    | Why                                           |
| --------------------------------------------------- | ----------------- | --------------------------------------------- |
| Employee record (8 sections)                        | Accordion         | Many sections, user drills into one at a time |
| Settings page (General, Notifications, Security)    | Tabs              | Equal-weight categories in a wide container   |
| Quick create modal (one section, 4 fields)          | Flat              | All fields visible, constrained container     |
| Contact form (Name, Address)                        | Flat              | Both sections needed simultaneously           |
| Side panel edit (2–3 sections)                      | Flat or Accordion | Narrow width; developer preference            |
| Incident record (Details, Notes, Resolution, Audit) | Accordion         | Many independent sections                     |

### 3.4 Single Section Rule

**One section = no section header.** When only one section exists, use flat and omit the form's section header and divider. The parent container (stepper step, card, page layout) may provide its own heading above the form — that heading is not owned by the form component.

## 4. Patterns

### 4.1 Pattern 1: Accordion Layout

Sections are collapsible panels. The user expands sections independently to view and edit fields.

```
┌─────────────────────────────────────────┐
│ [alerts]                                │
├─────────────────────────────────────────┤
│ ▼ Section A  [open]                     │
│   grid grid-cols-2 gap-3               │
│   [fields...]                           │
├─────────────────────────────────────────┤
│ ▶ Section B  [closed]                   │
├─────────────────────────────────────────┤
│ ▶ Section C  [closed]                   │
└─────────────────────────────────────────┘
```

- Each section wraps in `aiux-collapse aiux-collapse-arrow border border-base-300` with `aiux-collapse-title` and `aiux-collapse-content`
- Collapse/expand behavior and keyboard navigation follow the APG accordion pattern
- **`border-base-300` is required on every section, not optional.** A surface background color (`bg-surface-secondary`) is not a substitute — sections need both the border for definition and, if used, a surface background for depth. Omitting the border is a violation even when a background color is present.

```html
<form aria-label="[form purpose]">
  <div class="@container flex flex-col gap-4">
    <!-- form-level messages -->
    <div role="alert" class="aiux-alert aiux-alert-error"><!-- message --></div>

    <!-- accordion sections -->
    <div class="flex flex-col gap-2">
      <div class="aiux-collapse aiux-collapse-arrow border border-base-300">
        <h3>
          <button class="aiux-collapse-title font-semibold">
            <!-- section title -->
          </button>
        </h3>
        <div class="aiux-collapse-content">
          <fieldset>
            <legend class="sr-only"><!-- section title --></legend>
            <div class="grid grid-cols-2 gap-3 @max-md:grid-cols-1">
              <!-- fields -->
            </div>
          </fieldset>
        </div>
      </div>
      <div class="aiux-collapse aiux-collapse-arrow border border-base-300">
        <!-- next section -->
      </div>
    </div>
  </div>
</form>
```

ARIA wiring (`aria-expanded`, `aria-controls`, `aria-labelledby`) follows the APG accordion pattern.

### 4.2 Pattern 2: Tab Layout

Sections are presented as tabs. Only one section is visible at a time.

```
┌─────────────────────────────────────────┐
│ [alerts]                                │
├─────────────────────────────────────────┤
│ ┌───────┐┌───────┐┌───────┐            │
│ │ Tab A ││ Tab B ││ Tab C │  tabs       │
│ └───────┘└───────┘└───────┘  tabs-lift  │
│ ┌───────────────────────────────────┐   │
│ │ Tab panel: grid grid-cols-2 gap-3 │   │
│ │ [fields for active tab]           │   │
│ └───────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

- Tab strip uses `tabs tabs-lift` with `tab` class per tab
- Tab ARIA follows the APG tabs pattern

```html
<form aria-label="[form purpose]">
  <div class="@container flex flex-col gap-4">
    <!-- tab strip -->
    <div class="tabs tabs-lift">
      <button class="tab"><!-- tab label --></button>
      <button class="tab"><!-- tab label --></button>
      <button class="tab"><!-- tab label --></button>
    </div>

    <!-- active tab panel -->
    <div class="tab-content">
      <fieldset>
        <legend class="sr-only"><!-- section title --></legend>
        <div class="grid grid-cols-2 gap-3 @max-md:grid-cols-1">
          <!-- fields -->
        </div>
      </fieldset>
    </div>
  </div>
</form>
```

ARIA wiring (`role="tablist"`, `role="tab"`, `aria-selected`, `role="tabpanel"`) follows the APG tabs pattern.

#### Tabs with First Section Displayed

When `alwaysDisplayFirstSection` is enabled, the first section renders as flat content above the tab strip — with or without a section header. The remaining sections become tabs below.

```
┌─────────────────────────────────────────┐
│ [alerts]                                │
├─────────────────────────────────────────┤
│ First section (flat — optional header)  │
│   grid grid-cols-2 gap-3               │
│   [fields...]                           │
├─────────────────────────────────────────┤
│ ┌───────┐┌───────┐┌───────┐            │
│ │ Tab A ││ Tab B ││ Tab C │  tabs-lift  │
│ └───────┘└───────┘└───────┘             │
│ ┌───────────────────────────────────┐   │
│ │ Tab panel: [fields]               │   │
│ └───────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

This is typical when the first section contains primary fields (e.g., short description, number, state) that should always be visible without requiring a tab click.

### 4.3 Pattern 3: Flat Layout

All sections are visible in a vertical stack separated by dividers.

```
┌─────────────────────────────────────────┐
│ [alerts]                                │
├─────────────────────────────────────────┤
│ Section A heading                       │
│   grid grid-cols-2 gap-3               │
│   [fields...]                           │
├── aiux-divider ──────────────────────────────┤
│ Section B heading                       │
│   grid grid-cols-2 gap-3               │
│   [fields...]                           │
└─────────────────────────────────────────┘
```

- Section headers: `text-lg font-semibold text-text-primary`
- Divider between sections: `aiux-divider` (DaisyUI)
- If only one section exists, omit the section header and divider

```html
<form aria-label="[form purpose]">
  <div class="@container flex flex-col gap-4">
    <fieldset>
      <legend class="text-lg font-semibold text-text-primary">
        <!-- section title -->
      </legend>
      <div class="grid grid-cols-2 gap-3 @max-md:grid-cols-1">
        <!-- fields -->
      </div>
    </fieldset>

    <div class="aiux-divider"></div>

    <fieldset>
      <legend class="text-lg font-semibold text-text-primary">
        <!-- section title -->
      </legend>
      <div class="grid grid-cols-2 gap-3 @max-md:grid-cols-1">
        <!-- fields -->
      </div>
    </fieldset>
  </div>
</form>
```

## 5. Context Mappings

### 5.1 Edit Mode Mappings

| Edit Mode      | Behavior                                                                                                                                                                                                                                          | Layout Impact                                                   |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| `default`      | Normal form editing — all fields editable                                                                                                                                                                                                         | Standard layout                                                 |
| `inline`       | Edit-on-demand (field-level) — compact label-value pairs in view state. Per-field pencil icon on hover, double-click value or click pencil to enter edit. Enter/Tab to save, Escape/click-outside to cancel.                                      | Empty fields hidden unless explicitly configured to display     |
| `display-only` | Read-only with section-level edit — compact label-value display. No per-field pencil. Edit pencil appears in the section/accordion header; clicking it transitions the section to editable. ⚠️ Section-level edit button not yet shipped in code. | Empty fields show em-dash (—) or dash (-). Same layout variant. |

> **Implementation note:** These design-level mode names map to `FormFieldEditMode` enum values in `AIUXRecordForm`: `default` → `DEFAULT`, `inline` → `ON_DEMAND`, `display-only` → `DISPLAY_ONLY`. When referencing edit modes in code, use the enum values.

## 6. Layout Rules

### 6.1 Form Container

- **Direction:** Vertical. `flex flex-col gap-4`.
- **Container queries:** The form wrapper must include `@container` so that descendant container queries (e.g., `@max-md:grid-cols-1`) resolve against the form's width, not the viewport. Example: `<div class="@container flex flex-col gap-4">`.
- **Width:** Full width of parent container.

### 6.2 Vertical Ordering

All three variants render elements in this order:

1. **Form-level messages** — 0–n alerts, stacked with `gap-2`
2. **Layout variant region** — accordion, tabs, or flat sections

### 6.3 First Section Display

The first section can optionally render outside the variant region as flat content. When enabled, the form structure becomes:

```
┌─────────────────────────────────────────┐
│  Form-level messages (aiux-alert)            │
├─────────────────────────────────────────┤
│  First section (flat — no variant       │
│  wrapper, no aiux-collapse/tab)              │
│    grid grid-cols-2 gap-3              │
│    [fields...]                          │
├─────────────────────────────────────────┤
│  Remaining sections in chosen variant   │
│  (accordion, tabs, or flat)             │
└─────────────────────────────────────────┘
```

This is a cross-variant modifier. The first section renders its field grid directly; the remaining labeled sections use the selected layout variant. This is typical when the first section contains primary fields (e.g., short description, number, state) that should always be visible without requiring a tab click or accordion toggle.

| Variant       | Effect                                                         |
| ------------- | -------------------------------------------------------------- |
| **Accordion** | First section flat, remaining sections collapsible             |
| **Tabs**      | First section flat, remaining sections tabbed                  |
| **Flat**      | No visible effect — flat already displays all sections stacked |

### 6.4 Field Grid

- **Default:** `grid grid-cols-2 gap-3` — two equal columns.
- **Single column:** `grid grid-cols-1 gap-3` — used in narrow containers (panels) or when the form has few fields.

> ⚠️ **Not yet shipped.** A 2-column grid should collapse to 1 column when the container width falls below 500px, using a Tailwind container query (`@max-md:grid-cols-1`). Container queries respond to the parent container's width, not the viewport. This responsive behavior is not yet implemented.

### 6.5 Full-Width Fields

These field types always use `col-span-full` regardless of grid column count:

| Field Type                          | Why Full Width                               |
| ----------------------------------- | -------------------------------------------- |
| Textarea, StringLong                | Multi-line content needs horizontal space    |
| Html, WikiText, TranslatedHtml      | Rich text editor with toolbar                |
| Journal                             | Thread-style content with full-width entries |
| Script, ScriptPlain, Css, Xml, Json | Code editors with monospace content          |
| MultiTwoLines, MultiSmall           | Multi-value inputs that wrap                 |

### 6.6 Label-Value Layout

| Mode                   | Structure                                                               | When                                                  |
| ---------------------- | ----------------------------------------------------------------------- | ----------------------------------------------------- |
| **Vertical** (default) | Label stacked above control, full width                                 | Standard forms, mobile, most contexts                 |
| **Horizontal**         | `grid grid-cols-[120px_1fr_auto]` — label, control, action side by side | Read-heavy forms, density preference, wide containers |

> ⚠️ **Not yet shipped.** Horizontal layout should switch to vertical when the container width falls below 320px. This responsive behavior is not yet implemented.

> ⚠️ **Not yet shipped.** Horizontal layout supports two label alignments:
>
> | Label Alignment            | Style        | Use when                             |
> | -------------------------- | ------------ | ------------------------------------ |
> | **Left-aligned (default)** | `text-start` | Standard reading direction           |
> | **Right-aligned**          | `text-end`   | Labels sit flush against the control |

### 6.7 Form-Level Messages

Position, severity mapping, ARIA roles, priority ordering, and expansion behavior follow the Form-Level Banners pattern. See `@patterns/SKILL.md`.

- **Stacking:** Multiple alerts stack vertically with `gap-2`.

### 6.8 Unsaved Field Indicator

When a field value changes from its original, the form marks it as dirty.

- **Default indicator:** A dot marker appears on the field to signal unsaved changes.
- **Optional highlight:** A background color can be applied to dirty fields via `setFieldStyles({ backgroundColor })`.
- **Controlled by:** `showUnsavedIndicator` (default: enabled). Can be disabled per form instance.
- **Cleared on save:** Indicators reset when the record is saved and field values become the new baseline.

> ⚠️ **Not yet shipped.** The dirty-tracking infrastructure exists (`isDirty()`, `getDirtyFields()`, `showUnsavedIndicator`), but the dot indicator rendering is not yet fully implemented. Visual treatment will be defined when this feature ships.

### 6.9 Sticky Section Headers

> ⚠️ **Not yet shipped.** Section headers that remain fixed at the top of the viewport during scroll, adopting a shadow border for visual distinction. This behavior exists in Horizon documentation but is not yet implemented in the current form component. Rules will be defined when this feature ships.

### 6.10 Loading State

- **Applied to:** The entire form container via `.form-loading` utility class.
- **Effect:** Blurs content and disables interaction (blur, pointer-events disabled, user-select disabled).
- **No form-level spinner** — the triggering button (owned by the parent container) shows its own loading state.

### 6.11 Constraints

- **Column count:** Exactly 1 or 2. No 3+ column layouts.
- **Full-width fields never split:** `col-span-full` fields always span the full grid width regardless of column count.
- **Empty sections hidden:** Sections with no visible fields after filtering are removed from the layout — not rendered as empty containers.
- **Tab overflow:** If tab labels would exceed the container width, switch to accordion. This is a developer decision at build time, not an automatic runtime behavior.

### 6.12 Container Categories

| Container              | Where Form Lives          | Behavioral Difference                                                                                    |
| ---------------------- | ------------------------- | -------------------------------------------------------------------------------------------------------- |
| **Page body**          | Main content area         | Full width, 2-column default, page scroll                                                                |
| **Modal / Dialog**     | Inside `aiux-modal-box`   | Constrained width, internal scroll on field region                                                       |
| **Panel / Side panel** | Inside panel content      | Narrow width forces `grid-cols-1`                                                                        |
| **Stepper step**       | Inside step content panel | Typically flat variant — each step is already a logical section. Footer actions owned by the stepper.    |
| **Card**               | Inside card body          | Flat variant. The card provides the container shell and optional heading — the form renders fields only. |

**Standalone form shell:** When a form is not explicitly placed inside a page, modal, or panel by the prompt, it still needs a container shell. Use `aiux-card` + `aiux-card-body` for that shell — never a hand-rolled `<div>` with manual `rounded-*`, `shadow-*`, and background utilities. A form with no other container context **is** a card.

### 6.13 Density Adjustments

> ⚠️ **Not yet shipped.** Neither DaisyUI nor the form component currently support density classes. The values below are proposed targets — rules will be finalized when density ships.

| Density      | Field Gap | Section Gap | Label Size | Notes                                |
| ------------ | --------- | ----------- | ---------- | ------------------------------------ |
| **Compact**  | —         | —           | —          | Tighter spacing, smaller labels      |
| **Default**  | —         | —           | —          | Standard                             |
| **Spacious** | —         | —           | —          | More breathing room, same label size |

### 6.14 Footer Action Set

Forms are almost always submitted through a footer action set (Save/Cancel, Submit/Save as Draft/Cancel, Save/Delete). Button role → class mapping is owned by `references/action-set-spec.md` — this section restates the load-bearing rule so it isn't missed in a form context.

| Role                                     | Class                                                                         |
| ---------------------------------------- | ----------------------------------------------------------------------------- |
| Primary / completion (Save, Submit)      | `aiux-btn-primary`                                                            |
| Dismissive (Cancel)                      | `aiux-btn-secondary`                                                          |
| Secondary (Save as Draft, other options) | `aiux-btn-secondary`                                                          |
| Destructive (Delete Account, Remove)     | `aiux-btn-error`, positioned far-left, separated from the right-aligned group |

**`aiux-btn-ghost`, `aiux-btn-neutral`, `aiux-btn-soft`, and `aiux-btn-outline` never appear on a footer action set button** — Dismissive and Secondary both map to `aiux-btn-secondary`, distinguished by label and position only, not by a different visual class. See `references/action-set-spec.md` §2 for the full role model.

## 7. Content Rules

- **Section titles:** Noun phrase, sentence case, no trailing punctuation. "Personal information" not "Personal Information:".
- **Section title truncation:** Long section header text truncates with an ellipsis. Full text appears on hover via tooltip. See `@patterns/SKILL.md` cross-cutting pattern.
- **Required indicator:** Asterisk (\*) after label text. When the majority of fields are required, mark optional fields with "(optional)" suffix instead.
- **Empty field display:** In `display-only` mode, empty fields show an em-dash (—), not blank space. In `inline` mode, empty fields are hidden by default.
- **Label truncation:** Field labels truncate by default (`text-overflow: ellipsis`). Full text appears on hover via tooltip. Optional label wrapping can be enabled, with a configurable max-width to control line breaks.
- **Field labels and content:** Follow the relevant component sheet content rules — not restated here.
- **Message priority:** `mandatoryError` messages appear first, followed by `fieldError`, then other message types in order received.
- **Message actions:** Action buttons within alerts use verb-first labels, sentence case (e.g., "Assign owners", "Review changes").

## 8. Accessibility

For per-field accessibility (labels, ARIA, helper / error wiring), see the relevant `@components/SKILL.md` § Accessibility, which delegate to `@accessibility`. This section covers only form-composition-level decisions.

### 8.1 Form Landmark

A `<form>` element or `role="form"` with `aria-label` is recommended but not required. It helps screen reader users navigate between landmarks.

### 8.2 Section Grouping

Wrapping each section in a `<fieldset>` with `<legend>` matching the section title is recommended. Visually hide the `<legend>` if the section header is already visible as a heading or collapse-title.

### 8.3 General

- **Keyboard:** Tab moves between fields in DOM order. No custom arrow-key navigation within the field grid.
- **Error announcement:** See `@patterns/SKILL.md` for inline-validation and form-banner ARIA. Severity → role mapping is defined there.
- **Loading state:** Set `aria-busy="true"` on the `<form>` element while loading.
- **Message expansion:** The "Show more / fewer" toggle uses `aria-expanded` to communicate collapsed state.

## 9. Scope Boundary

This spec covers section arrangement into layout variants, field grid structure, full-width field rules, form-level messages, loading state, and label-value layout modes.

It does **not** cover:

- **Individual field controls** — see component sheets (`@components/SKILL.md`, etc.)
- **Field validation messages and timing** — see `form-field-wrapper.md`
- **Accordion collapse/expand behavior and keyboard** — see `@accessibility` and the APG accordion pattern
- **Tab switching and ARIA** — see `daisy-a11y-corrections.md` and the APG tabs pattern

The referencing direction is one-way: this spec references component sheets for individual field rules and APG patterns for interactive behavior. Those specs do not reference this one.

---

## Validation Checks

Stable check IDs for structured reporting. Each references a spec section above. Used by `compositions/SKILL.md` during validation.

### Structural checks

| #    | Check                                 | Spec section              | Description                                                                                                                                                                                                                     |
| ---- | ------------------------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| S-01 | Layout variant identified             | § 2 Layout Variants       | Form uses exactly one variant — accordion (`aiux-collapse` classes), tabs (`tabs tabs-lift`), or flat (heading + `aiux-divider`).                                                                                               |
| S-02 | Variant classes correct               | § 2.1 Three Variants      | Accordion uses `aiux-collapse aiux-collapse-arrow border border-base-300`. Tabs use `tabs tabs-lift` with `tab` per section. Flat uses `text-lg font-semibold text-text-primary` headings with `aiux-divider` between sections. |
| S-03 | Form container correct                | § 6.1 Form Container      | Outer wrapper has `flex flex-col gap-4`.                                                                                                                                                                                        |
| S-04 | Field grid correct                    | § 6.4 Field Grid          | Each section's field area uses `grid grid-cols-{N} gap-3 @max-md:grid-cols-1` where N = 1 or 2.                                                                                                                                 |
| S-05 | Column count is 1 or 2                | § 6.11 Constraints        | No `grid-cols-3` or higher. Forms support exactly 1 or 2 columns.                                                                                                                                                               |
| S-06 | Row column count matches children     | § 6.4 Field Grid          | The `grid-cols-{N}` value matches the actual number of column divs inside the row.                                                                                                                                              |
| S-07 | Full-width fields use `col-span-full` | § 6.5 Full-Width Fields   | Full-width field types (Textarea, StringLong, Html, Journal, MultiTwoLines, MultiSmall, Script, ScriptPlain, Css, Xml, Json, WikiText, TranslatedHtml) have `col-span-full` on the field wrapper div.                           |
| S-08 | No nested forms                       | § 6.11 Constraints        | No `<form>` element is nested inside another `<form>`.                                                                                                                                                                          |
| S-09 | Empty sections hidden                 | § 6.11 Constraints        | Sections with no visible fields after filtering are not rendered as empty containers.                                                                                                                                           |
| S-10 | Single section rule                   | § 3.4 Single Section Rule | If only one section exists, use flat variant with no section header or divider.                                                                                                                                                 |
| S-11 | Footer action set roles correct       | § 6.14 Footer Action Set  | Dismissive and Secondary buttons use `aiux-btn-secondary` (never `aiux-btn-ghost`, `aiux-btn-neutral`, `aiux-btn-soft`, or `aiux-btn-outline`). Destructive uses `aiux-btn-error`, positioned far-left.                         |

### Field structure checks

| #    | Check                                                    | Spec section      | Description                                                                                                                                               |
| ---- | -------------------------------------------------------- | ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F-01 | Every field has `aiux-fieldset` + `aiux-fieldset-legend` | § 4 Patterns      | Each field is wrapped in `<fieldset class="aiux-fieldset">` with a `<legend class="aiux-fieldset-legend">` as its first child.                            |
| F-02 | Every fieldset has exactly one control                   | § 4 Patterns      | Each `<fieldset>` contains exactly one form control (`<input>`, `<select>`, `<textarea>`, or composite control).                                          |
| F-03 | No unlabeled fields                                      | § 8 Accessibility | Every form control has a visible label via `aiux-fieldset-legend`. No `aria-label` as substitute for visible text unless the label is visually redundant. |
| F-04 | No placeholder-only labels                               | § 7 Content Rules | Placeholder supplements, never replaces, the visible label.                                                                                               |
| F-05 | Required/Optional indicators mutually exclusive          | § 7 Content Rules | Each field shows at most one indicator. Required uses `required` + asterisk with `aria-label="Required"`. Optional uses `(Optional)` text.                |

### Container context checks

| #    | Check                                  | Spec section                | Description                                                                                                                                                                             |
| ---- | -------------------------------------- | --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C-01 | Container category identified          | § 6.12 Container Categories | Page body, modal, panel, stepper, or card.                                                                                                                                              |
| C-02 | Variant appropriate for container      | § 3.1 Container Guidance    | Tabs not used in narrow containers (panels, small widgets). Flat or accordion preferred for constrained spaces.                                                                         |
| C-03 | Tab overflow handled                   | § 6.11 Constraints          | If tab labels would exceed container width, accordion is used instead. Developer decision at build time.                                                                                |
| C-04 | Stepper forms use flat                 | § 6.12 Container Categories | Forms inside stepper steps use flat variant — each step is already a logical section.                                                                                                   |
| C-05 | Standalone form uses `aiux-card` shell | § 6.12 Container Categories | A form with no other container context (page/modal/panel) uses `aiux-card` + `aiux-card-body` for its shell — not a hand-rolled `<div>` with manual radius/shadow/background utilities. |

### Layout checks

| #    | Check                                 | Spec section                | Description                                                                                                                                                    |
| ---- | ------------------------------------- | --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| L-01 | No padding on grid cells or fieldsets | § 6.4 Field Grid            | Spacing comes from flex/grid gap only. No `p-*` classes on field wrappers or `<fieldset>`.                                                                     |
| L-02 | No margin between grid children       | § 6.4 Field Grid            | Uses gap, not margins between fields.                                                                                                                          |
| L-03 | Responsive collapse present           | § 6.4 Field Grid            | ⚠️ **Not yet shipped.** Every multi-column row includes `@max-md:grid-cols-1` for mobile collapse. Container query responsive behavior is not yet implemented. |
| L-04 | Consistent field sizes                | § 6.4 Field Grid            | All fields within a form use the same size class (`*-sm` or `*-md`). No mixing.                                                                                |
| L-05 | Logical properties used (RTL)         | § 8 Accessibility           | No physical direction classes (`text-left`, `ml-*`, `pr-*`, `float-left`, `left-*`). All use logical equivalents.                                              |
| L-06 | Vertical ordering correct             | § 6.2 Vertical Ordering     | Form-level messages appear above the layout variant region.                                                                                                    |
| L-07 | First section display correct         | § 6.3 First Section Display | When enabled, first section renders as flat content above the variant region.                                                                                  |

### State checks

| #    | Check                                     | Spec section             | Description                                                                              |
| ---- | ----------------------------------------- | ------------------------ | ---------------------------------------------------------------------------------------- |
| A-01 | Read-only uses `readonly`, not `disabled` | § 5.1 Edit Mode Mappings | Read-only fields remain focusable and included in form submission.                       |
| A-02 | Disabled and readonly mutually exclusive  | § 5.1 Edit Mode Mappings | No control has both `readonly` and `disabled`.                                           |
| A-03 | Invalid fields have correct ARIA          | § 8 Accessibility        | `aria-invalid="true"` + `aria-describedby` pointing to the error message element's `id`. |
| A-04 | Required fields have correct attributes   | § 8 Accessibility        | Both `required` and `aria-required="true"` present on the control.                       |
| A-05 | Empty read-only fields show em dash       | § 5.1 Edit Mode Mappings | Read-only fields with no value display — (em dash), not blank space or "N/A".            |
| A-06 | Loading state correct                     | § 6.10 Loading State     | `.form-loading` class on form container + `aria-busy="true"` on `<form>` when loading.   |

### Message checks

| #    | Check                                           | Spec section              | Description                                                                                                                          |
| ---- | ----------------------------------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| M-01 | Field-level messages placed correctly           | § 6.7 Form-Level Messages | Messages appear below the field wrapper with severity-appropriate class (`text-error`, `text-warning`, `text-success`, `text-info`). |
| M-02 | Field-level errors linked via ARIA              | § 8 Accessibility         | Invalid fields have `aria-describedby` pointing to the message element's `id`.                                                       |
| M-03 | Form-level messages use correct alert classes   | § 6.7 Form-Level Messages | `aiux-alert aiux-alert-error`, `aiux-alert aiux-alert-warning`, `aiux-alert aiux-alert-info`, or `aiux-alert aiux-alert-success`.    |
| M-04 | Form-level messages positioned above field grid | § 6.2 Vertical Ordering   | Alerts appear at the top of the form, before the layout variant region.                                                              |
| M-05 | Severity-appropriate live region role           | § 8 Accessibility         | Error and warning messages use `role="alert"` (assertive). Info and success messages use `role="status"` (polite).                   |
| M-06 | Message priority ordering correct               | § 6.7 Form-Level Messages | `mandatoryError` and `fieldError` sort to the top.                                                                                   |

### Semantic checks

| #    | Check                           | Spec section                       | Description                                                                                                                                             |
| ---- | ------------------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| V-01 | Only valid DaisyUI classes used | § 2.1 Three Variants, § 4 Patterns | Form controls use correct base classes. Layout variant uses correct DaisyUI classes.                                                                    |
| V-02 | No forbidden patterns           | § 6.11 Constraints                 | No padding on fieldsets, no margin on grid children, no physical direction classes, no positive `tabindex` values, no nested forms, no 3+ column grids. |
| V-03 | Tab order follows DOM order     | § 8.3 General                      | No `tabindex` value greater than 0 anywhere in the form.                                                                                                |

### Content checks

| #    | Check                                                                             | Spec section      | Description                                                 |
| ---- | --------------------------------------------------------------------------------- | ----------------- | ----------------------------------------------------------- |
| T-01 | Section titles are noun phrases                                                   | § 7 Content Rules | Sentence case, no trailing punctuation, no action verbs.    |
| T-02 | Field labels describe expected input                                              | § 7 Content Rules | Not the action of filling in the field.                     |
| T-03 | No placeholder used as sole label                                                 | § 7 Content Rules | Placeholder supplements, never replaces, the visible label. |
| T-04 | Empty `display-only` fields show em-dash; empty `inline` fields hidden by default | § 7 Content Rules | Not blank space or "N/A".                                   |

---

## Resolution Guidance

### C-02: Wrong layout variant for container

If tabs are used in a narrow container (panel, small widget), suggest switching to accordion or flat. See § 3.1 Container Guidance for the recommendation table.

### S-02: Accordion section missing correct classes

Each accordion section must use `aiux-collapse aiux-collapse-arrow border border-base-300`:

```html
<!-- Before (wrong) -->
<div class="aiux-card">
  <h3>Section Title</h3>
  <div><!-- fields --></div>
</div>

<!-- After (correct) -->
<div class="aiux-collapse aiux-collapse-arrow border border-base-300">
  <h3>
    <button class="aiux-collapse-title font-semibold">Section Title</button>
  </h3>
  <div class="aiux-collapse-content">
    <fieldset>
      <legend class="sr-only">Section Title</legend>
      <div class="grid grid-cols-2 gap-3 @max-md:grid-cols-1">
        <!-- fields -->
      </div>
    </fieldset>
  </div>
</div>
```

### L-03: Missing `@max-md:grid-cols-1` on multi-column row

> ⚠️ **Not yet shipped.** Container query responsive collapse is not yet implemented. Include the class for forward-compatibility but do not flag its absence as a blocking issue.

```html
<!-- Before (wrong) -->
<div class="grid gap-3 grid-cols-2">...</div>

<!-- After (correct) -->
<div class="grid gap-3 grid-cols-2 @max-md:grid-cols-1">...</div>
```

### L-01: Padding on field wrappers or fieldsets

Remove `p-*` classes. All spacing comes from flex/grid gap. See § 6.4 Field Grid.

### F-01: Field missing `aiux-fieldset` + `aiux-fieldset-legend`

```html
<!-- Before (wrong) -->
<label>Name</label>
<input type="text" class="aiux-input w-full" />

<!-- After (correct) -->
<fieldset class="aiux-fieldset">
  <legend class="aiux-fieldset-legend">Name</legend>
  <input type="text" class="aiux-input w-full" />
</fieldset>
```

### A-01: Read-only field using `disabled` instead of `readonly`

Replace `disabled` with `readonly`. Readonly keeps the field focusable and included in form submission. See § 5.1 Edit Mode Mappings.

### A-03: Invalid field missing ARIA attributes

Add `aria-invalid="true"` and `aria-describedby` pointing to the error message's `id`:

```html
<fieldset class="aiux-fieldset">
  <legend class="aiux-fieldset-legend">Email</legend>
  <input
    type="email"
    class="aiux-input aiux-input-error w-full"
    aria-invalid="true"
    aria-describedby="email-error"
  />
  <div class="mt-1">
    <div id="email-error" class="text-xs py-1 text-error">
      Invalid email format
    </div>
  </div>
</fieldset>
```

### L-05: Physical direction classes used

Replace with logical property equivalents. See § 8 Accessibility for the full mapping table.

| Found                        | Replace with                |
| ---------------------------- | --------------------------- |
| `text-left` / `text-right`   | `text-start` / `text-end`   |
| `ml-*` / `mr-*`              | `ms-*` / `me-*`             |
| `pl-*` / `pr-*`              | `ps-*` / `pe-*`             |
| `float-left` / `float-right` | `float-start` / `float-end` |
| `left-*` / `right-*`         | `start-*` / `end-*`         |

### S-07: Full-width field type not using `col-span-full`

Add `col-span-full` to the field wrapper div for full-width field types. See § 6.5 Full-Width Fields for the complete list.

### L-04: Mixed field sizes within a form

Standardize all fields to the same size. Choose `*-sm` for constrained layouts (modals, side panels) or `*-md` for full-page forms.

### S-08: Nested `<form>` elements

HTML does not allow nested `<form>` elements. Remove the inner `<form>` and use a container `<div>` instead.

### S-06: Column count mismatch

Ensure `grid-cols-{N}` matches the number of column divs inside the row.

### S-05: Three or more columns

Forms support exactly 1 or 2 columns. Split 3-column layouts into 2-column rows or use separate sections. See § 6.11 Constraints.

### M-04: Form-level messages below field grid

Move alerts above the layout variant region — they must be the first children in the form container. See § 6.2 Vertical Ordering.

### S-10: Single section with unnecessary header/divider

When only one section exists, omit the section header and divider. Use flat variant without chrome. See § 3.4 Single Section Rule.

### A-06: Loading state missing `aria-busy`

Add `aria-busy="true"` to the `<form>` element when the form is in loading state. See § 6.10 Loading State.

### S-11: Footer action set button uses wrong class

Dismissive and Secondary roles both map to `aiux-btn-secondary` — never `aiux-btn-ghost` or `aiux-btn-neutral`. See § 6.14 Footer Action Set.

```html
<!-- Before (wrong) -->
<button class="aiux-btn aiux-btn-ghost">Cancel</button>
<button class="aiux-btn aiux-btn-neutral">Save as Draft</button>
<button type="submit" class="aiux-btn aiux-btn-primary">Submit</button>

<!-- After (correct) -->
<button class="aiux-btn aiux-btn-secondary">Cancel</button>
<button class="aiux-btn aiux-btn-secondary">Save as Draft</button>
<button type="submit" class="aiux-btn aiux-btn-primary">Submit</button>
```

### C-05: Standalone form hand-rolls its container shell

Replace a manually-styled `<div>` shell with `aiux-card` + `aiux-card-body`. See § 6.12 Container Categories.

```html
<!-- Before (wrong) -->
<div
  class="w-full max-w-2xl bg-surface-primary rounded-2xl shadow-md overflow-hidden"
>
  <form>...</form>
</div>

<!-- After (correct) -->
<div class="aiux-card bg-surface-primary w-full max-w-2xl">
  <form class="aiux-card-body">...</form>
</div>
```
