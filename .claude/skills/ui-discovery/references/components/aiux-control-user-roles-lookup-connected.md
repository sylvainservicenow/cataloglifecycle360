# aiux-control-user-roles-lookup-connected

> Source: `@servicenow/aiux-components-control@11.0.22` · `components/controls/docs/usage/aiux-control-user-roles-lookup-connected.md`

A data control for searching and selecting user roles. Host sets `value` (comma-separated committed role names), `displayValue` (matching display labels), and `referringTable` (sent as the GraphQL search scope); the control queries available roles as the user types and reports back the committed selection. It renders no label or messages of its own — those come from the nested `aiux-control-typeahead`, which this control is a thin GraphQL-backed wrapper around.

Built in: debounced server-side role search, comma-delimited multi-select pill state (with comma-safe display-name handling), a `'**'` show-all sentinel for `loadAllRoles`, and single/multi-selection mode switching. Do not build these yourself.

## Import

```js
import '@servicenow/aiux-components-control';
```

## Usage

### Minimal complete example

```js
import {html, isServer} from 'lit';
import {AIUXElement} from '@servicenow/aiux/aiux-components-core';
import '@servicenow/aiux-components-control';

class MyUserRolesHost extends AIUXElement {
  static properties = {
    roles: {type: String},
    roleLabels: {type: String}
  };

  constructor() {
    super();
    this.roles = '';
    this.roleLabels = '';
  }

  render() {
    if (isServer) return html``;
    return html`
      <aiux-control-user-roles-lookup-connected
        name="roles"
        label="Roles"
        referring-table="sys_user"
        .value=${this.roles}
        .displayValue=${this.roleLabels}
        @AIUX_CONTROL_USER_ROLES_LOOKUP_CONNECTED#VALUE_CHANGED=${this._onValueChanged}
      ></aiux-control-user-roles-lookup-connected>
    `;
  }

  _onValueChanged(e) {
    const {value, displayValue} = e.detail;
    this.roles = value;
    // displayValue is a string[] in multi-selection mode; join for storage if needed
    this.roleLabels = Array.isArray(displayValue)
      ? displayValue.join(',')
      : displayValue;
  }
}

customElements.define('my-user-roles-host', MyUserRolesHost);
```

**What happens:** as the user types, the control debounces (300ms) and queries the server for roles matching the input, scoped by `referringTable`. Selecting a role (or several, in multi-selection mode) commits it as a pill; on commit the control dispatches the full comma-joined `value` and a `displayValue` array of the currently selected pills' labels.

### Additional patterns

Single-selection mode (renders a plain input instead of pills). Use a property binding, not `?multiSelection=`: `multiSelection` defaults to `true`, and a boolean-attribute binding only has an effect once the attribute has actually been *set* at least once — if it starts (and stays) absent, `attributeChangedCallback` never fires and the class-field default stands:

```js
html`
  <aiux-control-user-roles-lookup-connected
    name="roles"
    label="Roles"
    referring-table="sys_user"
    .multiSelection=${false}
    .value=${'admin'}
    .displayValue=${'admin'}
  ></aiux-control-user-roles-lookup-connected>
`;
```

Loading every role up front (before the user types anything):

```js
html`
  <aiux-control-user-roles-lookup-connected
    name="roles"
    label="Roles"
    referring-table="sys_user"
    ?loadAllRoles=${true}
  ></aiux-control-user-roles-lookup-connected>
`;
```

## API

### Properties and attributes

