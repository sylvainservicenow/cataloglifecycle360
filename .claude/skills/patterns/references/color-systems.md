# Color Systems

Three independent color palettes for communicating meaning across components.

---

## Status palette

Use status colors when the value represents **urgency, severity, or operational state** — open, closed, in progress, critical, resolved. Status colors carry semantic weight: users learn to associate red with errors and green with success. Misusing a status color for a non-status label erodes that association.

### Levels

| DaisyUI class              | Use when                                                         |
| --------------------------- | ---------------------------------------------------------------- |
| `aiux-{component}-error`   | Something failed or needs immediate attention                    |
| `aiux-{component}-warning` | A potential problem the user should be aware of                  |
| `aiux-{component}-info`    | Noteworthy information with no positive or negative sentiment    |
| `aiux-{component}-neutral` | Low-priority status that doesn't need attention — "draft", "N/A" |
| `aiux-{component}-success` | An action completed successfully or a positive state             |

---

## Brand extensions

> **PENDING:** More details will be added once there are more confirmed use cases.

- **`aiux-{component}-primary`** — brand-related content. Use for any element tied to the product identity (branded callouts, brand-emphasized badges, feature highlights).
- **`aiux-{component}-accent`** — GenAI-related content. Use for AI-generated content, AI insights, and AI-related indicators.
- **`aiux-{component}-secondary`** — use when a second brand-toned element needs to be visually distinct from primary.

---

## Category palette

> **PENDING:** Not yet available. DaisyUI does not provide enough distinct semantic colors for the 18+ visually distinct categories this palette requires. The existing implementation uses raw Tailwind utility classes scoped to the list component. A platform-level solution (custom DaisyUI-style classes or Tailwind theme extension) is needed before this palette can be used by agents.

Use category colors when the value represents **classification, type, or grouping** with no urgency implied — department labels, tag categories, asset types. Category colors distinguish items visually without signaling that something is wrong or needs attention.

---

## Decision guide

| Question                                                                | Answer                                       |
| ----------------------------------------------------------------------- | -------------------------------------------- |
| Does the color communicate urgency, severity, or operational state?     | Status palette                               |
| Does the color classify, group, or categorize without implying urgency? | Category palette                             |
| Is this brand-related content?                                          | `aiux-{component}-primary` — see Brand extensions |
| Is this GenAI-related content?                                          | `aiux-{component}-accent` — see Brand extensions  |
