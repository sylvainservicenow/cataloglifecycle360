# `@externalConfig` — Opening a Platform Table

The `@externalConfig` decorator is a **class-level** decorator that opens a platform table in a record-list editor modal. Use it when configuration is backed by a ServiceNow table rather than individual props pane fields.

## Usage

```js
import {customElement} from 'lit/decorators.js';
import {AIUXElement, externalConfig, decorators} from '@servicenow/aiux-components-core';
import {i18n} from '@servicenow/aiux-services';
const {discoverable, name} = decorators;

@customElement('my-user-list-widget')
@discoverable(true)
@name('User List')
@externalConfig({
  // ── Required ──────────────────────────────────────────────────────────

  // The storage key (since there is no field name to infer from).
  key: 'demoUsers',

  // Must be Array — external config is record-list based.
  type: Array,

  // Record list source. `table` is required.
  list: {
    table: 'sys_user',

    // ── Optional (within list) ────────────────────────────────────────
    query: 'active=true',
    view: '',
    columns: 'user_name,name,email,active'
  },

  // ── Optional ──────────────────────────────────────────────────────────
  label: i18n.getMessage('Demo users')
})
export default class MyUserListWidget extends AIUXElement {}
```

## Stacking

Multiple `@externalConfig` decorators can be stacked on the same class — each opens a separate record-list editor.

## Relationship to `@configProperty`

Both `@configProperty` and `@externalConfig` push into the same `configSchema` array on the prototype and can be mixed on the same class. Use `@configProperty` for individual field-level props pane entries; use `@externalConfig` when the configuration is a record list from a platform table.

The two differ in one important way: `@externalConfig` installs **no** accessor. There is no backing class field, so there is no field initializer and no Lit reactivity for its key — read the value with `this.aiuxConfigData?.demoUsers`. `@configProperty`, by contrast, declares a real reactive Lit property (see `config-field-types.md`).

> Always wrap the `label` in `i18n.getMessage()` from `@servicenow/aiux-services` for translation.

