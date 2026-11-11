# AIUXControlFieldLookupConnected

> Source: `@servicenow/aiux-components-control@11.0.22` · `components/controls/docs/usage/aiux-control-field-lookup-connected.md`

A connected form-field control for the ServiceNow `field_lookup` field type. It wraps `<aiux-control-typeahead>` and drives it with a live GraphQL query against `tableName`, searching `fieldName` as the user types, and resolving a pick to either the matched record's `sys_id` or the searched field's own value (`useFieldNameAsKey`).

Built in: the GraphQL query construction (ORDERBY + STARTSWITH/CONTAINS filtering, with `*prefix` switching to CONTAINS), result-to-option mapping, single- and multi-selection state (via the shared `GlideQueryBaseController`), and forwarding of all form-field chrome (label, messages, decorations, NACM, etc.) to the inner typeahead. Do not reimplement this query/typeahead wiring yourself.

## Import

```js
import '@servicenow/aiux-components-control';
```

## Usage

### Minimal complete example

```js
import '@servicenow/aiux-components-control';
import {html} from 'lit';
import {AIUXElement} from '@servicenow/aiux/aiux-components-core';

class MyFieldLookupHost extends AIUXElement {
  static properties = {
    value: {type: String}
  };

  render() {
    return html`
      <aiux-control-field-lookup-connected
        label="Assignment group email"
        name="group_email"
        .tableName=${'sys_user_group'}
        .fieldName=${'email'}
        .value=${this.value ?? ''}
        @AIUX_CONTROL_FIELD_LOOKUP_CONNECTED#VALUE_CHANGED=${this._onValueChanged}
      ></aiux-control-field-lookup-connected>
    `;
  }

  _onValueChanged(e) {
    this.value = e.detail.value;
  }
}
```

**What happens:** as the user types, the control queries `tableName` ordered and filtered by `fieldName`, showing matches in the typeahead dropdown. Selecting one (or, in multi-selection mode, several) commits the resolved value(s) and dispatches `AIUX_CONTROL_FIELD_LOOKUP_CONNECTED#VALUE_CHANGED`.

### Additional patterns

Scoping the query further with an additional condition string, and increasing the result page size:

```js
html`
  <aiux-control-field-lookup-connected
    .tableName=${'sys_user'}
    .fieldName=${'name'}
    .additionalQueryString=${'active=true'}
    .resultLimit=${50}
  ></aiux-control-field-lookup-connected>
`;
```

Enabling multi-selection (renders pills in the typeahead):

```js
html`
  <aiux-control-field-lookup-connected
    .tableName=${'sys_user'}
    .fieldName=${'name'}
    .multiSelection=${true}
  ></aiux-control-field-lookup-connected>
`;
```

## API

### Properties and attributes

| Property | Attribute | Type | Default | Update behavior | Description |
| --- | --- | --- | --- | --- | --- |
| `displayValue` | `displayvalue` | `string \| string[]` | `''` | Re-drives the query controller on change. | The display text (or, in multi-selection, array of display texts) shown for the current value. |
| `tableName` | `tablename` | `string` | `''` | Re-drives the query controller; required for any results. | The table to search. |
| `fieldName` | `fieldname` | `string` | `''` | Re-drives the query controller; required for any results. | The column on `tableName` to search and (by default) return. |
| `additionalQueryString` | `additionalquerystring` | `string` | `''` | Re-drives the query controller. | An extra encoded-query fragment appended (joined with `^`) to the built condition string. |
| `resultLimit` | `resultlimit` | `number` | `20` | Re-drives the query controller. | Maximum rows requested per query (`paginationLimit`). |
| `useFieldNameAsKey` | `usefieldnameaskey` | `boolean` | `false` | Re-drives the query controller and the result mapper. | When `true`, the resolved value is `fieldName`'s own display value instead of the matched record's `sys_id`. |
| `searchOnClick` | `searchonclick` | `boolean` | `true` | Re-drives the query controller; read directly in the click handler. | Whether clicking the (empty) input triggers an initial search. |
| `multiSelection` | `multiselection` | `boolean` | `false` | Re-drives the query controller; switches the typeahead into pill mode. | Enables selecting multiple values, rendered as pills. |