| Property | Attribute | Type | Default | Update behavior | Description |
| --- | --- | --- | --- | --- | --- |
| value | value (reflect) | String | `''` | Changing it (along with `displayValue`/`referringTable`/`resultLimit`/`multiSelection`) resets the internal query controller's state (recomputes pills from `value`/`displayValue`). | Comma-separated committed role values, e.g. `'admin,itil'`. |
| displayValue | displayvalue | String \| String[] | `''` | Same reset behavior as `value`. | Comma-separated (or array of) display labels matching `value`'s order. |
| referringTable | referring-table | String | `''` | Changing it resets query state; when empty, `_getVariables` returns `undefined` and the query is skipped entirely. | Table name sent as `fieldReference` in the GraphQL role query. |
| resultLimit | resultlimit | Number | `15` | Changing it resets query state and is forwarded as the query's `limit`. | Maximum number of role suggestions returned per query. |
| multiSelection | multiselection | Boolean | `true` | Changing it resets query state; switches between pill-based multi-select and plain single-select input. | Whether more than one role may be selected. |
| loadAllRoles | loadallroles | Boolean | `false` | Read live via closure inside `_getVariables` on every query — changing it does **not** trigger a controller reset/resync. | When true and the input is empty, sends the `'**'` sentinel to return every role unfiltered instead of skipping the query. |
| label | label | String | `''` | Forwarded as a property binding to the inner `aiux-control-typeahead`, which renders the actual `<label>`. | Field label text. |
| helperContent | helper-content | String | `''` | Forwarded to the inner typeahead. | Hint text shown next to the label. |
| messages | messages | Array | `[]` | Forwarded to the inner typeahead. | Validation/status messages. |
| fieldLayout | fieldlayout | Object | `{layout: 'auto'}` | Forwarded to the inner typeahead. | Layout mode/columns. |
| variant | variant (reflect) | String | `'default'` | Forwarded to the inner typeahead. | Visual density. |
| disabled | disabled (reflect) | Boolean | `false` | Forwarded to the inner typeahead. | Disables the control. |
| readonly | readonly (reflect) | Boolean | `false` | Forwarded to the inner typeahead. | Read-only state; shows the committed value without search. |
| required | required (reflect) | Boolean | `false` | Forwarded to the inner typeahead. | Marks the field required. |
| invalid | invalid (reflect) | Boolean | `false` | Forwarded to the inner typeahead. | Error/invalid visual state. |
| autofocus | autofocus | Boolean | `false` | Forwarded to the inner typeahead as a boolean attribute. | Autofocuses the search input on connect. |
| placeholder | placeholder | String | `''` | Forwarded to the inner typeahead. | Placeholder text. |
| nowAssistConfig | nowassistconfig | Object | `undefined` | Forwarded to the inner typeahead. | Now Assist contextual-menu configuration. |
| referringRecordId | referring-record-id | String | `''` | Forwarded to the inner typeahead. | Sys ID of the host record (NACM context). |
| highlightedValue | highlightedvalue | Array | `[]` | Forwarded to the inner typeahead. | Highlighted-value badge entries. |
| showUnsavedIndicator | show-unsaved-indicator | Boolean | `false` | Forwarded to the inner typeahead. | Shows the unsaved-change indicator. |
| editMode | edit-mode (reflect) | String | `'default'` | Forwarded to the inner typeahead. | Rendering mode (`'default'` \| `'inline'` \| `'display-only'`). |
| wrapLabel | wrap-label | Boolean | `false` | Forwarded to the inner typeahead as a property binding (`.wrapLabel=`), not re-exposed as a boolean attribute on the child. | Whether the label text wraps. |
| hideRequiredIndicator | hide-required-indicator | Boolean | `false` | Forwarded to the inner typeahead as a property binding (`.hideRequiredIndicator=`), not re-exposed as a boolean attribute on the child. | Hides the required-field indicator. |
| name | name | String | `''` | Included as `name` in the dispatched event's `detail`. | Field name identifier. |

### Events

| Event | `detail` | Delivery | Fires when | Notes |
| --- | --- | --- | --- | --- |
| `AIUX_CONTROL_USER_ROLES_LOOKUP_CONNECTED#VALUE_CHANGED` | `{name: string, value: string, displayValue: string \| string[]}` | Bubbles, composed, cancelable | A role selection is committed: a pill is added/synced in multi-selection mode, an option is picked in single-selection mode, input is cleared, or blur resolves/rejects the typed text. | In multi-selection mode `displayValue` is an array of each selected pill's label (not comma-joined, so labels containing a comma are preserved). In single-selection mode it is a plain string. On a blur that matches no valid option, the inner typeahead's controller still calls through with an `error` object attached to its own payload, but only `value`/`displayValue` reach this event's `detail`. |

