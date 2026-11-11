# AIUXControlFieldListConnected

> Source: `@servicenow/aiux-components-control@11.0.22` · `components/controls/docs/usage/aiux-control-field-list-connected.md`

A connected form-field control for the ServiceNow `field_list` field type. It renders an inline trigger showing the currently selected column labels; clicking it opens an `aiux-control-modal` containing an `aiux-list-selector` (from `@servicenow/aiux-components-coe-list-selector`) so the user can pick and order columns from `dependentValue`'s table, then commits the selection back as the field's `value`.

Built in: the trigger/empty-state rendering, the selection modal wiring (footer OK/Cancel actions, list-selector column picking), label resolution when only a raw comma-separated `value` is supplied (via an internal GraphQL fetch controller), and live-update handling. Do not build this modal-and-picker flow yourself.

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

class MyFieldListHost extends AIUXElement {
  static properties = {
    value: {type: String}
  };

  render() {
    return html`
      <aiux-control-field-list-connected
        label="Columns"
        name="columns"
        dependent-value="incident"
        .value=${this.value ?? ''}
        @AIUX_CONTROL_FIELD_LIST_CONNECTED#VALUE_CHANGED=${this._onValueChanged}
      ></aiux-control-field-list-connected>
    `;
  }

  _onValueChanged(e) {
    const {value, displayValue, items} = e.detail;
    this.value = value;
    // displayValue: comma-joined labels; items: [{id, label}, ...]
  }
}
```

**What happens:** the control shows an empty "Click to add" trigger until `dependent-value` (the source table name) is set and the control is not `readonly`. Clicking it opens a modal list selector scoped to that table; confirming with OK commits the picked columns to `value` (a comma-separated list of dot-walked paths) and fires `AIUX_CONTROL_FIELD_LIST_CONNECTED#VALUE_CHANGED`.

### Additional patterns

Supplying an external `liveUpdate` payload (e.g. from a collaborative-editing feed) re-resolves display labels for a value the user did not just enter, as long as `liveUpdate.isUserModified` is falsy. **`value` must be updated alongside `liveUpdate.value`, in the same render** — `_resolveLabelsForValue` sets the display to a "Loading…" placeholder, awaits the fetch, then bails out if `this.value !== value` by the time it resolves. If you only pass `liveUpdate` without also updating `value` to match, the resolved labels are discarded and the field is left stuck showing "Loading…":

```js
html`
  <aiux-control-field-list-connected
    dependent-value="incident"
    .value=${'3,4'}
    .liveUpdate=${{value: '3,4', isUserModified: false}}
  ></aiux-control-field-list-connected>
`;
```

## API

### Properties and attributes

| Property | Attribute | Type | Default | Update behavior | Description |
| --- | --- | --- | --- | --- | --- |
| `value` | `value` | `string` | `''` | Reflects; comma-separated selected column path(s). Setting it externally triggers label re-resolution. | The field value (inherited from the shared control base). |
| `displayValue` | `display-value` | `string` | `''` | Reflects; set by the control after a commit. | Comma-joined display labels for the current `value`. |
| `displayValuesWithPath` | — (`attribute: false`, property only) | `string[]` | `[]` | Property-only; supply alongside `value` to skip the label-resolution fetch. | Pre-resolved display labels, one per selected item, in the same order as `value`. |
| `dependentValue` | `dependent-value` | `string` | `''` | Enables editing and drives the list-selector's `table` and the label-resolution fetch when set/changed. | The source table name this field lists columns from (e.g. the table a Reference field points to). |
| `dependentFieldLabel` | `dependent-field-label` | `string` | `''` | Declared, never read anywhere in `src/`. | Dead property — despite the name, it has no effect on anything this control renders or does. |
| `allowDotWalking` | `allow-dot-walking` | `boolean` | `true` | Passed through to the list selector. | Whether the list selector allows dot-walked (related-table) columns. |
| `includeSysId` | `include-sys-id` | `boolean` | `false` | Passed through to the list selector. | Whether `sys_id` is offered as a selectable column. |
| `showTableDefaultDisplayColumn` | `show-table-default-display-column` | `boolean` | `false` | Read in `willUpdate`; when true and `value`/`dependentValue` conditions are met, auto-populates the table's default display column. | Auto-selects the source table's default display column when no value is set yet. |
| `allowExtendedFields` | `allow-extended-fields` | `boolean` | `false` | Passed through to the list selector and the label-fetch controller. | Whether extended (non-base) fields are selectable/resolvable. |
| `liveUpdate` | — (`attribute: false`, property only) | `LiveUpdate \| undefined` | `undefined` | Property-only; applied in `willUpdate` when it changes and `isUserModified` is falsy. | External live-update payload: `{value?, displayValue?, isUserModified?, isModified?, updatedBy?}`. |
| `referringTable` | `referring-table` | `string` | `''` | Passed to the label-resolution fetch. | Table of the record that owns this field, used for context in the fetch. |

