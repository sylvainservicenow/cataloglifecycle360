# Avatar

**DaisyUI base:** `avatar` (`aiux-avatar` prefix)
**Production component:** None — composed from the `aiux-avatar` class family (defined in `components/core/src/styles/tailwind.css`)
**Last updated:** 2026-07-02 · v3

---

## Design Spec

<!-- SPEC ZONE: Design intent only. An agent generating UI reads this section.
     All styling uses Tailwind utility classes and DaisyUI component classes.
     No CSS custom properties, no override tables.
     Target: ≤ 2,000 tokens. -->

### 1. When to use

Use avatar to represent a person or entity in the interface. Avatars appear in record headers, activity streams, assignment fields, comment threads, and list rows where user identity adds meaningful context.

Do not use avatar purely as decoration when the user identity is not relevant to the content. Do not use avatar for non-person entities (use icons or badges instead).

### 2. Anatomy

The `aiux-avatar` class wraps an image or placeholder element. The avatar container controls shape and sizing; content inside determines the visual representation.

| Element              | Implementation                                                | Purpose                                               |
| -------------------- | ------------------------------------------------------------- | ----------------------------------------------------- |
| **Avatar wrapper**   | `<div class="aiux-avatar">`                                   | Outer container. Controls shape.                      |
| **Inner element**    | `<div>` with size + `rounded-full`                            | Sized container for the image or initials.            |
| **Image**            | `<img>` inside the inner element                              | Photo representation. Requires `alt` text.            |
| **Initials**         | `aiux-avatar aiux-avatar-placeholder` wrapper + `<span>` text | Letter-based fallback when no image is available.     |
| **Placeholder**      | `aiux-avatar aiux-avatar-placeholder` wrapper + icon/empty    | Generic silhouette when no identity data exists.      |
| **Overflow counter** | `<span>` with "+N" text inside inner element                  | Shows count of additional avatars in a group context. |

### 3. Fallback chain

Avatars follow a defined fallback hierarchy when the preferred representation is unavailable:

1. **Photo image** -- user-uploaded profile photo
2. **Initials** -- derived from the user's name (first letter of first name + first letter of last name)
3. **Placeholder** -- generic silhouette icon via `aiux-avatar-placeholder`

Display the highest-priority representation available. Both initials and anonymous placeholders require `aiux-avatar-placeholder` on the wrapper — this is what enables `flex items-center justify-center` on the inner div. Without `placeholder`, DaisyUI forces `display: block` on the inner div, which breaks centering. Use a contrasting background for initials (e.g., `bg-secondary text-secondary-content` or `bg-neutral text-neutral-content`).

### 4. Sizing

Five named sizes, confirmed against the Figma avatar component:

| Size name | Size class  | Dimension | Typical context                                 |
| --------- | ----------- | --------- | ----------------------------------------------- |
| **sm**    | `w-5 h-5`   | 20px      | Dense list rows, inline mentions, pill tags.    |
| **md**    | `w-6 h-6`   | 24px      | Compact lists, secondary metadata.              |
| **lg**    | `w-8 h-8`   | 32px      | Comment threads, presence indicators.           |
| **xl**    | `w-10 h-10` | 40px      | Record headers, assignment fields, form fields. |
| **2xl**   | `w-12 h-12` | 48px      | Activity stream items, profile panels.          |

The default size is **xl** (`w-10 h-10`, 40px). Do not use 2xl avatars in dense data contexts -- they create visual imbalance. DaisyUI does not provide named size classes for avatar; use Tailwind width/height utilities on the inner element.

### 5. Shape

Avatars are always circular — confirmed against Figma. Apply `rounded-full` to the inner element. The class family also exposes non-circular `aiux-mask-{squircle,heart,hexagon,star,...}` shapes, but these are outside the current Figma scope for avatar — do not use them.

For avatar groups (multiple users displayed together), use `aiux-avatar-group` with `gap-1` (4px) spacing. Avatars sit side by side without overlapping — confirmed against Figma. (`aiux-avatar-group` is an unstyled DaisyUI flex wrapper with no built-in spacing; some DaisyUI references demonstrate it with a negative `-space-x-*` overlap instead, but that is not Horizon's pattern.) Limit visible avatars to a contextually appropriate count and show a "+N" count indicator for overflow. Group layout details (max visible count, overflow behavior) are governed by composition specs.

### 6. Interaction modes

Avatars are non-interactive by default: `<div class="aiux-avatar" role="img" aria-label="...">`, not focusable. No confirmed production usage wraps an avatar in a `<button>` or `<a>` — if a future surface needs an interactive avatar, confirm the pattern against Figma and production before generating one.

### 7. Presence indicator

Avatars can display a presence status dot using the `aiux-avatar-{available,away,busy}` classes — all three are natively supported, matching Figma's three presence states.

| Status        | Class                   | Dot color             |
| ------------- | ----------------------- | --------------------- |
| **Available** | `aiux-avatar-available` | `bg-success` (green)  |
| **Away**      | `aiux-avatar-away`      | `bg-warning` (orange) |
| **Busy**      | `aiux-avatar-busy`      | `bg-error` (red)      |

The class family also exposes generic `aiux-avatar-online`/`aiux-avatar-offline` (DaisyUI's native binary indicator) — outside current Figma scope for avatar; use the three named classes above instead.

The dot is positioned at the lower-inline-end corner of the avatar. In RTL layouts, the dot position mirrors to the lower-inline-start corner. Presence state needs a text alternative -- include the status in the image `alt` text (e.g., `alt="Jane Doe, available"`) or use a separate visually hidden element.

### 8. Content rules

- Initials use the first letter of the first name and the first letter of the last name. For compound names (e.g., hyphenated last names), use only the first initial of each name segment.
- The avatar does not include a name label. Pair with a text element when the user's name must be visible alongside the avatar.
- In tagging pills, use sm (`w-5 h-5`, 20 px) or md (`w-6 h-6`, 24 px) size avatars.
- Do not place two avatars side by side without a visual separator -- use the `aiux-avatar-group` pattern for displaying multiple users.

### 9. Accessibility

Follow `@accessibility` for project-wide accessibility requirements. Component-specific routing:

- **DaisyUI corrections:** See `@accessibility` › Avatar with Presence
- **Forced colors:** Non-interactive avatars follow the **container** pattern (preserve image with `forced-color-adjust: none` on `<img>`); interactive avatars also follow the **interactive** pattern for focus/hover — see `@accessibility` › Avatar

**Horizon-specific design notes:**

- **Presence state** must not rely on color alone — include the presence description in the `alt` text (e.g., `alt="Jane Doe, available"`) or in a visually hidden equivalent.

- **Focus-visible:** Use `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary`.

### 10. Scope boundary

This sheet covers single-avatar decisions: which size for which context, fallback chain, shape, presence indication, interaction mode, and accessibility requirements. It does not govern:

- **Avatar group layout** (max visible count, "+N" overflow) -- defined by composition specs.
- **Avatar-with-image** (avatar paired with a secondary image) -- separate Figma component with its own sizing scale.
- **How avatars compose into record headers, comment threads, or assignment fields** -- composition specs own assembly rules.
- **Profile popover content triggered by an avatar button** -- the popover composition spec owns that content.

The referencing direction is one-way: composition specs reference this sheet for individual avatar rules; this sheet does not reference composition specs.
