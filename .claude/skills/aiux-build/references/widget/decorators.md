# Decorators

## Imports

`@customElement` comes from `lit/decorators.js`. All AIUX platform decorators come from `@servicenow/aiux-components-core` via `decorators`.

```js
import {customElement} from 'lit/decorators.js';
import {AIUXWidgetElement, decorators} from '@servicenow/aiux-components-core';
const {
  name,
  description,
  discoverable,
  bestFor,
  server,
  chatCompatible,
  interactiveViewCompatible,
  category,
  demo,
  explicitSysId
} = decorators;
```

---

## Reference

| Decorator                    | Type    | Required    | Description                                                  |
| ---------------------------- | ------- | ----------- | ------------------------------------------------------------ |
| `@customElement`             | string  | **Yes**     | Tag name for the web component                               |
| `@discoverable`              | boolean | **Yes**     | Makes widget visible in the platform registry                |
| `@discoverable` 2nd arg      | object  | No          | `requiresPageType`: `['list']` or `['record']`; see below    |
| `@bestFor`                   | string  | **Yes**     | Describes ideal use cases; helps AI agents select the widget |
| `@name`                      | string  | Recommended | Display name                                                 |
| `@description`               | string  | Recommended | 1–2 sentences on what the widget does                        |
| `@server`                    | string  | No          | Relative path to server script (e.g. `'./server.js'`)        |
| `@chatCompatible`            | boolean | No          | Widget works in chat interfaces                              |
| `@interactiveViewCompatible` | boolean | No          | Widget can render in the chat interactive view panel         |
| `@category`                  | string  | No          | `'custom'` (default) or `'platform'`                         |
| `@demo`                      | boolean | No          | Widget only installs when demo data is opted into            |
| `@explicitSysId`             | string  | No          | Hardcoded 32-char hex sys_id                                 |

The second `@discoverable` argument, `{requiresPageType: ['record'|'list']}`, restricts the widget to record or list pages in the toolbox. Omit it for no restriction; it is ignored when the first argument is `false`. Pair it with the matching base class — see `widget/record-widgets.md` or `widget/list-widgets.md`.

**Page-only decorators** (from `decorators`):

| Decorator | Type    | Required | Description                                               |
| --------- | ------- | -------- | --------------------------------------------------------- |
| `@title`  | string  | Optional | Display title in platform UI                              |
| `@global` | boolean | Optional | Pages are **global by default** (no decorator needed) — resolvable from any experience. `@global(false)` binds the page to the experience resolved from `aiux.json`, so it's only reachable from that experience. Typical case: a `home` page. (Extension pages are private to their host experience by default — this decorator is for standalone application pages.) |

---

## Widget Example

```js
@customElement('aiux-employee-profile-card')
@discoverable(true)
@name('Employee Profile Card')
@description(
  'Displays an employee profile card with personal details and team information'
)
@bestFor(
  'Providing comprehensive employee profile views in dashboards and detail pages'
)
@chatCompatible(true)
@category('custom')
@server('./server.js')
export default class EmployeeProfileCard extends AIUXWidgetElement {}
```

---

## Page Example

```js
@customElement('my-app-home')
@title('Home')
@global(false)
export default class HomePage extends AIUXElement { ... }
```

---

## `@explicitSysId`

**Do not use unless the user explicitly asks to hardcode a sys_id, or it is already present.** Sys_ids are auto-generated from the scope and tag name by default.

- 32-character lowercase hex string, unique across all widgets
- **Once set, NEVER change the value** — changing it breaks all existing references

---

## Build-Time Extraction

AIUX platform decorators are **build-time metadata** — arguments are extracted from the AST without executing the code. **Arguments must be static literals** — no variables, expressions, template literals, or function calls.

```js
// Static string literals only
@name('My Widget')
@bestFor('Showing incident details in a compact card')
```
