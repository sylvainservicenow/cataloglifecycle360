# Chat Integration (withWidgetContext)

Bidirectional communication between AIUX widgets and the AI chat backend. Use when building widgets that need to interact with Now Assist.

---

## Mixin Setup

```js
import {AIUXElement, withWidgetContext} from '@servicenow/aiux-components-core';

class MyWidget extends withWidgetContext(AIUXElement) {
  static aiContext = {
    description: 'Displays a list of incidents with filtering',
    bestFor: 'When the user asks about incidents or wants to filter the list'
  };

  static client_tools = {
    refreshData: {
      description: 'Refresh the widget data with optional filters',
      arguments: [
        {
          name: 'filters',
          description: 'Filter criteria',
          type: 'object',
          required: false
        }
      ],
      // MUST be a regular function — NOT an arrow function
      definition: async function ({filters} = {}) {
        this._filters = filters;
        this.requestUpdate();
        return {success: true};
      }
    }
  };

  firstUpdated() {
    this.setAiContext({tableName: this.table, rowCount: this._rows.length});
  }

  _onRowSelect(e) {
    this.setAiContext({selectedRowId: e.detail.id, tableName: this.table});
  }
}
```

---

## Widget → Chat: `setAiContext(data)`

Push widget state to the chat backend:

```js
this.setAiContext({tableName: this.table, rowCount: this._rows.length});
```

**Behavior:**

- Assigns a stable `data-widget-id` on first call
- Debounces at 100ms (safe to call from reactive property changes)
- Waits for AIEX library to load (safe from `firstUpdated()`)
- No-op after `disconnectedCallback`
- Data must be serializable (no functions, DOM refs, circular objects)

**When to call:**

- `firstUpdated()` — initial state push
- Event handlers — state changes the AI should know about
- `updated()` — when reactive properties change (debounce handles rapid calls)

---

## Chat → Widget: `static client_tools`

Declare named actions the AI chat can invoke on the widget:

```js
static client_tools = {
  selectRecord: {
    description: 'Select a specific record by sys_id',
    arguments: [
      {name: 'sysId', description: 'Record sys_id', type: 'string', required: true}
    ],
    definition: async function({sysId}) {
      this._selectedId = sysId;
      this.requestUpdate();
      return {success: true, selectedId: sysId};
    }
  },
  applyFilter: {
    description: 'Filter the list by field value',
    arguments: [
      {name: 'field', description: 'Field name', type: 'string', required: true},
      {name: 'value', description: 'Field value', type: 'string', required: true}
    ],
    definition: async function({field, value}) {
      this._activeFilter = {field, value};
      await this._fetchData();
      return {success: true, resultCount: this._items.length};
    }
  }
};
```

**How it works:** The mixin calls `toolFn.call(element, args)` — `this` inside `definition` is the element instance.

---

## `definition` Must Be a Regular Function

`client_tools[name].definition` is called with `toolFn.call(element, args)` — `this` is the element instance. Use a regular function or async function so `this` binds correctly.

```js
static client_tools = {
  doThing: {
    definition: async function({id}) {
      await this._loadRecord(id);
      return {success: true};
    }
  }
};
```

---

## `static aiContext`

Metadata that tells the AI when this widget is relevant:

```js
static aiContext = {
  description: 'Shows a dashboard of incident metrics and trends',
  bestFor: 'When the user asks about incident statistics, SLA compliance, or team performance'
};
```

This is read by the platform's widget selection algorithm — be specific about use cases.
