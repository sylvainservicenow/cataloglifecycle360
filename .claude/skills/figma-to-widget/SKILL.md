---
name: figma-to-widget
description: Converts Figma designs into AIUX widgets using a 4-phase pipeline — extracts blocks from the Figma API, deterministically translates them to Tailwind/DaisyUI/icon mappings, builds a pre-mapped blueprint, and generates the widget code. Triggers when the user provides a Figma URL.
metadata:
  author: servicenow
  version: '1.0.0'
compatibility: Works with Claude Code, Cursor, VS Code Copilot, Windsurf, Gemini CLI, and other Agent Skills-compatible tools
license: MIT
---

# Figma to AIUX Widget

Convert Figma designs into production-ready AIUX widgets using a proven 4-phase pipeline. The key insight: **Phase 2 does 90% of the work deterministically** — by the time the LLM sees the blueprint, all design decisions (colors, spacing, icons, DaisyUI patterns) are already resolved. The LLM only generates the JavaScript component structure and lifecycle logic.

## When to use this skill

- When the user provides a Figma URL (e.g., `https://www.figma.com/design/...` or `https://www.figma.com/file/...`)
- When the user asks to "build a widget from this design"
- When the user pastes a Figma link and asks for implementation
- When the user references a Figma frame, component, or screen to implement

---

## Prerequisites

### Figma Access Token

The Figma REST API requires a personal access token. The user must have `FIGMA_ACCESS_TOKEN` set in their environment.

If no token is available, prompt the user:

```
To fetch your Figma design, I need a Figma personal access token.
You can generate one at: https://www.figma.com/developers/api#access-tokens

Set it in your environment:
  export FIGMA_ACCESS_TOKEN=figd_xxxxx
```

**Never store or log the token in any file.**

### URL Requirements

The Figma URL **must** include a `?node-id=` parameter pointing to a specific frame. If missing, instruct the user: "Right-click the frame in Figma → Copy link to selection."

---

## The 4-Phase Pipeline

```
Phase 1 (Extract)    → Figma API → flat array of blocks with roles, colors, fonts, layout
Phase 2 (Translate)  → Deterministic mapping → Tailwind classes, DaisyUI patterns, icon names, CSS variables
Phase 3 (Blueprint)  → Build pre-mapped blueprint with component tree + stats + requirements
Phase 4 (Generate)   → Feed blueprint to LLM → complete widget code
Phase 5 (Validate)   → Regex checks against AIUX widget standards → errors/warnings/score
```

---

## Phase 1: Figma Extraction

Run the extractor script to fetch and parse the Figma frame:

```bash
FIGMA_ACCESS_TOKEN=${token} node scripts/extract-and-translate.js "${figmaUrl}"
```

If the script is not available, execute the extraction manually:

### 1a. Parse the Figma URL

Extract `fileKey` and `nodeId`:

| URL Pattern                                                  | Fields        |
| ------------------------------------------------------------ | ------------- |
| `https://www.figma.com/design/<fileKey>/<name>?node-id=<id>` | New format    |
| `https://www.figma.com/file/<fileKey>/<name>?node-id=<id>`   | Legacy format |

Convert `node-id` format: replace hyphens with colons (`1-234` → `1:234`).

### 1b. Call Figma API

```bash
curl -s -H "X-Figma-Token: ${FIGMA_ACCESS_TOKEN}" \
  "https://api.figma.com/v1/files/${fileKey}/nodes?ids=${nodeId}&geometry=paths"
```

### 1c. Walk the Node Tree

Traverse depth-first, extracting for each visible node:

**Role Classification:**

