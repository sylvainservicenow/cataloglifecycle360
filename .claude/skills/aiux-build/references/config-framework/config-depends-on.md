# Conditional Visibility — `dependsOn`

The `dependsOn` option on `@configProperty` makes a field visible only when another field's value meets a condition. When the parent field changes and the condition is no longer met, the props pane clears the dependent field to `''`.

```js
import {configProperty} from '@servicenow/aiux-components-core';
import {i18n} from '@servicenow/aiux-services';
```

## Exists — Show When Parent Has Any Non-Empty Value

The field is visible when the parent value is not `null`, `undefined`, or `''`.
Falsy values like `0` and `false` are treated as **having a value** and will keep the dependent field visible.

```js
@configProperty({type: String, label: i18n.getMessage('Source')})
source = '';

@configProperty({
  type: String,
  label: i18n.getMessage('Source Detail'),
  dependsOn: {key: 'source'}
})
sourceDetail = '';
```

## Equals — Show When Parent Matches a Specific Value

```js
@configProperty({
  type: String,
  label: i18n.getMessage('Category'),
  choices: [{value: 'shirt', label: i18n.getMessage('Shirt')}, {value: 'pants', label: i18n.getMessage('Pants')}]
})
category = '';

@configProperty({
  type: String,
  label: i18n.getMessage('Shirt Size'),
  dependsOn: {key: 'category', value: 'shirt'},
  choices: [{value: 's', label: i18n.getMessage('S')}, {value: 'm', label: i18n.getMessage('M')}, {value: 'l', label: i18n.getMessage('L')}]
})
shirtSize = '';
```

## One-of — Show When Parent Matches Any Value in an Array

```js
@configProperty({
  type: String,
  label: i18n.getMessage('Outerwear'),
  choices: [{value: 'hoodie', label: i18n.getMessage('Hoodie')}, {value: 'jacket', label: i18n.getMessage('Jacket')}, {value: 'vest', label: i18n.getMessage('Vest')}]
})
outerwearType = '';

@configProperty({
  type: String,
  label: i18n.getMessage('Size'),
  dependsOn: {key: 'outerwearType', value: ['hoodie', 'jacket']},
  choices: [{value: 'xs', label: i18n.getMessage('XS')}, {value: 's', label: i18n.getMessage('S')}, {value: 'm', label: i18n.getMessage('M')}, {value: 'l', label: i18n.getMessage('L')}]
})
outerwearSize = '';
```

## Auto-Clear Behavior

When the parent field's value changes and the dependent field's condition no longer matches, the props pane emits a `field-changed` event that resets the dependent field to `''`. This prevents stale orphaned values.

Because `''` is a *defined* value it becomes an active override (see Semantics rule 2 in `config-field-types.md`) — the field does **not** fall back to its initializer until an admin clears the saved value. Give auto-clearable fields an `''` initializer so the cleared state and the initial state look the same.

## Deep Chains

`dependsOn` chains can be arbitrarily deep (A → B → C → …). When the root field changes and a dependent field is cleared, the auto-clear propagates transitively — any field that depends on the cleared field is also evaluated and cleared if its condition no longer matches.

```js
@configProperty({type: String, label: i18n.getMessage('Theme'), choices: [...]})
themeMode = '';

@configProperty({type: String, label: i18n.getMessage('Accent Color'), dependsOn: {key: 'themeMode'}, choices: [...]})
accentColor = '';

@configProperty({type: String, label: i18n.getMessage('Font Size'), dependsOn: {key: 'accentColor'}, choices: [...]})
fontSize = '';
// Clearing "Theme" → clears "Accent Color" → clears "Font Size"
```

## Circular Dependencies

Circular `dependsOn` chains (e.g. A depends on B, B depends on A) are detected at **decoration time** and produce a `console.error` naming the cycle — `circular dependsOn detected — "b" → "a" → "b"` — plus a warning that circular dependencies may cause unexpected auto-clear behavior.

At runtime, the auto-clear uses a visited set to prevent infinite loops — each field is cleared at most once per change event. Circular chains are gracefully handled but should be treated as authoring mistakes.
