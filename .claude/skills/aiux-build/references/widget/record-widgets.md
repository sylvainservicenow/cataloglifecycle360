# Record Widgets

This file covers creating and editing general-purpose, Builder-authored widgets built on the record context (`withRecordContext`) — **not** page or `sys_ui_view` view-page recipes, and **not** aggregate/chart widgets that query `resolvedQuery`/`fixedQuery` directly (that's `component-patterns.md`).

## When to Use This File

- Building a new widget meant to be placed on a record page (a page with `<aiux-record-provider>`), reading the surrounding record context, not fetching its own data.
- Editing an existing widget of that shape.
- **If the request doesn't say the widget lives on a record page** (e.g. "on `/record/<table>/<id>`", "on the incident record"), ask where. Without a provider, `withRecordContext` gives `null`.
- Cross-refs: list-context widgets → `list-widgets.md`; aggregate/chart list widgets → `component-patterns.md`.

---

## Imports

```js
import { AIUXWidgetElement, decorators } from '@servicenow/aiux-components-core';
import { withRecordContext, RecordAPIKey } from '@servicenow/aiux-components-record';
```

Import from the package root, `@servicenow/aiux-components-record` (or `@servicenow/aiux/aiux-components-record` if the project uses the meta-package).

---

## Base Class — Record

| Widget type | Base | Package |
| --- | --- | --- |
| Record | `withRecordContext(AIUXWidgetElement)` | `@servicenow/aiux-components-record` |

Use the mixin form for general-purpose widgets that need `AIUXWidgetElement` capabilities (`this.server`, `this.logger`, `this.deps`). The convenience class `AIUXRecordElement` extends `AIUXElement` directly and is preferred for view pages — but for Builder-authored widgets, the mixin on `AIUXWidgetElement` is the right choice.

Two things to know:

1. Wrapping `AIUXWidgetElement` means `this.server`, `this.logger`, `this.deps` (the DI proxy), and AIEL/`aiContext` surfacing are all available — nothing is lost by using the mixin. There's no equivalent gap the way there would be extending a plain `AIUXElement` base.
2. The mixin's `this._record` is **nullable** — it returns `null` instead of throwing when there's no ancestor provider. Always guard for that (optional chaining or an explicit "no record" render branch) rather than assuming a provider is present.

The accessor is named exactly `this._record`. There is no `this._recordData`, `this.record`, `this._recordContext` or `this.recordData` on the mixin, and reading one gives `undefined` with no error, so the widget silently renders its "no record" branch. `this._record` is the curated context object (`this._record.apis.form`, …), not raw field values, so read fields through `this._record.apis.form.getValue(...)` / `getDisplayValue(...)`.

It is a getter with no setter, so assigning to it throws a `TypeError`, and declaring your own `@state() _record` (or `static properties` entry) in a widget that uses the mixin shadows the accessor, so every context read returns your state (`undefined` until you set it) instead. If the widget fetches a record itself (for example through `RecordDataManager`), that is a different pattern from this file, and the result needs a different name, such as `_fetchedRecord`.

---

## Already on the Record Page — do NOT render from widgets

core-ui's record page hard-codes part of the page and ships the rest of its body as widgets. A widget on the page adds to it; it never presents **the page's own record** again. **Do not render any of these for the page's own record — that is, under the page's provider, the one your `this._record` reads.**

Fixed page markup, outside the editable body region, so a widget can't replace, move or remove it:

- `<aiux-record-header>` — record title, breadcrumb, action buttons, secondary values
- `<aiux-record-attachments>` — attachment bar
- `<lux-ai-summary-card>` — the AI summary card

Widgets the editable body region ships with:

- `<aiux-record-form>` — the record form, including the activity stream and composer (`<aiux-record-activity-layout>` / `-stream` / `-compose`) when the form view has the activity formatter. There is no `<aiux-record>` element.
- `<aiux-record-related-links>` — related links
- `<aiux-record-related-lists>` — related lists

A widget can only render the same `<aiux-record-form>` the page's form widget renders, so for the page's own record it can't be a better form, and an admin can remove the default widgets, so a widget can't tell whether a second copy would show the form twice. If the user asks for a "form widget" or a "better form" of the page's own record, say the page already shows the form, and offer what a widget can add: summaries, banners, status chips or other extras built from `this._record.apis.form` values. The rule is about the page's own record; the other record components (presence, tags, form messages, and so on) are not banned, and a different record gets its own provider — see the next section.

## Showing a Different Record — your own provider

Record components are presentational: they fetch nothing and need a provider. The page's provider feeds the page's own record. To show **a different record**, or a form in a modal, or on a page that has no record provider (a list page, home page or dashboard), wrap the components in your own `<aiux-record-provider>`. It is a supported pattern, and several independent providers can coexist on one page. Descendants of your provider read that provider's record, not the page's.

```js
html`
  <aiux-record-provider table="incident" sysId=${this._otherSysId}>
    <aiux-record-form layout-variant="flat"></aiux-record-form>
  </aiux-record-provider>
`;
```

- For server rendering, pass a pre-fetched result instead: `<aiux-record-provider .data=${data}>`, with `data` from `RecordDataManager.fetchRecord({table, sysId}, [RecordAPIKey.Form])` in a loader.
- Under a provider, these record components are documented for use on their own. All of them are registered by the record package import this file already uses, and none fetches data, so each needs the provider above it:

  | Component | Use |
  | --- | --- |
  | `<aiux-record-provider>` | Supplies the record and its APIs to the components below it. Takes `table` and `sysId`, or a pre-fetched `.data`. |
  | `<aiux-record-form>` | The record form. Props such as `layout-variant`, `edit-mode`, `variant`, `label-value-layout`, `hide-form-messages`. |
  | `<aiux-record-form-messages>` | Form-level errors, warnings and info in a place you choose. Set `hide-form-messages` on the form so they don't show twice. |
  | `<aiux-record-actions>` | The record's form UI actions (Save, Update, Delete…) with an overflow menu, for example in a modal footer. |
  | `<aiux-record-header>` | A pre-composed record header, plus its building blocks for a custom header layout. |
  | `<aiux-record-related-lists>` | The record's related lists. |

  The record package has many other custom elements, but only these six have usage docs. Don't use any other `aiux-record-*` element unless the user names it.
- Use this for a different record, a modal or a non-record page. Don't use it to re-show the page's own record: pointing a provider at the page's own table and sys_id still duplicates the page's form.

---

## Import Trap — Package Root vs `/context` Subpath

Import record context from the **package root** (`@servicenow/aiux-components-record`), which exports `AIUXRecordElement`, `withRecordContext`, and `RecordContext` — never the `/context` subpath. The root and subpath are built as separate bundles, each with its own `createScopedContext` call, so they produce two unrelated contexts. Core UI's `<aiux-record-provider>` comes from the root bundle, so a widget importing the subpath consumes a context nothing provides and `this._record` stays `null`. To confirm on a build, check whether the built `vN/index.js` and `vN/context.js` each inline `record-context`, or both import it from a shared chunk (`grep -o 'from"[^"]*"'`). The root `index.js` and `context.js` are only shims that load the versioned files.

