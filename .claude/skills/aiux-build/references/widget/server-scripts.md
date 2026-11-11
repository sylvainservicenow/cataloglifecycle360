# Server Script Patterns

Server scripts run on the ServiceNow server when widgets call `this.server.get()`. They use ServiceNow server-side JavaScript with access to GlideRecord, GlideQuery, and other ServiceNow APIs.

---

## Server Script Structure

**Use `export default function` — the build pipeline compiles it to an IIFE at deploy time.**

Server scripts are ES module files. The Rollup build step wraps them into the IIFE format the Glide runtime expects. Always write server scripts as exported functions:

```js
export default function server(data, _options, input) {
  // your logic — assign fields to `data` to return them to the client
}
```

### Standard pattern

```js
export default function server(data, _options, input) {
  var action = (input && input.action) || 'getItems';

  if (action === 'getItems') {
    try {
      var items = [];
      var gr = new GlideRecordSecure('incident');
      gr.setLimit(50);
      gr.query();

      while (gr.next()) {
        items.push({
          sys_id: gr.getUniqueValue(),
          number: gr.getValue('number'),
          description: gr.getValue('short_description'),
          state: gr.getDisplayValue('state'),
          priority: gr.getDisplayValue('priority')
        });
      }

      data.items = items;
      data.count = items.length;
    } catch (e) {
      gs.error('MyWidget handleGetItems: ' + e.message);
      data.isError = true;
      data.errorMessage =
        gs.getMessage('Failed to load data') + ': ' + e.message;
    }
  }
}
```

### Truncation awareness with `setLimit()`

When the server uses `setLimit()` to cap results, always return `data.hasMore` and `data.totalAvailable` so the client can display a truncation notice. Use `GlideAggregate` for the total count (never `getRowCount()`):

```js
// After the query loop:
var ga = new GlideAggregate('incident');
ga.addAggregate('COUNT');
ga.addQuery('active', true);
ga.query();
var totalAvailable = 0;
if (ga.next()) {
  totalAvailable = parseInt(ga.getAggregate('COUNT'), 10);
}

data.items = items;
data.total = items.length;
data.totalAvailable = totalAvailable;
data.hasMore = totalAvailable > items.length;
```

### Importing shared utilities

```js
import {getPriorityLabel, truncate} from './utils/format.js';

export default function server(data, _options, _input) {
  // Rollup inlines the import at build time
  var label = getPriorityLabel(1);
  data.label = label;
}
```

---

## Client-Server Communication

### Client Side

```js
// Simple fetch (executes default server action)
const response = await this.server.get();

// With parameters
const response = await this.server.get({
  action: 'getIncidents',
  sortOrder: 'recent',
  limit: 10
});

// Re-fetch default data (no action dispatch)
await this.server.update();
```

### Server Side Receives

```js
export default function server(data, _options, input) {
  // input.action → 'getIncidents'
  // input.sortOrder → 'recent'
  // input.limit → 10
}
```

---

## Parameter Handling

### Priority: input > options > default

```js
var sysId = (input && input.sysId) || options.sysId;
var table = (input && input.table) || options.table || 'incident';
var limit = parseInt(input.limit, 10) || 10;
```

### Early Return Guard

```js
if (!input || !input.action) {
  return; // Only respond to explicit actions
}
```

### Null/Empty Checks

```js
if (gs.nil(input.userId)) return;
if (gs.nil(input.table)) {
  data.isError = true;
  data.errorMessage = gs.getMessage('Table parameter is required');
  return;
}
```

---

## GlideRecord Patterns

### Query with Security

Always use `GlideRecordSecure` (enforces ACLs):

```js
var gr = new GlideRecordSecure('incident');
gr.setLimit(50);
gr.addEncodedQuery('active=true^ORDERBYDESCsys_created_on');
gr.query();
```

To restrict which columns are fetched, use GlideQuery with `.select()` instead — GlideRecord has no field-selection API:

```js
var results = new GlideQuery('incident')
  .where('active', true)
  .orderByDesc('sys_created_on')
  .select('number', 'short_description', 'state', 'priority')
  .limit(50)
  .toArray(50);
```

### Single Record Lookup

```js
var gr = new GlideRecordSecure('incident');
if (gr.get(input.sysId)) {
  if (!gr.canRead()) {
    data.isError = true;
    data.errorMessage = gs.getMessage('Access denied');
    return;
  }
  data.record = {
    sys_id: gr.getUniqueValue(),
    number: gr.getValue('number'),
    short_description: gr.getValue('short_description'),
    assigned_to: gr.getDisplayValue('assigned_to')
  };
} else {
  data.isError = true;
  data.errorMessage = gs.getMessage('Record not found');
}
```

### Field Access Methods

