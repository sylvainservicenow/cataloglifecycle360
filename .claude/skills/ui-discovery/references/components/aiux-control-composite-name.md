# AIUXControlCompositeName

> Source: `@servicenow/aiux-components-control@11.0.22` · `components/controls/docs/usage/aiux-control-composite-name.md`

A form-field control whose `value` is a `table.field` string. In its default "select" mode it renders a table search picker next to a dependent field picker (`aiux-control-fieldname-connected`, scoped to the chosen table); when the `mode_toggler` dictionary attribute is set it also offers a "freeform" mode where the user types the joined `table.field` string directly, with a toggle button next to the label to switch between the two.

Built in: cascading table→field selection (picking a table clears any previously selected field), table-label resolution for a value that arrives with only a raw table name, and — when `mode_toggler` is enabled — per-user, per-field persistence of the select/freeform mode choice (via the platform user-preference API). Do not build your own table/field cascade or mode-persistence for this value shape.

## Import

```js
import '@servicenow/aiux-components-control';
```

## Usage

### Minimal complete example

```js
import {html} from 'lit';
import {AIUXElement} from '@servicenow/aiux/aiux-components-core';
import '@servicenow/aiux-components-control';

class MyCompositeNameField extends AIUXElement {
  static properties = {
    compositeValue: {type: String}
  };

  render() {
    return html`
      <aiux-control-composite-name
        name="my_field"
        label="Field reference"
        .value=${this.compositeValue ?? ''}
        @AIUX_CONTROL_COMPOSITE_NAME#VALUE_CHANGED=${this._onValueChange}
      ></aiux-control-composite-name>
    `;
  }

  _onValueChange(e) {
    const {value} = e.detail;
    this.compositeValue = value;
    // persist value, e.g. update this.compositeValue and request an update
  }
}
```

**What happens:** the user first searches for and picks a table, which enables the field picker scoped to that table; picking a field commits `value` as `table.field` and dispatches `AIUX_CONTROL_COMPOSITE_NAME#VALUE_CHANGED`.

### Additional patterns

Enable the picker/freeform mode toggle (dictionary `mode_toggler`) and scope the field picker's persisted-mode key to a specific record context:

```js
html`
  <aiux-control-composite-name
    name="my_field"
    label="Field reference"
    .value=${this.compositeValue ?? ''}
    .dictionaryAttributes=${{mode_toggler: 'true'}}
    .referringTable=${'incident'}
    @AIUX_CONTROL_COMPOSITE_NAME#VALUE_CHANGED=${this._onValueChange}
    @AIUX_CONTROL_COMPOSITE_NAME#STAGED_VALUE_CHANGED=${this._onStagedChange}
  ></aiux-control-composite-name>
`;
```

With `mode_toggler` enabled, a toggle button appears next to the label; switching to freeform mode swaps the pickers for a single `table.field` text input, and `AIUX_CONTROL_COMPOSITE_NAME#STAGED_VALUE_CHANGED` fires on every keystroke in that mode (there is no staged event in select/picker mode).

## API

### `aiux-control-composite-name`

#### Properties and attributes

| Property | Attribute | Type | Default | Update behavior | Description |
| --- | --- | --- | --- | --- | --- |
| `value` | `value` | `string` | `''` | Reflects to attribute; re-seeds the table search and re-resolves labels | The composite value, `table.field` (or just `table` with no field chosen yet). Single source of truth — the selected table/field are derived from it. |
| `name` | `name` | `string` | `''` | Re-renders | Form field name, echoed back in dispatched event details, and used (with `referringTable`) to key the persisted mode preference. |
| `label` | `label` | `string` | `''` | Re-renders | Field label; the mode-toggle button (when shown) renders inline with it. |
| `readonly` | `readonly` | `boolean` | `false` | Re-renders | Disables editing in both modes; also disables the mode-toggle button. |
| `disabled` | `disabled` | `boolean` | `false` | Re-renders | Disables both pickers/input and the mode-toggle button. |
| `required` | `required` | `boolean` | `false` | Re-renders | Forwarded to both pickers/input. |
| `invalid` | `invalid` | `boolean` | `false` | Re-renders | Forwarded to both pickers/input. |
| `referringRecordId` | `referringrecordid` | `string` | `''` | Forwarded to the nested field picker | Sys ID scoping the field-metadata query. This control redeclares the property without the base class's `attribute: 'referring-record-id'`, so the real attribute here is the lowercased property name, not the kebab-case one the base class documents. |
| `referringTable` | `referringtable` | `string` | `''` | Forwarded to the nested field picker; part of the mode-preference key | Table of the referring record. Same redeclaration caveat as `referringRecordId` above — use a property binding (`.referringTable=${...}`). |
| `dictionaryAttributes` | `dictionaryattributes` | `CompositeNameDictionaryAttributes` | `{}` | Re-renders | See **Data shapes**. Only `mode_toggler` is currently read. |
| `fieldLayout`, `optional`, `helperContent`, `hideRequiredIndicator`, `wrapLabel`, `messages`, `decorations`, `decorationWidgets`, `highlightedValue`, `showAIIndicator`, `showUnsavedIndicator`, `editMode`, `variant`, `fieldContextMenu` | various | various | see base identity/layout properties | Standard form-field layout properties, rendered by this control itself (unlike the data-only controls, this one owns its own label/messages layout). |