---

## Creating a New Record Widget

1. Base: `withRecordContext(AIUXWidgetElement)`.
2. Decorator stack — `@customElement`, `@discoverable(true, {requiresPageType: ['record']})`, `@name`, `@description`, `@bestFor`, `@chatCompatible`, `@category`.
3. Declare `static requiredAPIs` with the `RecordAPIKey` values the widget actually reads (e.g. `RecordAPIKey.Form`) — omitting this leaves `this._record.apis.form` unpopulated.
4. Read `this._record` inside `render()`/`willUpdate()`, guarded — it's nullable, never assume a provider is present.
5. Read field values from `record.apis.form.getDisplayValue(...)` / `getValue(...)` inside the non-null branch. Add to the page; don't present the page's own record again. Never render `<aiux-record-form>`, `<aiux-record-related-links>`, `<aiux-record-related-lists>` or the fixed components listed above under the page's provider. A different record, a modal or a non-record page gets its own `<aiux-record-provider>` (see the section above).

```js
import { html, css } from 'lit';
import { customElement } from 'lit/decorators.js';
import { AIUXWidgetElement, decorators } from '@servicenow/aiux-components-core';
import { i18n } from '@servicenow/aiux-services';
import { withRecordContext, RecordAPIKey } from '@servicenow/aiux-components-record';

const { name, description, bestFor, chatCompatible, category, discoverable } = decorators;

@customElement('x-acme-record-summary')
@name('Record Summary')
@description("Shows the current record's short description.")
@bestFor('Summarizing key fields on a record page')
@chatCompatible(false)
@category('custom')
@discoverable(true, { requiresPageType: ['record'] })
export default class RecordSummary extends withRecordContext(AIUXWidgetElement) {
    static requiredAPIs = [RecordAPIKey.Form];

    static styles = css`
        :host {
            display: block;
        }
    `;

    render() {
        const record = this._record; // null outside a provider — never assumed present
        if (!record) {
            return html`<div class="p-4 text-text-tertiary">${i18n.getMessage('No record available')}</div>`;
        }
        const shortDescription = record.apis.form.getDisplayValue('short_description') ?? '—';
        return html`
            <div class="p-4">
                <div>${shortDescription}</div>
            </div>
        `;
    }
}
```