| Method                     | Returns          | Use for                           |
| -------------------------- | ---------------- | --------------------------------- |
| `getValue('field')`        | Raw string value | Sys_ids, numbers, internal values |
| `getDisplayValue('field')` | Display string   | Reference fields, choice labels   |
| `getUniqueValue()`         | Record sys_id    | Always use for sys_id             |
| `getBooleanValue('field')` | `true`/`false`   | Boolean fields                    |

### Aggregation

```js
var ga = new GlideAggregate('incident');
ga.addAggregate('COUNT');
ga.addQuery('active', true);
ga.query();
if (ga.next()) {
  data.totalCount = parseInt(ga.getAggregate('COUNT'), 10);
}
```

---

## GlideQuery (Modern API)

```js
var results = new GlideQuery('incident')
  .where('active', true)
  .where('priority', '<=', 2)
  .select('number', 'short_description', 'state')
  .limit(20)
  .toArray(20);

data.items = results.map(function (r) {
  return {
    sys_id: r.sys_id.value,
    number: r.number.value,
    description: r.short_description.value
  };
});
```

### Field Selection with `.select()`

Use GlideQuery when you need to restrict the columns the server fetches. `sys_id` is always returned automatically.

```js
var results = new GlideQuery('incident')
  .where('active', true)
  .orderByDesc('sys_created_on')
  .select('number', 'short_description', 'state', 'priority', 'assigned_to')
  .limit(50)
  .toArray(50);

data.items = results.map(function (r) {
  return {
    sys_id: r.sys_id.value,
    number: r.number.value,
    description: r.short_description.value,
    state: r.state.displayValue,       // .displayValue for choice/reference fields
    priority: r.priority.displayValue,
    assigned_to: r.assigned_to.displayValue
  };
});
```

> `r.<field>.value` — raw stored value (sys_id, number, internal code)
> `r.<field>.displayValue` — human-readable label (choice fields, reference display values)

---

## Action Routing

### If-chain (small widgets, 1-2 actions)

```js
export default function server(data, _options, input) {
  if (input && input.action === 'feedback') {
    // handle feedback
  }
}
```

### Handler map (recommended for 3+ actions)

```js
export default function server(data, _options, input) {
  var actionHandlers = {
    getList: handleGetList,
    getRecord: handleGetRecord,
    updateRecord: handleUpdateRecord
  };

  var action = (input && input.action) || 'getList';
  var handler = actionHandlers[action];
  if (handler) {
    handler();
  }

  function handleGetList() {
    /* ... */
  }
  function handleGetRecord() {
    /* ... */
  }
  function handleUpdateRecord() {
    /* ... */
  }
}
```

---


## Scope Restrictions

AIUX widgets can deploy into either the **Global** scope or a **scoped application** — check which one before using scope-restricted APIs. Certain APIs only work in Global and fail (throw an error) when called from a scoped widget.

### `GlideTableDescriptor` — avoid; use `GlideRecordSecure` instead

`GlideTableDescriptor` is legacy and only available in the Global scope — it throws when called from a scoped application. Prefer `GlideRecordSecure`, which works in both scoped and Global, to check table existence.

```js
// Avoid — legacy, Global scope only; throws error in a scoped application
var isValid = GlideTableDescriptor.isValid(input.table);

// Preferred — works in both scoped and Global
var isValid = new GlideRecordSecure(input.table).isValid();
```
---

## Security Rules

1. **Always `GlideRecordSecure`** — not plain `GlideRecord`
2. **Restrict fetched columns with GlideQuery** — GlideRecord fetches all columns and has no field-selection API; use GlideQuery with `.select('field1', 'field2')` when you need to limit what the server returns
3. **Always `setLimit()`** — default to 50 if unspecified
4. **Always `canRead()`/`canWrite()` after `.get()`** — check before accessing fields
5. **Validate all input** — defaults, parseInt, known action names
6. **Error shape**: `data.isError = true` + `data.errorMessage` that includes the actual error (`e.message`) — not a generic string alone
7. **Use `gs.getMessage()`** for all user-facing strings

---

## Script Includes

For reusable server logic, create Script Includes:

```js
// In server script
var helper = new global.MyAppHelper();
var result = helper.processRecords(input.table, input.query);
data.items = result;
```

---

## Debugging Server Scripts

```js
gs.info('MyWidget - action: ' + input.action);
gs.info('MyWidget - input: ' + JSON.stringify(input));
gs.info('MyWidget - query returned: ' + items.length + ' records');
```

View logs in: **System Logs → System Log → All** (filter by source)

### Common Pitfalls

- `getValue` in loops is fine; `getDisplayValue` in loops can be slow for reference fields — batch if >50 rows
- Use `GlideAggregate` for counts — `getRowCount()` fetches all rows into memory.
- `addNotNullQuery('field')` is the correct way to filter non-empty fields