| Node Type                                                           | Condition                                      | Role      |
| ------------------------------------------------------------------- | ---------------------------------------------- | --------- |
| `TEXT`                                                              | —                                              | `label`   |
| `RECTANGLE`                                                         | —                                              | `shape`   |
| `VECTOR`, `ELLIPSE`, `POLYGON`, `STAR`, `LINE`, `BOOLEAN_OPERATION` | —                                              | `glyph`   |
| `FRAME`, `COMPONENT`, `INSTANCE`                                    | Slash-notation name (e.g., `Icon/arrow-right`) | `glyph`   |
| `FRAME`, `COMPONENT`, `INSTANCE`                                    | `layoutMode: "HORIZONTAL"`                     | `row`     |
| `FRAME`, `COMPONENT`, `INSTANCE`                                    | `layoutMode: "VERTICAL"`                       | `column`  |
| `FRAME`, `COMPONENT`, `INSTANCE`                                    | No layout + name/size matches icon heuristic   | `glyph`   |
| `FRAME`, `COMPONENT`, `INSTANCE`                                    | No layout                                      | `surface` |
| Any                                                                 | Name matches `btn\|button`                     | `trigger` |
| Any                                                                 | Name matches `input\|textfield`                | `field`   |
| Any                                                                 | Name matches `select\|dropdown`                | `picker`  |

**Icon Detection Heuristics:**

- Slash notation: `Icon/arrow-right`, `aiux-icon/chevron` → definitive icon
- Name contains `\bicon\b` → likely icon
- Size 8-40px, roughly square (±4px) → likely icon
- **Do NOT recurse into glyph children** — they contain internal vector paths

**Extracted Block Shape:**

```json
{
  "id": "1:234",
  "name": "Item Card",
  "type": "FRAME",
  "role": "row",
  "depth": 2,
  "dims": {"w": 360, "h": 64},
  "palette": {
    "bg": "#ffffff",
    "border": "#e5e7eb",
    "borderWidth": 1,
    "radius": 12,
    "shadow": "0px 4px 8px 0px rgba(0, 0, 0, 0.08)",
    "gradient": null,
    "opacity": null,
    "imagePlaceholder": false
  },
  "flow": {
    "gap": 12,
    "padding": [12, 16, 12, 16],
    "justify": "start",
    "align": "center",
    "wrap": false,
    "grow": false,
    "overflow": null
  },
  "typo": null,
  "content": null
}
```

**Paint Helpers:**

- `solidColor(fills)` → `#hex` or `rgba(r,g,b,a)` for first visible SOLID paint
- `gradientValue(fills)` → `linear-gradient(Ndeg, stops)` or `radial-gradient(circle, stops)`
- `hasImageFill(fills)` → boolean
- `dropShadowValue(effects)` → `Xpx Ypx Bpx Spx rgba(...)` for visible DROP_SHADOW effects

**Skip these nodes:**

