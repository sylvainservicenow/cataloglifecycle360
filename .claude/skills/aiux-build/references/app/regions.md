# Regions — the `region` Layout DSL

**All `region` DSL must live in a file under `<projectRoot>/regions/`.** Using `region` as a tagged template directly in a page's `render()` is a **build error** — the SDK build rejects it at compile time. The page imports a thunk from `regions/` and calls it; the `region` import itself never appears in a page file.

```js
// regions/home/body.js  ← DSL lives here
import {region} from '@servicenow/aiux-components-core';
import '../../widgets/stat-card/index.js';
import '../../widgets/activity-feed/index.js';

export default () => region`
  <row>
    <column span=${8}>
      <stat-card .label=${'Open Incidents'} .value=${'142'} />
    </column>
    <column span=${4}>
      <activity-feed />
    </column>
  </row>
`;
```

```js
// pages/home/page.js  ← page imports the thunk, never imports region directly
import {html} from 'lit';
import {AIUXElement} from '@servicenow/aiux-components-core';
import body from '../../regions/home/body.js';

export default class HomePage extends AIUXElement {
  render() {
    return html`
      <h1>Dashboard</h1>
      ${body()}
    `;
  }
}
```

Calling `body()` per `render()` (not caching the result) is required — so the runtime consults the current request's `sys_aix_page_region` override registry on every render, not a stale module-load-time snapshot.

---

## Why everything is in `regions/`

The build's `apply-region-source-rules.js` plugin runs two passes:

- **Inside `regions/`:** validates the file shape and DSL, then rewrites the bare `` region`…` `` tag to `` region('<derived-name>')`…` `` where the name comes from the file path. Without this rewrite the runtime defaults to `'default'` and no admin override ever fires.
- **Outside `regions/`:** if a file imports `region` or uses it as a tagged template, the build throws. No opt-out. This is the enforcement that keeps admin-override addressability guaranteed for every region in the product.

## File convention

Place region files at `regions/<key>/<name>.js`, a sibling of `pages/` at the project root — not nested under `pages/`. The file's path (relative to `regions/`, extension stripped, `/` → `-`) becomes the region's registered name:

```
regions/home/body.js            → "home-body"
regions/named-layouts/header.js → "named-layouts-header"
regions/foo.js                  → "foo"
```

This name is what the admin visual editor writes into `sys_aix_page_region.region`, and what the runtime uses to look up overrides. **There is no decorator and no way to hand-write the name in source** — a curried `` region('my-name')`…` `` in a `regions/` file is also a build error; the build injects it from the path.

**Name grammar:** `^[A-Za-z_][A-Za-z0-9._-]*$`. Folder and file names that fit this grammar — alphanumeric, hyphens, dots, underscores, starting with a letter or underscore — produce valid names. The build (`assertValidRegionName`) throws on anything else.

**Required file shape** — the build validates all of this and throws a source-located error otherwise:

- Default export must be a **nullary, non-async, non-generator** function (arrow, function expression, or declaration).
- It must return (directly, or as the sole statement of a block body) a bare `` region`…` `` tagged template using the exact local name the file imported `region` as.
- Every `${…}` interpolation must be a **literal** — string, number, boolean, `null`, or an array of those. A variable, ternary, or function call fails with "region interpolation must be a literal value."
- No `}` character inside a string value (e.g. `.label=${'foo } bar'}`) — the platform's Glide-side save-time splitter cannot round-trip it.

**A region may only contain widgets.** Every element that isn't `row`, `column` or `raw` must be one of the app's widgets, or the build throws a source-located `<x> is not a widget` error. That means either the app's own widget (a `widgets/<name>/index.{js,ts}` entry with a default-exported class and `@customElement`), or a published widget imported as `@servicenow/glide-widgets/<scope>/<tag>`. A plain component under `components/` is not a widget: it has no `sys_aix_widget` record, so the visual editor can't offer it. Wrap it in a widget, or move it under `widgets/`.

**Widget imports** go in the region file alongside the `region` import, using paths relative to the region file (typically `../../widgets/<name>/index.js`). A widget the page already imports also counts.

---

## The one rule that explains every DSL restriction

**A widget receives only its own declared properties. Every value is a whole `${}` hole of a serializable kind. Nothing reaches the element as raw source text.**

That's why there's no `class`/`style`/`@event`/arbitrary-attribute support — only `.prop=${value}`, `?bool=${value}`, and a small set of layout-owned attributes. If you need those on a widget, put the styling/behavior inside the widget itself, not in the region template.

## Primitives

| Tag | Role | Holds |
| --- | --- | --- |
| `row` | 12-column grid arrangement | one or more `column`s, nothing else |
| `column` | the slot — the addressable, lockable, position-bearing unit | widgets, `raw`, and nested `row`s, in any mix and order — never a bare `column` |
| `raw` | escape hatch for static author-written markup | opaque HTML string, no attributes, no `${}` inside |