Five of the `AIUX_CONTROL_TYPEAHEAD#*` events (`STAGED_VALUE_CHANGED`, `VALUE_CHANGED`, `CLICK`, `FOCUS`, `BLUR`) from the nested `aiux-control-typeahead` are intercepted internally via `actionHandlers` with `stopPropagation: true` and never bubble out of this element. However, the typeahead's other two events, `AIUX_CONTROL_TYPEAHEAD#PILL_CLICK` (fired on keyboard activation of a pill) and `AIUX_CONTROL_TYPEAHEAD#RESULT_LIMIT_CLICK` (fired when the "show more" affordance is clicked), are **not** registered in this control's `actionHandlers`, so they do bubble out (bubbles/composed/cancelable) and are observable from outside alongside `AIUX_CONTROL_USER_ROLES_LOOKUP_CONNECTED#VALUE_CHANGED`.

### Slots

None.

### Methods

| Method | Description |
| --- | --- |
| `focus(options?: FocusOptions)` | Delegates focus to the nested `aiux-control-typeahead`. Does not throw if the inner typeahead isn't present yet. |

## Integration details

Requires a GraphQL backend exposing `GlideLayout_Query.userRolesQuery(searchTerm, fieldReference, limit)`. This control extends `AIUXDataControlElement`, not the form-field-layout base — it renders no label, messages, or grid of its own; all of that is delegated to the inner `aiux-control-typeahead`, which this control's `render()` binds every layout-relevant property onto.

### Platform requirements

Needs `referringTable` set to resolve any results; with it empty, the query is skipped entirely (`_getVariables` returns `undefined`) and the typeahead shows no suggestions.

### SSR

`render()` computes its bound `value` via `isServer ? toDisplayString(this.displayValue) : ...`, so on the server it falls back to a plain string derived from `displayValue` rather than reading live query-controller state, keeping the initial render SSR-safe.

### Lifecycle

The `GlideQueryBaseController` is constructed once in the constructor and reset (`updateProps`, which recomputes pills/state from scratch) whenever `value`, `displayValue`, `referringTable`, `resultLimit`, or `multiSelection` change in `updated()`. Search queries are debounced 300ms and re-issued on input; `loadAllRoles` is read fresh from the live property inside the query-variable builder rather than snapshotted, so toggling it does not itself trigger a controller reset.

**Gotcha:** `value` and `displayValue` are paired up positionally, by splitting `value` on commas and indexing into `displayValue` at the same position — there's no matching by role name. If you set `value` to more roles than `displayValue` has entries for (or the two arrays are in different orders), the extra/misaligned pills silently fall back to showing the raw role name instead of its label rather than erroring. Always keep both in the same order and length.

### Sizing and layout

Renders a single `aiux-control-typeahead` bound with `class="w-full"`; sizing/grid layout is entirely delegated to that inner control via the forwarded `fieldLayout`.

## Accessibility, localization, and customization

All accessible markup (the `<label>`, `aria-label` on the search input, pill removal buttons, listbox semantics) is owned by the nested `aiux-control-typeahead`; this control forwards `label`, `configAria` (built here as `{'aria-label': this.label}`), and every other layout/identity property to it rather than rendering any of its own DOM outside that single child element. The one user-facing string this control's own code introduces — the "select a value from the list" validation message on blur mismatch — comes from the shared `GlideQueryBaseController` and is wrapped in `msg()`, so it translates. `label`, `placeholder`, and `helperContent` are fully host-settable. No custom CSS parts or slots are exposed by this control; styling surface is whatever the nested `aiux-control-typeahead` exposes.
