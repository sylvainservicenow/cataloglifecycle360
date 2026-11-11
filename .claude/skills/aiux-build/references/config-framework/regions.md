# Editable Region Layouts

An editable region is not an HTML `<section>` or an `aiux-region` element. It is a **`region` tagged template in a module under the app root's `regions/` directory**, imported and called by its page. This applies to standalone pages and Core UI extension pages alike. Current SDK builds enforce this placement: using `region` as a tagged template directly in a page's `render()` is a build error. See `references/app/regions.md` for the DSL grammar reference and file convention.

Regions are part of the configuration framework: every widget instance inside one needs a static `aiux-config-id`, and region inputs are literal-only. Read `config-id.md` for what `aiux-config-id` does and how it chains through nested components.

## Complete placement pattern

Create `regions/demo-home/body.js` after discovering or authoring the widgets it imports:

```js
import {region} from '@servicenow/aiux-components-core';
import '../../widgets/demo-greeting/index.js';
import '../../widgets/demo-metric/index.js';
import '../../widgets/demo-spotlight/index.js';

export default () => region`
  <row>
    <column span=${12} span-lg=${4}>
      <demo-greeting aiux-config-id="greeting" />
    </column>
    <column span=${12} span-lg=${4}>
      <demo-metric aiux-config-id="metric" .value=${42} />
    </column>
    <column span=${12} span-lg=${4}>
      <demo-spotlight aiux-config-id="spotlight" .showDescription=${true} />
    </column>
  </row>
`;
```

Import it from the page by its depth-appropriate relative path (see **Relative import depth** below). Keep the region in the **project root**, not beside the extension page.

In the page's `render()`:

```js
return html`
  <h1>${i18n.getMessage('Demo Home')}</h1>
  ${homeBody()}
`;
```

The region module exports a zero-argument, synchronous function returning exactly one bare tagged template. Call it on each render; do not precompute its result at module load, since the rendering host and saved overrides are request-specific. The SDK derives `demo-home-body` from `regions/demo-home/body.js` and injects that name. Do not write `region('name')` yourself or manually create a `sys_aix_page_region` record. That table stores **admin overrides only**, not code-authored default layouts.

## Relative import depth

The region module always lives in the **project root's** `regions/` directory, never beside the page that uses it — so the `../` chain is simply the depth of the page's own directory. Count the directory segments between the project root and the directory holding the page file (`page.js`, or `view.js` for a view page); that count is the number of `../`.

| Page location | Depth | Import from the page |
| --- | --: | --- |
| `pages/<route>/page.js` | 2 | `../../regions/<dir>/body.js` |
| `src/extensions/<host>/pages/<route>/page.js` | 5 | `../../../../../regions/<dir>/body.js` |
| `src/extensions/<host-project-id>/<host-basename>/pages/<route>/page.js` | 6 | `../../../../../../regions/<dir>/body.js` |
| `src/extensions/<host>/<record\|list>/<view>/_variants/<key>/view.js` | 7 | `../../../../../../../regions/<dir>/body.js` |

`<host>` is one segment in the experience-sys_id and `glide` alias forms; the project-id-plus-basename form adds one, which is why the two `pages/<route>/` rows differ by a single `../`. Getting the count wrong fails the build loudly (`Could not resolve …`), so it is self-correcting — but count the segments rather than copying another page's chain.

## Region grammar

- A region's top level holds only `row`s, and each `row` holds one or more `column`s. A `column` holds widgets and, at most one level down, nested `row`s — so every region is `row > column > widget` or `row > column > row > column > widget`. A bare top-level `<column>` or an empty `<row>` is a parse error. Each row has 12 grid tracks. `span=${12} span-lg=${4}` stacks widgets at narrow widths and gives three equal columns on large screens. `span` and breakpoint spans accept integers 1–12.
- Widget tags are **leaves**. Put headings, paragraphs, links, and any interactive logic inside widgets or in the page outside the region. Avoid `<raw>`: it makes a region uneditable in the visual editor.
- Bind widget inputs with `.property=${literal}` (including Boolean properties) or `?booleanAttribute=${literal}`. No plain widget attributes, `class`, `style`, event bindings, directives, nested content, or partially interpolated attributes.
- DSL expressions must be string/number/Boolean/null literals or arrays of those. No `this`, variables, function calls (including `i18n.getMessage()`), object literals, or dynamic template results. The persistence format also rejects strings containing `}`. Keep localized defaults in the widget's `@configProperty` field initializers, not the region template.
- Add a stable, distinct `aiux-config-id` to each configurable widget instance. Do not rename existing ids during cosmetic edits: saved configuration is keyed by them. Avoid duplicate ids across the owning page's regions as well.
- Every element a region places must be a widget, or the build throws `<x> is not a widget`. Use the bare tag: `<scope:tag>` is only for admin-saved layouts, and the build rejects it in a region file. Use imports so widgets are registered; custom element tags alone are inert. Local authored widgets (`widgets/<name>/index.js`) use relative imports. Instance widgets use the `@servicenow/glide-widgets/<scope>/<tag>` imports verified through UI discovery. A packaged component is not a widget, so to place one, wrap it in a local widget. SDK meta-package imports such as `@servicenow/aiux/aiux-components-core` are normalized by the consumer build to the underlying package API.

## A fourth widget not placed yet

Keep its own `widgets/<tag>/index.js`, default-exported `AIUXWidgetElement`, `@customElement`, `@discoverable(true)`, `@name`, `@description`, `@bestFor`, `@category('custom')`, and config properties. Do **not** import it into this region or add its tag as a hidden child. The widget directory is discovered independently during the build, so it can install and appear in the region picker without being placed on the page. Do not use `@demo(true)` merely because it contains sample data: that decorator gates installation on opting into demo data.

## Verification

- Build: confirm the derived region name is present in both browser and SSR output, three instances have distinct config ids, and the fourth widget has its own discoverable widget record but is absent from the home layout.
- Config: each field needs `@configProperty({type, label})` with an inline options object, translated labels, and a field initializer for its default. No `default` option or duplicate `@property` is needed. Purely presentational widgets do not need a server script or artificial loading/error states.
- Runtime: check the region's `data-aiux-region` marker, configuration discovery, per-instance edits, and narrow-width reflow in an authenticated session. Build/lint alone do not prove the region editor works on the deployed runtime.
- If the installed SDK does not inject the region name or rejects supported syntax, stop and report the version mismatch. Do not silently fall back to a hardcoded grid, inline DSL, or hand-authored metadata.