**The top level of a region holds only `row`s.** A `<column>` directly in the template, outside any row, is a parse error. With the two-level nesting cap, every region is one of exactly two shapes, `row > column > widget` and `row > column > row > column > widget`. A `column` may be empty (a reserved slot). A `row` may not.

**Multiple widgets in one `column` already stack vertically** — a column is a flex column with the region's gutter between children:

```js
<column span=${4}>
  <stat-card />
  <chart />
  <activity-feed />
</column>
```

## Building a layout — the pattern

A `column` holds widgets and nested `row`s freely mixed, so "three stat cards side by side, with a chart under them" is one column holding a nested row and then the chart:

```js
// regions/dashboard/body.js
import {region} from '@servicenow/aiux-components-core';
import '../../widgets/stat-card/index.js';
import '../../widgets/chart/index.js';
import '../../widgets/activity-feed/index.js';
import '../../widgets/incident-table/index.js';

export default () => region`
  <row>
    <column span=${8}>
      <row>
        <column span=${4}><stat-card .label=${'P1'} .value=${'12'} /></column>
        <column span=${4}><stat-card .label=${'P2'} .value=${'34'} /></column>
        <column span=${4}><stat-card .label=${'P3'} .value=${'56'} /></column>
      </row>
      <chart .title=${'Trend'} .height=${240} />
    </column>
    <column span=${4} scroll=${'md'}>
      <activity-feed .title=${'Recent'} />
    </column>
  </row>
  <row>
    <column span=${12}>
      <incident-table />
    </column>
  </row>
`;
```

**Several top-level rows are fine** — the region's wrapper stacks them with the same gutter a row puts between its columns and a column puts between its widgets, so the spacing is uniform across the whole region. A full-width band is `<row><column span=${12}>…</column></row>`, never a bare `<column>`.

## Widget tags

```js
<my-widget .name=${'hello'} .data=${obj} ?disabled=${flag} />
```

The entire vocabulary: `.prop=${…}` for a property, `?bool=${…}` for a boolean attribute, plus `aiux-pinned` / `aiux-order` / `aiux-config-id` as editor metadata. **`name="hello"` (no dot) is invalid** — always write `.name=${'hello'}` even for a plain string. A widget is always a **leaf** — it cannot contain children, another widget, or text. If a part of the page needs slotted composition, write it in plain `html` in the page rather than reaching for `<raw>` (untrusted-input-unsafe, invisible to the editor).

An admin using the visual editor can drop in a widget the region file didn't import, using a scope-prefixed tag: `<x_snc_myapp:foo-widget />`. Code-authored region files must not use the prefix: the build rejects `<scope:tag>` in a region file. Write the bare tag and import the widget.

## Attributes by tag — the exhaustive table

| Tag | Attribute | Values | Notes |
| --- | --- | --- | --- |
| any widget | `.prop=${value}` | any serializable value | live property binding |
| any widget | `?bool=${value}` | any value | boolean attribute, present when truthy |
| any widget | `aiux-pinned` | bare | can't be removed by the visual editor |
| any widget | `aiux-order` | `${n}` or literal | display order metadata |
| any widget | `aiux-config-id="id"` | non-empty string, **required if present** | stamps `data-aiux-element-id` + `aiux-config-data` — see `config-id.md` |
| `column` | `span=${n}` | integer 1–12, default 12 | grid width in its `row` (a column is always inside one) |
| `column` | `span-sm\|md\|lg\|xl\|2xl=${n}` | integer 1–12 | breakpoint override, ascending emission |
| `column` | `locked` | bare | visual-editor: position fixed |
| `column` | `scroll=${'sm'\|'md'\|'lg'}` | closed token | bounds block size, makes independently scrollable, adds scroll-position fade |
| `row` | `container` | bare | switches child `span-{bp}` from viewport (`{bp}:`) to container-query (`@{bp}:`) axis |
| `raw` | none | — | takes zero attributes, layout-owned included |

**Container query axis note:** `container`'s viewport `md` (`48rem`) and container `@md` (`28rem`) are *different physical widths* under the same attribute name (`span-md`) — this is Tailwind's design, not a DSL bug.

## Values — what's legal in a `.prop`/`?bool` binding

| Value | Result |
| --- | --- |
| string, number, boolean, `null`, `undefined` | binds live |
| plain object, array | binds live, verbatim — not stringified |
| `Date`, class instance, `NaN`/`Infinity` | binds live, but **round-trips** (ISO string / plain object / `null`) through storage — the widget must cast back |
| function, `nothing`/`noChange`, a directive (`ifDefined`, `classMap`, `ref`), a nested `html`/`region` template | **throws at parse time** — not data |
| `bigint`, `Map`/`Set`/`WeakMap`/`WeakSet`, `RegExp` | **throws at parse time** — destroyed by the JSON round trip a stored layout requires |

