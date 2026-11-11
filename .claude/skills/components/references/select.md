# Select

**DaisyUI base:** `select` (prefixed `aiux-select`)
**Production component:** None — native `<select>` + `aiux-select` classes
**Last updated:** 2026-06-25 · v2

---

## Design Spec

<!-- SPEC ZONE: Design intent only. An agent generating UI reads this section.
     All styling uses Tailwind utility classes and DaisyUI component classes.
     No CSS custom properties, no override tables.
     Target: ≤ 2,000 tokens. -->

### 1. Component distinction

Select is a **value picker** — the chosen option is submitted as part of a form or record. This is the most important distinction to get right:

| Need                                            | Component              | Why                                        |
| ----------------------------------------------- | ---------------------- | ------------------------------------------ |
| Choose a value from a predefined list           | **Select**             | Form input — value assignment              |
| Trigger an action from a list                   | **Dropdown**           | Action menu — not a form input             |
| Choose from a large dataset (20+ options)       | **Typeahead**          | Filtering/search needed to find the option |
| Choose from a short list (5–6 options or fewer) | **Radio group**        | All options visible for comparison         |
| Binary yes/no choice                            | **Checkbox or toggle** | Select is overkill for two options         |

Do not use dropdown as a styled substitute for select in forms. Do not use select for actions.

### 2. Sizing and color

**Size** — the Figma scale uses two:

| Context                                | Size class       | Rationale                                              |
| -------------------------------------- | ---------------- | ------------------------------------------------------ |
| Default forms, modals, panels          | `aiux-select-md` | Standard emphasis. Default size.                       |
| Constrained layouts, dense data tables | `aiux-select-sm` | Compact; accounts for labels and decorators in layout. |

The default size is `aiux-select-md`. Size choice should account for the label width and the longest option text. `aiux-select-{xs,lg,xl}` exist in the class family but are outside the current Figma scale — do not use them.

**Color** — the field is the default (a bare `aiux-select`); `aiux-select-accent` is used for AI contexts; the invalid state uses `aiux-select-error` (see §4). The other color classes (`ghost`, `primary`, `secondary`, `neutral`, `info`, `success`, `warning`) are outside the current Figma scale — do not use them.

### 3. Anatomy

Built on the native `<select>` + `aiux-select`, these parts are buildable today:

- **Label** — always visible. Describes the expected selection. Truncate with ellipsis + tooltip on overflow (`@patterns/references/truncation-tooltip.md`).
- **Help text (optional)** — descriptive text below the control; small tertiary text.
- **Caret icon** — dropdown indicator at the field-end, provided by the `aiux-select` class.
- **Options** — one `<option>` per choice; keep labels concise.
- **Placeholder option** — a blank/placeholder `<option>` ("Select a value…") when no default selection is appropriate. Do not use the placeholder as a substitute for a label.

The field's visible label is a standard `aiux-label` above the control (not an in-dropdown header).

**Field layout:** Vertical (label above the field) is the default. Horizontal (label beside the field) is available for dense forms and record views. The form composition spec governs which orientation to use by context.

#### Custom-select features — NOT in the native control, no shared component yet

Figma shows richer behaviors that the native `<select>` + `aiux-select` **cannot** produce and that have **no shared governed component** today (only app-specific implementations such as `cb-select`). Treat these as **out of scope** until a shared custom-select / combobox ships:

- Dropdown **search input** for filtering options.
- **Clear (×) icon** that resets the selected value.
- Per-option **selected checkmark** and **option-end slot** (trailing non-interactive icon / badge).
- **Sectioned / grouped options** (category dividers in the dropdown). Native `<optgroup>` exists but is not used in production or shown in Figma — a styled custom version would need the combobox.
- **Label slots** (label-inline / label-end / label-start) and an **information-button popover**.
- **Multi-select** — selected values shown as pills inside the field.
- **Read-only** — native `<select>` does not support the `readonly` attribute (the browser ignores it; only `disabled` works) and `aiux-select` has no read-only styling. To show a non-editable value, render it as static text instead of a select, or use `disabled`. Do not write `<select readonly>`.

If any of these is required, build a custom combobox per the APG Combobox pattern (§8) — they are not available as `aiux-select` features.

### 4. States

Default, hover, focus, disabled, and invalid must all be accounted for. The first four are rendered by `aiux-select` automatically (`disabled` via the native attribute). The two decisions that are yours:

- **Invalid** — apply `aiux-select-error`. Write a specific message below the field describing the actual error — never a generic "Required field".
- **Disabled vs. not** — use the native `disabled` attribute (not a class) so the control is also removed from interaction, not just dimmed.

### 5. Required and optional indicators

- Required fields show an asterisk (\*) after the label.
- Hovering over the asterisk displays a "Required" tooltip.
- Optional fields show "(Optional)" text next to the label.
- Do not use both indicators on the same field.
- When most fields are required, mark only the optional ones. When most are optional, mark only the required ones.

### 6. Content rules

- Option labels use sentence case: "High priority" not "High Priority".
- Include a blank or placeholder option ("Select a value…") when no default selection is appropriate. Do not use the placeholder as a substitute for a label.
- Order options logically: alphabetical, by frequency of use, or by severity/priority — not randomly.
- Keep option text short enough to display without truncation. If options are long, consider typeahead instead.

### 7. Behavior

**Auto-complete:** When the user types characters while the select is focused, the field value updates to match the closest option without opening the dropdown list. This is distinct from typeahead — the list does not open and filter; the field fills silently. Do not replicate this with a typeahead unless filtering behavior is explicitly needed.

**Embedded in input slot:** Select can be embedded within an input field's start or end slot (e.g., a currency selector attached to a number input). When embedded, the select behaves as a sub-control of the parent input and does not display its own independent label.

### 8. Accessibility

Follow `@accessibility` for project-wide accessibility requirements. Component-specific routing:

- **APG pattern:** For custom (non-native) selects, follow Combobox and Listbox — see `@accessibility`. Native `<select>` provides full accessibility on its own.
- **DaisyUI corrections:** See `@accessibility` › Select (explicit `<label for="id">`, never implicit; icon-only label uses `aria-label`)
- **Forced colors:** Follows the **field** pattern — see `@accessibility`

### 9. Scope boundary

This sheet covers individual select decisions: when to use select vs. other components, sizing, option structure, states, and accessibility. It does not govern:

- **How selects arrange in forms** — defined by form composition specs.
- **Spacing, alignment, and column layout of form fields** — form composition specs.
- **When to use select vs. input vs. typeahead in a specific form context** — form composition guidance.

The referencing direction is one-way: composition specs reference this sheet for individual select rules; this sheet does not reference composition specs.
