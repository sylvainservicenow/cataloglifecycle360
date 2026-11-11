# Label Value

**DaisyUI base:** none -- custom utility component; closest structural analog is a definition list (`<dl>`)
**Last updated:** 2026-07-04 · v4

---

## Design Spec

<!-- SPEC ZONE: Design intent only. An agent generating UI reads this section.
     All styling uses Tailwind utility classes and DaisyUI component classes.
     No CSS custom properties, no override tables.
     Target: ≤ 2,000 tokens. -->

### 1. Purpose and when to use

Label value pairs a field label with its corresponding value in record views, card bodies, and detail sections. It is a **read-only display** component -- it shows data, it does not collect it. Use input, select, or other form controls for data collection.

This is one of the most frequently used patterns in workspace UIs. Nearly every record header, card body, and detail section uses label-value pairs to surface structured record data.

### 2. Layout variants

Two layout variants control how the label and value relate spatially.

| Variant     | Layout                           | Use when                                                                                        |
| ----------- | -------------------------------- | ----------------------------------------------------------------------------------------------- |
| **Inline**  | Label and value on a single line | Compact display with sufficient inline space; short labels and short values                     |
| **Stacked** | Label above value on two lines   | Record detail sections, contextual sidebars, card bodies, constrained inline space, long values |

**Decision rule:** If inline space is sufficient and content is short, use inline. If content is detailed, labels or values are longer, or inline space is limited, use stacked.

- Do not use inline when inline space is limited -- wrapping or truncation hurts readability.
- If multiple inline pairs are present, place each pair on its own line; placing pairs side-by-side makes it hard to match labels to values.

### 3. Value types

Label value supports multiple value types beyond plain strings.

| Value type            | Notes                                                     |
| --------------------- | --------------------------------------------------------- |
| **String**            | Plain text -- most common                                 |
| **Highlighted value** | Renders with status or category color treatment           |
| **Text link**         | Renders as a clickable hyperlink                          |
| **Rich content**      | Custom rendered content (component or markup in the slot) |

When using rich content values, truncation is not supported -- the component cannot truncate rendered content. Accessibility for interactive elements within rich content values requires additional consideration.

### 4. Content rules

- **Labels:** Use noun phrases in sentence case: "Assignment group", "Resolution notes". Not "assignment group" or "Assignment Group".
- **Inline labels:** Past-tense verbs are acceptable when the label describes a state that has occurred ("Assigned to", "Resolved by", "Updated on").
- Keep labels short to avoid wrapping in inline layout.
- If the value is unknown or empty, display an em dash (—) rather than leaving the field blank.
- Sentence case for all text: "Email address" not "Email Address".

**Previous value ("was" label):** A "was" label can show the previous value alongside the current one. Used in change records and audit contexts to show what a field value was before it was updated. The previous value uses past-tense phrasing ("was [value]").

**Delimiters:** When a single label-value component displays multiple values, they are separated by a delimiter. `⚠️ Not yet shipped. See Figma for design reference.`

| Delimiter | Use when                                            |
| --------- | --------------------------------------------------- |
| Comma     | General lists of values                             |
| Pipe      | Values need stronger visual separation              |
| Slash     | Paired or ratio values (e.g., "3/5 tasks complete") |

### 5. Truncation and overflow

**Inline:** Truncation can be configured but should be avoided -- it creates a disjointed experience. Only use truncation when the value length is genuinely unknown and the container is fixed-width. Reference `@patterns/references/truncation-tooltip.md`.

**Stacked:** Avoid truncation. When multiple values do not fit on one line, line breaks occur after each delimiter and values wrap to the next line. This is the preferred behavior over truncation.

When truncation is active and the OS accessibility preference "Enable keyboard focus on text that displays a tooltip" is on, truncated content becomes focusable and reveals the full text via tooltip.

### 6. Sizing and spacing

**Minimum width:** A minimum width can be configured to prevent labels from becoming too narrow to read. Set this when label-value pairs appear in variable-width containers. `⚠️ Not yet shipped. See Figma for design reference.`

**Size:** Two sizes; the label and value always share the same size within one pair — never mix `text-xs` and `text-sm` on the label vs. the value.

| Size           | Label + value class | Rendered size |
| -------------- | ------------------- | ------------- |
| `sm`           | `text-xs`           | 12px          |
| `md` (default) | `text-sm`           | 14px          |

**Typography:**

- Labels use `text-text-secondary`, sized per the table above.
- Values use `text-text-primary`, sized per the table above, at normal weight — do not add `font-medium`/`font-semibold` to the value. Figma's Code Connect implementation confirms this: `<dd class="text-text-primary m-0 text-sm">`, no font-weight class.
- Highlighted values inherit the appropriate status or category color from `@patterns/references/color-systems.md`.

### 7. States

Label value is a display-only component. Its state set is minimal compared to interactive components.

| State       | Treatment                                                                                                                                                              |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Default** | Label in `text-text-secondary`, value in `text-text-primary`.                                                                                                          |
| **Empty**   | Value slot displays an em dash (—) in `text-text-secondary` — the same color as the label, since a placeholder should not read as more prominent than an actual value. |
| **Loading** | Skeleton placeholder matching the label and value dimensions.                                                                                                          |

### 8. Accessibility

Follow `@accessibility` for project-wide accessibility requirements. Component-specific routing:

- **Forced colors:** Follows the **container** pattern — see `@accessibility`

**Horizon-specific design notes:**

- **Markup:** Use a definition list (`<dl>`) with `<dt>` for the label and `<dd>` for the value — this provides the strongest semantic relationship for assistive technology. Multiple pairs go inside a single `<dl>` with alternating `<dt>`/`<dd>`.

  ```html
  <dl>
    <dt class="text-text-secondary text-sm">Assignment group</dt>
    <dd class="text-text-primary">Service Desk</dd>
  </dl>
  ```

- **Text link values:** Use a real `<a>` element inside the `<dd>` with descriptive link text — not "click here" or a raw URL.
- **Rich content values:** Any interactive element inside the value slot must have an accessible name and be keyboard-reachable.
- **Truncated text** must be keyboard-focusable and show the full text in a tooltip on focus — see `@patterns/references/truncation-tooltip.md`.

### 9. RTL

Labels and values flip in RTL. In inline layout, the label moves to the inline-end side and the value moves to the inline-start side. Text alignment inherits from document direction. Delimiters remain in their logical positions.

### 10. Scope boundary

This sheet covers individual label-value pair decisions: which layout variant, which value type, content conventions, truncation rules, and accessibility requirements. It does not govern:

- **How label-value pairs arrange in record headers or card bodies** -- defined by composition specs.
- **Spacing, alignment, and column layout of label-value groups** -- form and record composition specs.
- **When to use label-value vs. editable input** -- selection guidance lives in the form composition spec.
- **Hover-to-edit affordances** -- if a value needs to become editable on hover (a pencil icon that reveals on `:hover`/`:focus-visible` and enters edit mode on click), that is not this component. Use the edit-on-demand pattern (`components/controls/src/base/utils/inline-view.ts`, `.edit-on-demand__trigger`) on the actual field markup instead of adding an edit affordance to a `<dl>`.

The referencing direction is one-way: composition specs reference this sheet for individual label-value rules; this sheet does not reference composition specs.