To omit a property conditionally, pass `undefined`/`null` — `nothing` and `ifDefined()` don't exist in this grammar. For widget communication, dispatch a namespaced custom event and listen on an ancestor — `@event` bindings aren't part of the grammar.

## Common build-time errors and what they mean

| You wrote | Error | Fix |
| --- | --- | --- |
| `region` in a page file | `file outside <srcDir>/regions/ imports region` | move the DSL into a `regions/` file, import the thunk |
| `<scope:tag>` in a region file | `<x_a:foo> has a scope prefix` | write the bare `<foo />` and import the widget; the prefix is only for admin-saved layouts |
| a component from `components/` in a region | `<x> is not a widget, and a region may only contain widgets` | move it to `widgets/<name>/index.js` (default-exported class), or import the published widget as `@servicenow/glide-widgets/<scope>/<tag>` |
| `title=${'t'}` on a widget | `does not support the attribute "title"` | `.title=${'t'}` |
| `class="..."` or `style="..."` on anything | `does not support the "class" attribute` | style inside the widget; use `span` / breakpoint spans for grid placement |
| `<column>Total</column>` or `Total: ${n}` | `a layout may not contain text` | wrap in a widget, or use `<raw>` for static markup |
| `<my-a><my-b /></my-a>` | `<my-b> must be a direct child of a <column>` | a widget is a leaf — compose in plain `html` instead |
| `.label="a ${b}"` (multi-part) | `needs a single interpolated value` | interpolate the whole value: `.label=${a + b}` |
| `.prop="literal"` or bare `?flag` | `needs a single interpolated value` | `.prop=${'literal'}` |
| `span=${13}` or non-integer | `must be an integer from 1 to 12` | fix the value |
| `<column>` at the top level of the template | `<column> must be a direct child of a <row> (found at the top level)` | wrap it in a `<row>` — a region's top level holds only rows |
| `<row></row>` or `<row />` with no column | `a <row> must contain at least one <column>` | add a `<column span=${12}>`, or remove the row |
| `<column>` directly inside a `<column>` | `cannot directly contain a <column>` | put the widgets in the outer column, or wrap the inner columns in a `<row>` |
| a third level of `<row>` (`row > column > row > column > row`) | `<row> nesting is capped at 2 levels` | lift the arrangement up a level |
| standard HTML tag (`div`, `span`, `script`) | `Invalid tag <div>` | use a widget, or `<raw>` for markup |
| `<slot>` | `a <slot> projects the host element's light DOM…` | not supported — compose in plain `html` |
| `@click=${h}` | `may not bind an event ("@click")` | dispatch a namespaced custom event instead |

Every violation throws at parse time naming the tag and attribute — nothing silently drops.

## Rendered output — what you can rely on in a test or a DOM query

- Every rendered region is wrapped in exactly one `<div data-aiux-region="{name}" class="flex flex-col gap-layout overflow-hidden">` where `{name}` is the path-derived name the build injected. The wrapper is a real box — a flex column that stacks the region's rows on the region gutter — so it is a single item of whatever layout the page puts it in.
- A `<raw>` block's content is wrapped in `<div data-aiux-raw>`.
- A `scroll`-bearing `column` emits **two** elements (`data-aiux-scroll-root` wrapper + `data-aiux-scroll` inner box) — the grid placement (`col-span-*`) lives on the *outer* wrapper, not the inner scrollable div.
- Regions render on one runtime path shared by SSR and the browser — no build-time compile step, no separate server/client behavior to keep in sync.

## Admin overrides

Every region is overridable by an admin through the visual region editor. An admin edit writes (or updates) a `sys_aix_page_region` row keyed on `(widget, region)`. At request time the code-authored template is the fallback; a matching row's stored DSL renders instead. For widgets inside a region to be individually configurable (not just repositioned), they need `aiux-config-id` attributes — see `config-id.md` and [`config-framework/regions.md`](../config-framework/regions.md) for the full config-framework integration.

## Review checklist (before opening the PR)

- Region DSL is in a `regions/<key>/<name>.js` file — not in a page's `render()`
- The page imports the thunk and calls `body()` per render — not cached
- Widget attributes are all `.prop=${…}` / `?bool=${…}` — no bare/quoted attributes
- No `class`/`style`/`@event` anywhere inside a `region` template
- The template's top level is `row`s only — no bare `column`, widget, or `raw` outside a row
- Every `row` holds at least one `column`; no `column` sits directly in another `column`
- Nesting stops at `row > column > row > column > widget`
- Every `${…}` interpolation is a literal (string, number, boolean, null, or array of those)
- Any value passed to a widget property survives a JSON round trip, or the widget explicitly casts it back
- `<raw>` used only for trusted, static, author-written markup — never loader data or user input
- Region file name and folder segments fit `^[A-Za-z_][A-Za-z0-9._-]*$`