Note: none of this control's own properties declare an explicit Lit `attribute:` option, so per Lit's default their attributes are the property name lowercased as written above (e.g. `tableName` → `tablename`, not `table-name`) — pass them as JS properties (`.tableName=`) in Lit templates to avoid relying on that casing.

Also inherits the shared value/layout/NACM identity surface from `AIUXDataControlElement`/`ControlIdentityBase` (`value`, `label`, `name`, `placeholder`, `readonly`, `disabled`, `required`, `invalid`, `autofocus`, `nowId`, `controlStyles`, `fieldLayout`, `messages`, `decorations`, `highlightedValue`, NACM properties, etc.), all of which are forwarded to the inner `<aiux-control-typeahead>`.

### Events

| Event | `detail` | Delivery | Fires when | Notes |
| --- | --- | --- | --- | --- |
| `AIUX_CONTROL_FIELD_LOOKUP_CONNECTED#VALUE_CHANGED` | `{name: string, value: string \| undefined, displayValue: string \| string[] \| undefined, error?: {type: string, message: string}, meta?: any}` | Bubbles, composed, cancelable | The user selects an option (single selection) or the pill set changes (multi-selection), via the inner typeahead's value-change. | `name` is filled in automatically by the shared action dispatcher from the control's own `name` property. |

The inner typeahead's own `staged-value-changed`/click/focus/blur events are consumed internally to drive the search and are not re-dispatched under their own names.

### Slots

None — this control renders a single internal `<aiux-control-typeahead>`; it does not expose slots of its own.

### Methods

None beyond the standard `focus()` override (delegates to the inner typeahead element).

## Integration details

Imports and renders `@servicenow/aiux-components-control`'s `type-ahead` internally (`<aiux-control-typeahead>`) — no separate import is required by the host.

### Platform requirements

Every keystroke (subject to the typeahead's own debouncing) issues a GraphQL query against `tableName`/`fieldName`, so this control requires the same ServiceNow GraphQL query access as other connected AIUX controls; it makes no server call when `tableName` or `fieldName` is empty (the variables builder short-circuits to an empty, zero-result query).

**Gotcha:** `additionalQueryString` is appended to the built condition string with a plain `^` join and no validation or encoding — it is assumed to already be a well-formed encoded-query fragment (e.g. `'active=true'`). A malformed fragment fails the whole GraphQL query rather than being ignored, so build it the same way you would an encoded query for a `GlideRecord`, not as free text.

### SSR

The render path checks `isServer` explicitly: on the server it renders the typeahead's `value` from `displayValue` (via `toDisplayString`) rather than from the live query controller's in-memory search state, so the component is SSR-safe without additional host guards.

### Lifecycle

`updated()` re-pushes props to the internal `GlideQueryBaseController` whenever any query-relevant property (`value`, `displayValue`, `tableName`, `fieldName`, `additionalQueryString`, `useFieldNameAsKey`, `resultLimit`, `searchOnClick`, `multiSelection`) or the ambient domain context changes.

### Sizing and layout

Host is `display: block` (inherited from `AIUXDataControlElement`); the inner typeahead is rendered at `class="w-full"`.

## Accessibility, localization, and customization

Accessibility is delegated entirely to the inner `<aiux-control-typeahead>`, which receives `configAria={'aria-label': this.label}` plus the standard form-field label/required/invalid wiring — this control adds no accessibility behavior of its own. No strings are hard-coded by this control itself (all visible text — options, loading state, pills — is rendered by the typeahead from data or its own localized strings). There are no exposed CSS parts or custom properties specific to this control; styling is whatever the inner typeahead exposes.
