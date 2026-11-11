# Textarea

**DaisyUI base:** `textarea` (prefixed `aiux-textarea`)
**Production component:** None — native `<textarea>` + `aiux-textarea` classes. For a character counter, auto-resize cap, or styled read-only, use `<aiux-control-textarea>` (`@servicenow/aiux-components-control`).
**Last updated:** 2026-07-02 · v3

---

## Design Spec

<!-- SPEC ZONE: Design intent only. An agent generating UI reads this section.
     All styling uses Tailwind utility classes and DaisyUI component classes.
     No CSS custom properties, no override tables.
     Target: ≤ 2,000 tokens. -->

### 1. Component distinction

Textarea is a **multi-line text input** — the entered content is submitted as part of a form or record. This is the key distinction:

| Need                                                        | Component                    | Why                                                                 |
| ----------------------------------------------------------- | ---------------------------- | ------------------------------------------------------------------- |
| Multi-line, open-ended text (comments, notes, descriptions) | **Textarea**                 | Free-form composition across multiple lines                         |
| Single-line structured input (name, email, phone)           | **Input**                    | One line is sufficient; structured format expected                  |
| Journal entries with rich text, tabs, record context        | **Activity stream compose**  | Includes rich text editor, journal field navigation, record context |
| Structured data (dates, selections)                         | **Appropriate form control** | Textarea is for free text, not constrained values                   |

Do not use textarea when a single line of input is sufficient — use input instead. Do not use textarea for journal entry posting — use activity stream compose.

### 2. Sizing and variant

**Size — a density decision, not a controlled scale.** Figma does not model a textarea size dimension; size follows the surrounding layout density and is governed by the form composition. Use the default `aiux-textarea` for standard forms and `aiux-textarea-sm` for dense record/form layouts (the common production choice). `aiux-textarea-{xs,md,lg}` also exist in the class family — pick by density, do not gate on this sheet.

**Variant:**

- **Default** — a bare `aiux-textarea`.
- **Ghost** — `aiux-textarea-ghost` removes the border and background until focus. Use for inline-editing contexts where the field blends into surrounding content until interacted with.
- **AI** — `aiux-textarea-accent` for AI-generated / AI-completed content (the "ai completed" state in Figma).

The other color classes (`neutral`, `primary`, `secondary`, `info`, `success`, `warning`) are outside the current Figma scale — do not use them. The invalid state uses `aiux-textarea-error` (see §5).

### 3. Anatomy

Built on the native `<textarea>` + `aiux-textarea`, these parts are buildable today:

- **Label** — always visible. Describes the expected input. Truncate with ellipsis + tooltip on overflow (`@patterns/references/truncation-tooltip.md`).
- **Help text (optional)** — descriptive text below the control; small tertiary text.
- **Placeholder** — a format hint shown until the user types (not a substitute for the label).

**Label — must match `<aiux-control-textarea>`'s rendered output exactly**, not an independent style choice. The source of truth is `components/controls/src/base/utils/render-form-field-label.ts`; if that file's output differs from the snapshot below, the file wins:

- The `<label>` element itself carries `aiux-label text-sm` — never `font-semibold` on the label.
- The label text sits in its own inner `<span>` with `font-normal text-text-primary` (`text-error` instead of `text-text-primary` when the field is invalid).

**Field layout:** Vertical (label above the field) is the default. Horizontal (label beside the field) is available for dense forms and record views. The form composition spec governs which orientation to use by context.

#### Features NOT in the native control — no shared class, use `<aiux-control-textarea>`

The Figma library shows a plain textarea; these richer behaviors are **not** producible with native `<textarea>` + `aiux-textarea` classes. They live in the `<aiux-control-textarea>` component (or require a custom build), so treat them as out of scope for the bare class:

- **Character counter** — characters entered / remaining (counts down against a limit). `<aiux-control-textarea>` provides `showCounter` / `maxlength`.
- **Auto-grow** — height expands as the user types, capped at a max row count. Provided by `<aiux-control-textarea>`.
- **Label slots** (label-inline / label-end / label-start), **information-button popover**, and **field-start icon slot** (e.g. an AI-content indicator).

### 4. Resize behavior