---

## @discoverable's Second Argument — requiresPageType

| Value | Effect |
| --- | --- |
| (omitted) | No restriction — widget appears in the toolbox for any page type |
| `{requiresPageType: ['record']}` | Widget only offered on record pages |
| (any value, when 1st arg is `false`) | Ignored entirely — a non-discoverable widget's options are never read |

`requiresPageType`'s value must agree with the widget's context — a record-context widget pairs with `['record']`.

The ESLint rule `page-type-matches-base-class` recognizes both the convenience class (`AIUXRecordElement`) and the mixin form (`withRecordContext(...)`) via its `PAGE_TYPE_MIXINS` map. It resolves through intermediate variable bindings and TypeScript casts, so `extends withRecordContext(AIUXWidgetElement)` is checked the same as `extends AIUXRecordElement`.

Also note: the `requiresPageType` array must be a static literal (string literals only, from a fixed value set) — it's extracted from the AST at build time, the same mechanism `decorators.md`'s "Build-Time Extraction" section describes for other decorator arguments.

---

## Editing an Existing Record Widget

**Safe to change:**

| Change |
| --- |
| Adding/removing rendered fields |
| Adding a new `@configProperty` |
| Changing loading/error/empty-state markup |
| Changing styles |

**Risky to change:**

| Change |
| --- |
| Removing `withRecordContext(...)` (or swapping `AIUXWidgetElement` out of the mixin call) — loses `this._record` entirely, not just a behavior change |
| Changing `requiresPageType` without re-checking the context still matches (see pairing rule above) |
| Changing the context import path between the package root and a `/context` subpath — these can resolve to two unrelated context instances, so a previously-working `this._record` read can silently start returning null forever |
| Changing `static requiredAPIs` — adding APIs the widget doesn't actually read wastes provider work; removing APIs the widget does read leaves `this._record.apis.*` unpopulated |

After any "risky" change, re-run this skill's `quality/validation-rules.md` Component Structure and Widget-Specific checks, and manually confirm:

1. The context still matches `requiresPageType`.
2. Context is still only read inside `render()`/`willUpdate()`.
3. Every `this._record` read is guarded for `null` — the mixin never throws, but is nullable whenever there's no ancestor provider.

---

## Cross-References

- [List Widgets](list-widgets.md) — the list-context counterpart.
- [Component Patterns](component-patterns.md) — aggregate/chart list-context widgets, `resolvedQuery`/`fixedQuery` querying.
- [Decorators](decorators.md) — full decorator reference, including Build-Time Extraction mechanics.
- [Server Scripts](server-scripts.md) — if the widget also needs `@server(...)` beyond what context already provides.