#### Events

| Event | `detail` | Delivery | Fires when | Notes |
| --- | --- | --- | --- | --- |
| `AIUX_CONTROL_COMPOSITE_NAME#VALUE_CHANGED` | `{name, value, displayValue}` | bubbles, composed, cancelable | A table is picked, a field is picked, or a freeform edit is committed (blurred/entered) | `value` and `displayValue` are always the same joined `table.field` string; there is no separate human-readable label for the composite value itself. |
| `AIUX_CONTROL_COMPOSITE_NAME#STAGED_VALUE_CHANGED` | `{name, value, displayValue}` | bubbles, composed, cancelable | Only in freeform mode, on every keystroke in the text input | Never fires in the default select/picker mode — there is no per-keystroke event while using the table/field pickers. |

#### Slots

None.

#### Methods

| Method | Description |
| --- | --- |
| `focus(options?: FocusOptions)` | Focuses the nested table `aiux-control-typeahead` in select mode, or the freeform `aiux-control-input` in freeform mode. |

### Internal helpers (not importable)

`src/composite-name/index.ts` exports `parseValue(raw: string | null | undefined) => {table: string; field: string}` (splits a `table.field` string on its first dot, so dot-walked field paths like `table.ref.sub_field` stay intact as `field`) and `joinValue(table: string, field: string) => string` (the inverse — joins a table and field back into `table.field`, or just `table` if `field` is empty, or `''` if `table` is empty). The `<aiux-control-composite-name>` element itself *is* registered when you import `@servicenow/aiux-components-control` — the root entry pulls in `./controls-factory`, which side-effect-imports `../composite-name` — but `src/index.ts` doesn't re-export `parseValue`/`joinValue` from that module, and the package's `exports` map exposes just `"."`. So the element works normally; only these two helper functions can't be imported. Re-implement the split/join logic yourself if you need it.

### Data shapes

`CompositeNameValueChangedDetail`: `{name: string; value: string; displayValue: string}`.

`CompositeNameDictionaryAttributes`: `{mode_toggler?: string}` — any value considered truthy (via the shared `isTruthy` helper) enables the select/freeform mode toggle.

## Integration details

### Platform requirements

Table search and table-label resolution go over the platform GraphQL client (`/api/now/graphql`), scoped by `referringTable`. Field search/metadata is delegated to the nested `aiux-control-fieldname-connected`, which uses the same client. When `mode_toggler` is enabled, the select/freeform mode preference is keyed as `mode_<referringTable>.<name>` and is read on mount via a `GET` to the platform's `/api/now/ui/user/current/preferences` endpoint, but written on every toggle via the platform's `setUserPreference` helper, which issues a GraphQL mutation against `/api/now/graphql` (not the REST preferences endpoint) and also patches the local reactive user-preferences context. Both the read and the write require `referringTable` and `name` to be set, otherwise no preference is read or written and the control always starts in select mode.

### SSR

No direct `window`/`document` access in this component's own code; the mode-preference `fetch()` call only runs client-side after `firstUpdated()`. Safe to render on the server.

### Lifecycle

On `firstUpdated`, if `mode_toggler` is enabled, asynchronously loads the saved select/freeform mode preference and switches to it if present. Changing `value` re-seeds the table search controller and, if the table portion changed, re-resolves its display label.

**Gotchas:** `_setValue` is a no-op when the newly joined `table.field` equals the current `value`, so re-selecting the same table or field a user already has selected never fires `VALUE_CHANGED` — don't rely on that event to detect "the user interacted with the picker." Toggling from freeform back to select mode does not validate the typed text first: whatever was typed is split on its first dot and fed straight into the table search/label resolution and the field picker's `dependentValue`; an unresolvable table name just falls back to showing the raw table string with no field options (the field picker disables itself since `dependentValue` effectively can't be looked up), not an error.

### Sizing and layout

Renders its core UI as `role="group"` flex row (`flex gap-2`) containing either the two pickers or the single freeform input, each `flex-1`; standard form-field label/messages layout wraps this via the shared layout mixin.

## Accessibility, localization, and customization

The control body is wrapped in `role="group"` with an accessible "Composite name" label (localized). The mode-toggle button (when `mode_toggler` is enabled) has `aria-pressed` reflecting the current mode and an `aria-label` describing the action it will perform ("Switch to freeform input" / "Switch to table and field pickers"), plus a tooltip ("Change mode"). Keyboard/ARIA semantics for table search and field selection are owned by the nested `aiux-control-typeahead` and `aiux-control-fieldname-connected` respectively. All user-facing strings ("Select table", "Select field", "table.field" placeholder, "Composite name", "Change mode", and the toggle's aria-labels) are produced via `@lit/localize`'s `msg()` and are localizable; none are host-settable overrides. No CSS custom properties or `::part()` selectors are exposed.