Resize is a **native / production behavior, not a Figma decision** — the Figma library cannot express it. The browser-generated resizer sits at the block-end inline-end corner; control it with the native CSS `resize` value:

| Mode                   | Behavior                                       |
| ---------------------- | ---------------------------------------------- |
| **Vertical (default)** | User drags the end edge to resize height       |
| **Horizontal**         | User drags the inline-end edge to resize width |
| **Both**               | User can resize in both directions             |
| **None**               | Resizing is not permitted                      |

For content of unpredictable length, prefer **auto-grow** (height expands as the user types, capped at a max row count) via `<aiux-control-textarea>` rather than a manual resizer.

### 5. States

Default, hover, focus, view-only (read-only), disabled, and invalid must all be accounted for. Hover and focus are rendered by `aiux-textarea` automatically (focus ring is brand-colored, or error-colored in the invalid state). The decisions that are yours:

- **Invalid** — apply `aiux-textarea-error`. Write a specific message below the field describing the actual error and how to fix it — never a generic "Required field". The message renders as an inline alert (`aiux-alert aiux-alert-soft aiux-alert-error`, `role="alert"`, with a status icon), not a bare line of red text — see `@patterns/references/error-and-validation.md` for the full class/icon mapping.
- **Disabled** — use the native `disabled` attribute (not a class) so the control is also removed from interaction. `aiux-textarea` renders the muted disabled background.
- **View-only / read-only** — use the native `readonly` attribute. ⚠️ `aiux-textarea` has **no read-only styling** (only `:disabled` is themed), so a bare `<textarea readonly>` renders like a default field, not the Figma muted "view only" treatment. For a correctly styled read-only field use `<aiux-control-textarea>`.

### 6. Required and optional indicators

Same rule as §3 — reproduce `<aiux-control-textarea>`'s rendered output, not an independent style choice. `render-form-field-label.ts` is authoritative if it diverges from this snapshot:

- Required fields show an asterisk after the label, rendered as an **icon** (`icon({name: 'asterisk'})`), not the literal `*` character. It sits in a span with `aria-label="Required"` and a native `title="Required"` (not a JS tooltip). Color is neutral (`text-base-content`) by default and switches to `text-error` only when the field is invalid.
- Optional fields show "Optional" text next to the label at `text-sm opacity-60` (also `text-error` when invalid).
- Do not use both indicators on the same field.
- When most fields are required, mark only the optional ones. When most are optional, mark only the required ones.

### 7. Content rules

- Labels describe the expected input: "Description", "Work notes". Not "Enter your description" or noun-only labels without context.
- Placeholder text provides a format hint or guidance on expected input — not a repeat of the label. Placeholder disappears when the user begins typing; do not rely on it to convey required information.
- Invalid messages use past tense and tell the user how to fix the problem. Never blame the user.
- Field helper text (in the info popover) uses present tense since it appears before input.
- Sentence case for labels: "Work notes" not "Work Notes".

### 8. Accessibility

Follow `@accessibility` for project-wide accessibility requirements. Component-specific routing:

- **DaisyUI corrections:** See `@accessibility` › Textarea (explicit `<label for="id">`, never implicit; icon-only label uses `aria-label`; helper / error text wired via `aria-describedby`)
- **Validation messages:** See `@patterns/references/error-and-validation.md`
- **Forced colors:** Follows the **field** pattern. Exception: the resize handle uses `GrayText` when disabled. See `@accessibility`

**Horizon-specific design notes:**

- **Character limit:** When a character counter is shown, associate it with the textarea via `aria-describedby` so screen readers announce the remaining count.

### 9. Scope boundary

This sheet covers individual textarea decisions: when to use textarea vs. other components, sizing, resize behavior, states, and accessibility. It does not govern:

- **How textareas arrange in forms** — defined by form composition specs.
- **Spacing, alignment, and column layout of form fields** — form composition specs.
- **When to use textarea vs. input vs. activity stream compose in a specific form context** — form composition guidance.
- **@mention behavior or rich text features** — those are activity stream compose capabilities, not textarea.

The referencing direction is one-way: composition specs reference this sheet for individual textarea rules; this sheet does not reference composition specs.