- `visible: false`
- `type: 'SLICE'`
- Children of `glyph` role nodes (don't recurse into icon internals)

---

## Phase 2: Design Translation

Deterministically map each raw block to Tailwind classes, DaisyUI patterns, CSS custom properties, and icon names. **This is where 90% of the design decisions are made — no LLM needed.**

### Spacing Scale

| Figma px | Tailwind Scale | Used for         |
| -------- | -------------- | ---------------- |
| 0        | 0              | `gap-0`, `p-0`   |
| 4        | 1              | `gap-1`, `p-1`   |
| 8        | 2              | `gap-2`, `p-2`   |
| 12       | 3              | `gap-3`, `p-3`   |
| 16       | 4              | `gap-4`, `p-4`   |
| 20       | 5              | `gap-5`, `p-5`   |
| 24       | 6              | `gap-6`, `p-6`   |
| 32       | 8              | `gap-8`, `p-8`   |
| 40       | 10             | `gap-10`, `p-10` |
| 48       | 12             | `gap-12`, `p-12` |
| 64       | 16             | `gap-16`, `p-16` |
| 80       | 20             | —                |
| 96       | 24             | —                |
| 128      | 32             | —                |

**Algorithm**: Find nearest px value, use its scale number. Never use arbitrary values like `gap-[13px]`.

### Font Size

| Figma px | Tailwind    |
| -------- | ----------- |
| 12       | `text-xs`   |
| 14       | `text-sm`   |
| 16       | `text-base` |
| 18       | `text-lg`   |
| 20       | `text-xl`   |
| 24       | `text-2xl`  |
| 30       | `text-3xl`  |

### Font Weight

| Figma Weight | Tailwind         |
| ------------ | ---------------- |
| 100          | `font-thin`      |
| 200-300      | `font-light`     |
| 400          | (omit — default) |
| 500          | `font-medium`    |
| 600          | `font-semibold`  |
| 700          | `font-bold`      |
| 800          | `font-extrabold` |

### Border Radius

| Figma px | Tailwind       |
| -------- | -------------- |
| 0        | `rounded-none` |
| 2        | `rounded-sm`   |
| 4        | `rounded`      |
| 6        | `rounded-md`   |
| 8        | `rounded-lg`   |
| 12       | `rounded-xl`   |
| 16       | `rounded-2xl`  |
| 24       | `rounded-3xl`  |
| ≥100     | `rounded-full` |

### Shadow

Map by blur radius: ≤2→`shadow-sm`, ≤4→`shadow`, ≤8→`shadow-md`, ≤12→`shadow-lg`, ≤20→`shadow-xl`, >20→`shadow-2xl`.

### Background Colors

| Hex       | Tailwind Class   |
| --------- | ---------------- |
| `#ffffff` | `bg-white`       |
| `#000000` | `bg-black`       |
| `#f9fafb` | `bg-gray-50`     |
| `#f3f4f6` | `bg-gray-100`    |
| `#e5e7eb` | `bg-gray-200`    |
| `#d1d5db` | `bg-neutral-300` |
| `#fef2f2` | `bg-red-50`      |
| `#fef3c7` | `bg-amber-100`   |
| `#dcfce7` | `bg-green-100`   |
| `#ecfeff` | `bg-cyan-100`    |
| `#f5f3ff` | `bg-purple-100`  |
| `#fffbeb` | `bg-yellow-100`  |

If no Tailwind class matches, fall back to CSS variable: `var(--color-background-primary, white)`, `var(--color-base-content, #1f2937)`, `var(--color-text-secondary, #6b7280)`.

If no CSS variable matches either, use the raw hex value as a last resort (and flag it in notes).

### Text Colors

| Hex       | Tailwind Class      |
| --------- | ------------------- |
| `#ffffff` | `text-white`        |
| `#1f2937` | `text-text-primary` |
| `#374151` | `text-gray-700`     |
| `#6b7280` | `text-gray-600`     |
| `#9ca3af` | `text-neutral-400`  |
| `#d1d5db` | `text-neutral-500`  |

### Padding

Collapse to shorthand: all-equal → `p-N`, symmetric → `py-N px-M`, otherwise → `py-avg px-avg`.

### Icon Matching

Map Figma layer names to `aiux-icon` names using this keyword table (263 entries):

| Keywords                                                 | Icon Name                                      |
| -------------------------------------------------------- | ---------------------------------------------- |
| `arrow-right`, `forward`                                 | `arrow-right`                                  |
| `arrow-left`, `back`                                     | `arrow-left`                                   |
| `close`, `x`, `dismiss`, `cancel`                        | `close`                                        |
| `search`, `find`                                         | `magnifying-glass`                             |
| `settings`, `setting`, `config`, `cog`                   | `gear`                                         |
| `user`, `profile`, `person`, `aiux-avatar`               | `circle-user`                                  |
| `home`, `house`                                          | `home`                                         |
| `bell`, `notification`, `aiux-alert`                     | `bell`                                         |
| `mail`, `email`, `message`                               | `envelope`                                     |
| `edit`, `pencil`, `write`                                | `pencil`                                       |
| `delete`, `trash`, `remove`                              | `trash`                                        |
| `add`, `plus`, `new`, `create`                           | `plus`                                         |
| `check`, `success`, `done`, `complete`                   | `circle-check`                                 |
| `warning`, `warn`, `caution`                             | `triangle-exclamation`                         |
| `info`, `information`                                    | `circle-info`                                  |
| `error`, `fail`                                          | `circle-close`                                 |
| `star`, `favorite`, `fav`, `rate`                        | `star`                                         |
| `heart`, `like`, `love`                                  | `heart`                                        |
| `lock`, `secure`, `locked`                               | `lock`                                         |
| `unlock`, `unlocked`                                     | `unlock`                                       |
| `calendar`, `date`, `schedule`                           | `calendar`                                     |
| `clock`, `time`, `timer`                                 | `clock`                                        |
| `download`                                               | `download`                                     |
| `upload`                                                 | `upload`                                       |
| `filter`                                                 | `filter`                                       |
| `sort`                                                   | `sort-ascending`                               |
| `menu`, `hamburger`, `nav`                               | `menu`                                         |
| `refresh`, `reload`                                      | `arrow-clockwise`                              |
| `sync`                                                   | `sync`                                         |
| `save`                                                   | `save`                                         |
| `copy`, `clipboard`                                      | `clipboard`                                    |
| `share`                                                  | `share`                                        |
| `aiux-link`, `url`                                       | `aiux-link`                                    |
| `phone`, `call`                                          | `phone`                                        |
| `chat`                                                   | `chat`                                         |
| `comment`                                                | `comment`                                      |
| `document`, `doc`, `file`, `paper`                       | `document`                                     |
| `task`, `tasks`, `todo`, `todos`, `to-do`, `action-item` | `checklist`                                    |
| `work-item`, `assignment`, `assigned`, `request`         | `user-clipboard`                               |
| `approve`, `approval`                                    | `clipboard-check`                              |
| `incident`                                               | `triangle-exclamation`                         |
| `folder`                                                 | `folder`                                       |
| `image`, `photo`, `picture`                              | `image`                                        |
| `play`, `start`                                          | `play`                                         |
| `pause`                                                  | `pause`                                        |
| `stop`                                                   | `stop`                                         |
| `chevron-right/left/down/up`                             | matching direction                             |
| `chevron`                                                | `chevron-right`                                |
| `eye`, `view`, `visible`, `show`                         | `eye`                                          |
| `eye-off`, `hide`, `hidden`                              | `eye-slash`                                    |
| `bookmark`                                               | `bookmark`                                     |
| `pin`                                                    | `thumbtack`                                    |
| `tag`, `label`                                           | `tag`                                          |
| `fire`, `hot`, `trending`                                | `fire`                                         |
| `lightning`, `flash`, `bolt`                             | `lightning`                                    |
| `sparkle`, `ai`, `magic`                                 | `ai-sparkle`                                   |
| `robot`, `bot`                                           | `bot`                                          |
| `globe`, `world`, `web`                                  | `globe`                                        |
| `map`, `location`                                        | `map-pin`                                      |
| `cart`, `shop`, `basket`                                 | `shopping-cart`                                |
| `money`, `dollar`, `payment`                             | `currency`                                     |
| `key`                                                    | `key`                                          |
| `shield`, `security`                                     | `shield-check`                                 |
| `bug`                                                    | `bug`                                          |
| `code`, `dev`                                            | `code`                                         |
| `terminal`                                               | `console`                                      |
| `database`, `db`, `data`                                 | `database`                                     |
| `cloud`                                                  | `cloud`                                        |
| `thumbs-up`, `thumb-up`                                  | `thumbs-up`                                    |
| `thumbs-down`, `thumb-down`                              | `thumbs-down`                                  |
| `chart`                                                  | `chart-bar-vertical`                           |
| `graph`                                                  | `chart-line`                                   |
| `analytics`                                              | `analytics-center`                             |
| `dashboard`, `gauge`                                     | `dashboard-dial`                               |
| `inbox`                                                  | `inbox`                                        |
| `attach`, `attachment`                                   | `paperclip`                                    |
| `external`, `external-link`, `open-new`                  | `arrow-up-right` or `external-action`          |
| `more`, `dots`, `ellipsis`                               | `more-horizontal`                              |
| `drag`, `reorder`                                        | `drag-dots`                                    |
| `help`, `question`                                       | `circle-question`                              |
| `workflow`, `process`, `flow`                            | `workflow`                                     |
| `change`, `changes`                                      | `change`                                       |
| `overdue`                                                | `clock`                                        |
| `urgent`, `critical`, `attention`                        | `triangle-exclamation` or `circle-exclamation` |
| `pending`, `aiux-progress`, `in-progress`                | `ongoing`                                      |
| `team`, `group`, `members`                               | `user-group`                                   |
| `agent`, `support`                                       | `headset`                                      |
| `catalog`                                                | `catalog`                                      |
| `knowledge`, `kb`                                        | `book-open`                                    |

**Algorithm:**

1. Slash notation → extract rightmost non-numeric segment, look up
2. Kebab-case full name → look up
3. Individual words → look up each
4. No match → output `icon?` in blueprint (LLM picks best guess or adds TODO)

### DaisyUI Pattern Detection

Match layer names against these regex patterns:

| Pattern                           | DaisyUI Class      |
| --------------------------------- | ------------------ |
| `\bbtn\b\|button`                 | `aiux-btn`         |
| `badge\|tag\|chip\|pill`          | `aiux-badge`       |
| `aiux-card`                       | `aiux-card`        |
| `aiux-avatar`                     | `aiux-avatar`      |
| `toggle\|switch`                  | `aiux-toggle`      |
| `\binput\b\|textfield`            | `aiux-input`       |
| `alert\|toast\|notification-bar`  | `aiux-alert`       |
| `modal\|dialog\|overlay`          | `aiux-modal`       |
| `\btab\b\|\btabs\b`               | `tabs`             |
| `dropdown\|select\|combobox`      | `aiux-dropdown`    |
| `progress\|loading-bar`           | `aiux-progress`    |
| `tooltip\|popover`                | `aiux-tooltip`     |
| `aiux-checkbox`                   | `aiux-checkbox`    |
| `aiux-radio`                      | `aiux-radio`       |
| `menu\|nav-item`                  | `menu`             |
| `table\|data-grid`                | `table`            |
| `breadcrumb`                      | `aiux-breadcrumbs` |
| `stat\|kpi\|metric`               | `stat`             |
| `collapse\|accordion\|expandable` | `aiux-collapse`    |

### Translated Block Shape

Each block gains these new fields after translation:

```json
{
  "...original fields...",
  "tailwind": "flex flex-row gap-3 p-4 rounded-xl bg-white shadow-md",
  "cssProps": { "background": "linear-gradient(135deg, ...)" },
  "iconMatch": "magnifying-glass",
  "daisyPattern": "btn",
  "sizeHint": "w-8 h-8",
  "notes": ["gradient → static styles", "image placeholder"]
}
```

---

## Phase 3: Blueprint Building

Build the pre-mapped blueprint text that becomes the LLM's user prompt. The blueprint contains:

1. **Header**: Widget title, PascalCase class name, kebab-case element name
2. **Design Summary**: Layer count, text count, interactive count, DaisyUI patterns, icons, unmatched glyphs
3. **Component Tree**: Indented tree with semantic tags, Tailwind classes, text content, DaisyUI annotations, size hints
4. **Custom CSS**: Any styles that couldn't be expressed as Tailwind classes (gradients, unmapped colors)
5. **Colors Found**: Background and text hex values discovered
6. **Visible Text**: All text content from the design (for mock data extraction)
7. **Requirements**: 9 non-negotiable rules for the generated code

### Component Tree Format

```
div.col  class="flex flex-col gap-4 p-6 rounded-3xl bg-white shadow-md"
  span  class="text-sm font-medium text-gray-600"  → "Tasks Needing Attention"
  div.col  class="flex flex-col gap-3"
    div.row  class="flex flex-row gap-3 p-4 items-center rounded-xl"
      aiux-icon[checklist]  {w-8 h-8}
      div.col  class="flex flex-col flex-1"
        span  class="text-sm font-medium text-text-primary"  → "Review incident INC0012345"
        span  class="text-xs text-gray-600"  → "Overdue - 2 days"
      span  class="text-xs text-text-primary"  → "P2"  [daisy:badge]
```

Tags: `div.row`, `div.col`, `span`, `aiux-icon[name]`, `icon?`, `button`, `input`, `select`, `div.shape`, `div`.

### 9 Requirements (appended to every blueprint)

1. Use the Tailwind classes from the tree — they are already correctly mapped
2. For `aiux-icon[name]` nodes → `<aiux-icon name="name" size="sm">`
3. For `icon?` nodes → pick best-guess `aiux-icon` or `<!-- TODO: custom icon -->`
4. For text content (`→ "..."`) → wrap in `i18n.getMessage()`
5. Build `static _mockData` from visible text — extract repeating items into typed array
6. In `fetchData()` → fall back to `_mockData` on error OR empty response
7. Add `this.server.get({ action: 'getData' })` in `fetchData()`
8. Add skeleton loader matching the layout structure
9. Outer container must be: `<div class="widget-container flex flex-col p-6 rounded-3xl">`

---

## Phase 4: Widget Generation

Feed the blueprint to the `aiux-build` skill for code generation. The blueprint replaces the usual free-text requirements.

**If `activate_skill` tool is available**, use it with skill name `"aiux-build"`. Pass the blueprint as context.

**Otherwise**, load the `aiux-build` SKILL.md and follow its BUILD mode protocol (Step 3 — Adding a Widget), using the blueprint as the requirements input. The `aiux-build` skill will:

1. Use the component tree to structure `render()` and `_renderX()` helpers
2. Use the Tailwind classes **exactly as pre-mapped** — do not add, remove, or override them
3. Use the visible text to build `static _mockData`
4. Apply all its widget principles
5. Run the validation steps (widget/component-patterns → quality/validation-rules → quality/best-practices-checklist)

### Critical Figma-Specific Rules

These rules override any conflicting guidance in the base `aiux-build` skill. Load `references/figma-rules.md` and `references/design-principles.md` for full details.

**Typography Fidelity**: Use ONLY the Tailwind classes from the blueprint. Do not add font weights, sizes, or colors that aren't in the pre-mapped classes.

**Mock Data — Always Required**: Extract visible text into `static _mockData`. Fall back to mock on error/empty so the widget always renders.

**Template Safety**: All array/object access must use optional chaining (`?.`).

**Reserved Property Names**: Never declare `data`, `part`, `style`, or `className` in `static properties`. Use `widgetData`, `cardData`, etc.

**No Hardcoded Colors**: Never use hex or RGB literals. Use Tailwind semantic classes or CSS custom properties only.

**No Inline SVG**: Always use `<aiux-icon>`, never `<svg>` or `<path d=...>`.

**No Arbitrary Tailwind Values**: Never use `w-[247px]`, `gap-[13px]`, `bg-[#hex]`. Use scale values only.

---

## Phase 5: Validation

After code generation, validate against these checks:

### Must Exist (Errors)

| Check                     | Regex                          |
| ------------------------- | ------------------------------ |
| @ExplicitSysId decorator  | `@ExplicitSysId\(`             |
| static properties         | `static\s+properties\s*=`      |
| static styles             | `static\s+styles\s*=\s*css`    |
| constructor               | `constructor\(\)`              |
| super() in constructor    | `super\(\)`                    |
| super.connectedCallback() | `super\.connectedCallback\(\)` |
| render() method           | `render\(\)`                   |

### Best Practices (Warnings)

| Check                | Regex                  |
| -------------------- | ---------------------- |
| i18n used            | `i18n\.getMessage`     |
| disconnectedCallback | `disconnectedCallback` |
| :host display block  | `display:\s*block`     |
| height 100%          | `height:\s*100%`       |
| Loading state        | `aiux-loading`         |

### Anti-Patterns (Warnings — must NOT exist)

| Check                | Regex                    |
| -------------------- | ------------------------ |
| Inline SVG paths     | `<path\s+d=`             |
| Arbitrary width      | `w-\[\d+px\]`            |
| Arbitrary height     | `h-\[\d+px\]`            |
| Arbitrary gap        | `gap-\[\d+px\]`          |
| Arbitrary bg color   | `bg-\[#[0-9a-fA-F]+\]`   |
| Arbitrary text color | `text-\[#[0-9a-fA-F]+\]` |

### Extra Checks

- Exported class name must exist
- No duplicate `constructor()` methods
- `@ExplicitSysId` must be 32 lowercase hex chars

### Scoring

Score = `100 - (errors × 15) - (warnings × 5) - (info × 1)`. Must be `passed: true` (zero errors) before presenting to user.

---

## Detailed References

Load these for specialized rules that extend the base pipeline:

- [Design Principles](references/design-principles.md) — Aesthetic, color, typography, spacing, icons, widget container, scrollable lists
- [Figma Rules](references/figma-rules.md) — Mock data, template safety, icon handling, typography fidelity, i18n, data fetching, skeleton loaders, class naming, return format

If `load_skill_resource` tool is available:
Use `load_skill_resource` with skill name "figma-to-widget" and file path "references/<reference-file-name>.md" to load it.
Otherwise load directly as resource markdown file.

---

## Scripts

CLI tools for running Phases 1-2 outside of the LLM context:

- `scripts/figma-extractor.js` — Phase 1: Figma API → flat block array (same as Figma_Generator)
- `scripts/design-translator.js` — Phase 2: Blocks → Tailwind/DaisyUI mappings (same as Figma_Generator)
- `scripts/extract-and-translate.js` — Combined CLI: runs Phase 1 + 2 and outputs the blueprint
- `scripts/validator.js` — Phase 5: Regex-based widget validation

Usage:

```bash
FIGMA_ACCESS_TOKEN=<token> node scripts/extract-and-translate.js "<figma-url>"
```

### Testing without a Figma token

Two test scripts let you verify the pipeline without any Figma credentials.

#### Figma path — mock pipeline (Phases 1–3)

Runs the full extraction → translation → blueprint pipeline against a local fixture (`scripts/fixtures/task-card.json`). No `FIGMA_ACCESS_TOKEN` required.

```bash
# Print the full blueprint (Phase 3 output)
node scripts/test-mock-pipeline.js

# Print raw translated blocks as JSON (Phase 2 output)
node scripts/test-mock-pipeline.js --raw
```

Expected output:

- 24 blocks extracted from the "Task Card" frame
- 3 icons matched: `checklist` × 2, `user-clipboard` × 1
- 2 DaisyUI patterns detected: `card`, `badge`
- 0 unmatched glyphs
- Full blueprint text ready to pass to the `aiux-build` skill

#### No-Figma path — baseline validation

Runs Phase 5 validation on the stock `aiux-build` widget template to confirm the base skill is unaffected by any `figma-to-widget` changes.

```bash
node scripts/test-no-figma.js
```

Expected output:

- `✓ PASSED` — 0 unexpected errors, score 70/100 (raw)
- 2 expected template gaps noted (not real failures):
  - `@ExplicitSysId` — only added when explicitly requested by user
  - `export class` — omitted in template so class name can be freely renamed
- Confirms the `aiux-build` widget path is independent of Figma integration

#### End-to-end example output

`scripts/fixtures/task-card-widget.js` is the complete widget generated from the task-card fixture — it is what a user gets after running the full pipeline (Phases 1–4) and then validating with Phase 5:

```bash
# Validate the committed example widget (Phase 5)
node --input-type=module <<'EOF'
import {validateWidget} from './scripts/validator.js';
import {readFileSync} from 'fs';
const r = validateWidget(readFileSync('./scripts/fixtures/task-card-widget.js', 'utf8'));
console.log(r.passed ? '✓ PASSED' : '✗ FAILED', 'score:', r.score + '/100');
r.errors.forEach(e => console.log('  ✗', e));
r.warnings.forEach(w => console.log('  ⚠', w));
EOF
```

Expected output: `✓ PASSED  score: 100/100`

The widget file shows:

- All Tailwind/DaisyUI classes from the blueprint applied correctly
- `aiux-icon` elements with matched icon names (`checklist`, `user-clipboard`)
- `_mockData` built from the visible text extracted from the Figma design
- `fetchData()` falling back to `_mockData` on empty response or error
- Skeleton loader matching the task-row layout
- `disconnectedCallback()` — Phase 5 check satisfied

---

## End-to-End Flow

```
1. User pastes Figma URL
   ↓
2. Phase 1: Figma API → flat array of blocks (roles, colors, fonts, layout)
   ↓
3. Phase 2: Deterministic mapping → Tailwind classes, DaisyUI patterns, icon names, CSS vars
   ↓
4. Phase 3: Build blueprint (component tree + stats + requirements)
   ↓
5. Phase 4: Activate aiux-build skill with blueprint as requirements
   ↓
6. Phase 5: Validate generated code → errors/warnings/score
   ↓
7. Fix violations, re-validate until score is passing
   ↓
8. Present final widget code to user
```