Also inherits the full shared control identity surface from `AIUXControlElement` (`label`, `name`, `placeholder`, `readonly`, `disabled`, `required`, `invalid`, `autofocus`, `nowId`, `controlStyles`, layout/messages/decoration/NACM properties, etc.) — see that base's own behavior for details; this doc covers only what `aiux-control-field-list-connected` adds or uses distinctively.

### Events

| Event | `detail` | Delivery | Fires when | Notes |
| --- | --- | --- | --- | --- |
| `AIUX_CONTROL_FIELD_LIST_CONNECTED#VALUE_CHANGED` | `{value: string, displayValue: string, items: FieldListItem[], name: string, meta?: any}` | Bubbles, composed, cancelable | The user confirms a selection in the modal (OK), or the default display column is auto-populated. | `FieldListItem` is `{id: string, label: string}`. `name` is the control's `name` property, added automatically by the shared action dispatcher. |
| `AIUX_CONTROL_FIELD_LIST_CONNECTED#MODAL_OPENED` | `{name: string, meta?: any}` | Bubbles, composed, cancelable | The edit modal opens. | No payload beyond the standard `name`/`meta` envelope. |
| `AIUX_CONTROL_FIELD_LIST_CONNECTED#MODAL_CLOSED` | `{name: string, meta?: any}` | Bubbles, composed, cancelable | The edit modal closes via Cancel, or the modal's own close/backdrop/escape. | **Does not fire on OK.** `_commitStagedSelection()` (the OK path) closes the modal and dispatches `VALUE_CHANGED` directly, without going through `_closeModal()` — so a successful commit never fires `MODAL_CLOSED`. |

### Slots

None.

### Methods

None beyond the standard `focus()` override (delegates to the trigger button) and `reset()` inherited from the base control.

## Integration details

Renders an `<aiux-control-modal>` internally and imports `@servicenow/aiux-components-coe-list-selector` (`<aiux-list-selector>`) — both must be resolvable in the host's module graph (already handled by this control's own import statements; no separate import needed).

### Platform requirements

Label resolution for a raw `value` (when `displayValuesWithPath` isn't supplied) makes a GraphQL fetch through the control's internal fetch controller; this requires the same ServiceNow GraphQL endpoint access any other connected AIUX control needs.

### SSR

No explicit `isServer` guards in this component's own code; it renders its trigger markup unconditionally and only opens the modal (and issues its label-resolution fetch) in response to user interaction or a `value`/`liveUpdate` change after connection, so nothing runs unguarded at module or constructor scope.

### Lifecycle

`willUpdate` diffs `value`, `liveUpdate`, and `dependentValue` against internally tracked "applied" values to decide whether to re-resolve labels or auto-populate the default display column — set these properties together (not one property mutated repeatedly) to avoid redundant fetches.

**Gotcha:** `_resolveLabelsForValue` (the label-resolution fetch behind a bare `value` with no `displayValuesWithPath`) returns immediately, with no fetch and no error, when `dependentValue` is empty. If you set `value` before `dependentValue` is known, the trigger renders with a blank label even though `value` holds real data — set both together once the source table is known, or supply `displayValuesWithPath` up front to skip the fetch entirely.

### Sizing and layout

The trigger renders at `width: 100%` (host `display: block`). The selection modal opens at `size="lg"`.

## Accessibility, localization, and customization

The empty-state trigger button has an `aria-label` combining a localized "Click to add" string with the field's `label` when present; the filled-state edit button has a localized `aria-label`/`title` of "Edit list". All button copy ("Click to add", "Edit list", "OK", "Cancel", modal header fallback, loading text, and the column-selection instruction) is produced via `@lit/localize`'s `msg()` and is host-locale-driven, not hard-coded English only. There are no exposed CSS parts, slots, or custom-property theming hooks specific to this control; visual styling comes from the shared control layout classes and this component's own `styles.css`.
