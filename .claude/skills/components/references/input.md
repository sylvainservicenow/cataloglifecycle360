# Input

**DaisyUI base:** `input`
**Production component:** None — native `<input>` + `aiux-input` classes
**Last updated:** 2026-07-04 · v3

---

## Design Spec

<!-- SPEC ZONE: Design intent only. An agent generating UI reads this section.
     All styling uses Tailwind utility classes and DaisyUI component classes.
     No CSS custom properties, no override tables.
     Target: ≤ 2,000 tokens. -->

### 1. Subtypes

One base component covers several input types. Each shares the same slot system and states but has subtype-specific behavior.

| Subtype      | HTML type         | Behavior                                       |
| ------------ | ----------------- | ---------------------------------------------- |
| **Text**     | `type="text"`     | General free-form text entry                   |
| **Password** | `type="password"` | Masked entry                                   |
| **Phone**    | `type="tel"`      | Phone number entry; numeric keyboard on mobile |
| **URL**      | `type="url"`      | URL entry                                      |

A governed `<aiux-control-input>` component exists (`@servicenow/aiux-components-control`), but it is not the Figma-aligned pattern (Figma's own Code Connect maps to the class-family markup above) and has no production adoption — use the native `<input>` + class-family pattern, not the component.

### 2. Sizing

| Context                                | Size class | Rationale                                              |
| -------------------------------------- | ---------- | ------------------------------------------------------ |
| Default forms, modals, panels          | `input-md` | Standard emphasis. Default size.                       |
| Constrained layouts, dense data tables | `input-sm` | Compact; accounts for labels and decorators in layout. |

The default size is `input-md`. Size choice should account for the expected length of input including labels and decorators. `aiux-input-xs`/`aiux-input-lg` exist in the safelist but are outside the current Figma-confirmed scale — do not use them.

**Color** — the field is the default (a bare `aiux-input`); the invalid state uses `aiux-input-error` (see §4). Figma also shows an AI-completed accent treatment, but `aiux-input-accent` currently renders identically to the default state due to a CSS bug — do not use it until fixed. The remaining color classes (`neutral`, `primary`, `secondary`, `info`, `success`, `warning`) are outside the current Figma-confirmed scale — do not use them either.

**Ghost variant:** `input-ghost` removes the border and background in default state, showing them only on focus. Use ghost inputs for inline editing contexts where the field should blend into the surrounding content until interacted with.

### 3. Content slots

- **Label** — always visible. Describes the expected input, not the action of filling it in. Truncates with ellipsis on overflow; full text in tooltip on hover. Reference `@patterns/references/truncation-tooltip.md`.
- **Label-inline (optional)** — immediately after the field helper icon; for icons that add context to the label.
- **Label-end (optional)** — far end of the label line; for supplementary icons or indicators.
- **Label-start (optional)** — reserved for a dirty-state indicator dot (see the platform's dirty-state-management system) when the field has unsaved changes; disappears on save.
- **Information button (optional)** — opens a popover with field helper text.
- **Field-start (optional)** — one icon before the field text. Build it by wrapping the icon and `<input>` in a `<label class="aiux-input">` (the icon is a sibling of the `<input>`, not a child of it) — confirmed in production for search/filter icons (e.g. `nav-sidebar/render-filter-input.js`). Render the icon via the `icon()` directive (`@servicenow/aiux-directive-icon`) per `references/icon.md` — never the deprecated `<aiux-icon>` component (one of the two production citations for this pattern uses `<aiux-icon>` and is non-compliant; don't copy that part). No dedicated CSS supports the wrapper layout; add `flex items-center gap-2` on it.
- **Field-end (optional)** — same wrapper pattern, icon after the field text. No confirmed production example yet, but the pattern is symmetric with field-start.

**Field layout:** Vertical (label above the field) is the default. Horizontal (label beside the field) is available for dense forms and record views. The form composition spec governs which orientation to use by context.

Never use placeholder text as a substitute for a label — placeholder disappears on input and is not accessible.

### 4. States

Default, hover, focus, read-only, disabled, invalid. All six must be accounted for.

- **Read-only** — user can select and copy but cannot edit. Uses a muted background to distinguish from editable fields. An empty read-only field displays an em dash (—).
- **Disabled** — user cannot interact with the field. Uses the same muted background as read-only but with reduced opacity on text.
- **Invalid** — label, required indicator, and optional indicator appear in error color. An invalid message appears below the field. Customize the message to describe the specific error and how to fix it — do not use a generic "Required field" message.
- **Focus** — ring uses the brand-colored outline. When the field is in the invalid state, the focus ring uses the error color instead of the brand color.

### 5. Required and optional indicators

- Required fields show an asterisk (\*) after the label.
- The asterisk carries a native `title="Required"` attribute (browser tooltip on hover) — not a JS tooltip component.
- Optional fields show "(Optional)" text next to the label.
- Do not use both indicators on the same field.
- When most fields are required, mark only the optional ones. When most are optional, mark only the required ones.

### 6. Content rules

- Labels describe the expected input: "Email address", "Phone number". Not "Enter your email" or noun-only "Email".
- Placeholder text provides a format hint or example — not a repeat of the label.
- Invalid messages use past tense ("The email address wasn't recognized") and tell the user how to fix the error. Never blame the user.
- Field helper text (in the info popover) uses present tense since it appears before input.
- Sentence case for labels: "Email address" not "Email Address".

### 7. Subtype-specific behavior

**Action button (joined):** Some subtypes (e.g., password) attach a square action button to the field-end using a joined segment layout (`aiux-join`). The button shares the field's continuous border and inherits its state styling (error, disabled, focus ring) — confirmed via the `aiux-join > aiux-input` rules in `tailwind.css`. This is distinct from an icon placed inside the field — the action button is a separate clickable region with its own background.

Beyond the native HTML type (masking, numeric-keyboard hint, URL parsing), phone country-code selection and URL display/edit two-view behavior are not implemented in the `aiux-input` class family. A password show/hide toggle has one real production example (`aia-input.js` in `applications/aia`), but as an independent implementation with its own CSS, not a demonstrated `aiux-input`-class-family pattern; if you build one on `aiux-input`, follow the joined-action-button pattern above with an `aria-label` that describes the toggle's current state ("Show password" / "Hide password").

### 8. Accessibility

Follow `@accessibility` for project-wide accessibility requirements. Component-specific routing:

- **DaisyUI corrections:** See `@accessibility` › Input (explicit `<label for="id">`; never implicit wrapping; icon-only label uses `aria-label`; helper / error text wired via `aria-describedby`)
- **Validation messages:** See `@patterns/references/error-and-validation.md`
- **Forced colors:** Follows the **field** pattern — see `@accessibility`

**Horizon-specific design notes:**

- No APG widget pattern needed — native `<input>` with `<label>` provides full accessibility. Do not add ARIA widget roles.

### 9. RTL

Label aligns right. Field elements and decorator slots flip.

### 10. Scope boundary

This sheet covers individual input decisions: which subtype, which size, slot conventions, labeling, validation states, and accessibility requirements. It does not govern:

- **How inputs arrange in forms** — defined by form composition specs.
- **Spacing, alignment, and column layout of form fields** — form composition specs.
- **When to use input vs. select vs. typeahead** — selection component specs and form composition guidance.

The referencing direction is one-way: composition specs reference this sheet for individual input rules; this sheet does not reference composition specs.
