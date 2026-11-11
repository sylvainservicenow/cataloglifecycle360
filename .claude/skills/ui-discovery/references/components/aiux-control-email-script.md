# aiux-control-email-script

> Source: `@servicenow/aiux-components-control@11.0.22` · `components/controls/docs/usage/aiux-control-email-script.md`

A form-field control that composes an `aiux-control-textarea` with an `aiux-control-content-tree` variable picker side by side. Selecting a field in the picker inserts a `Label: ${field_name}` token at the textarea's caret. It is the plain-text counterpart of `aiux-control-html-script` — same picker and layout, a plain textarea instead of a rich-text editor.

Built in: the editor/picker split layout (wraps to stacked rows when narrow), and the caret-insertion wiring between picker selection and textarea content. Do not build a script-field-plus-token-picker layout or the insertion glue yourself — configure this control instead.

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

class MyHost extends AIUXElement {
  static properties = {
    body: {type: String}
  };

  render() {
    return html`
      <aiux-control-email-script
        name="body"
        label="Notification Body"
        table-name="incident"
        .value=${this.body ?? ''}
        @AIUX_CONTROL_TEXTAREA#VALUE_CHANGED=${this._onCommit}
      ></aiux-control-email-script>
    `;
  }

  _onCommit(e) {
    this.body = e.detail.value;
  }
}
```

**What happens:** the control renders a plain-text textarea on the left and a "Select Variables" tree picker (scoped to `table-name`) on the right. Clicking a field in the picker inserts `FieldLabel: ${field_name}` at the textarea's current caret position. Editing the text dispatches the same `AIUX_CONTROL_TEXTAREA#STAGED_VALUE_CHANGED`/`AIUX_CONTROL_TEXTAREA#VALUE_CHANGED` events as `aiux-control-textarea` itself (they bubble up through this component unchanged).

### Additional patterns

Readonly rendering omits the picker and messages row, delegating straight to the inner textarea's own readonly rendering:

```js
html`<aiux-control-email-script
  name="body"
  label="Notification Body"
  value=${this.body}
  readonly
></aiux-control-email-script>`;
```

Sizing by row count instead of a fixed pixel height (the picker then stretches to match via `align-items: stretch` rather than a fixed height):

```js
html`<aiux-control-email-script
  name="body"
  label="Notification Body"
  value=${this.body}
  rows="8"
  use-rows-height
></aiux-control-email-script>`;
```

## API

### `aiux-control-email-script`

#### Properties and attributes

Textarea pass-through properties — forwarded to the inner `aiux-control-textarea`:

| Property | Attribute | Type | Default | Update behavior | Description |
| --- | --- | --- | --- | --- | --- |
| `description` | `description` | `string \| undefined` | `''` | Forwarded to the inner textarea. | Description text. |
| `rows` | `rows` | `number` | `5` | Forwarded to the inner textarea. | Visible row count. |
| `height` | `height` | `number` | `200` | Forwarded to the inner textarea only when `useRowsHeight` is `false`; also used to size the picker column. | Fixed pixel height. |
| `useRowsHeight` | `use-rows-height` | `boolean` | `false` | When `true`, `height` is not forwarded to the textarea (0 is passed instead, letting `rows` govern height) and the picker column height is left unset so it stretches to match instead. | Switches sizing from a fixed pixel height to a row-count-driven height. In practice this is set by the field renderer only when a field explicitly configures `rows` (or the `default_rows` dictionary attribute) — it is not something most hosts need to flip manually. |
| `color` | `color` | `string` | `'initial'` | Declared but not read anywhere in `render()` or forwarded to the inner textarea. | Not currently used. |

Variable-picker properties — forwarded to the inner `aiux-control-content-tree` (rendered in "variable picker" connected mode):

| Property | Attribute | Type | Default | Update behavior | Description |
| --- | --- | --- | --- | --- | --- |
| `tableName` | `table-name` | `string` | `''` | Forwarded to the picker. | Table the picker's fields are scoped to. |
| `fieldName` | `field-name` | `string` | `''` | Forwarded to the picker. | Field context for the picker query. |
| `referenceTable` | `reference-table` | `string` | `''` | Forwarded to the picker. | Reference table to traverse. |
| `dependentField` | `dependent-field` | `string` | `''` | Forwarded to the picker. | Dependent field name. |
| `dependentValue` | `dependent-value` | `string` | `''` | Forwarded to the picker. | Dependent field value. |
| `dependentDisplayValue` | `dependent-display-value` | `string` | `''` | Forwarded to the picker. | Dependent field display value. |
| `dependentFieldLabel` | `dependent-field-label` | `string` | `''` | Forwarded to the picker. | Dependent field label. |
| `treePickerConfig` | — (`attribute: false`) | `TreePickerConfig \| null` | `null` | Forwarded to the picker. | Advanced picker configuration object. |
| `domainId` | `domain-id` | `string` | `''` | Forwarded to the picker. | Domain scoping id. |
| `query` | `query` | `string` | `''` | Forwarded to the picker. | Picker search/filter query. |
| `select` | `select` | `SelectMode` (`'single' \| ...`) | `'single'` | Forwarded to the picker. | Picker selection mode. |

Also inherited from the shared control base (`AIUXControlElement`/`ControlIdentityBase`): `value`, `name`, `label`, `placeholder`, `required`, `readonly`, `autofocus`, `invalid`, `controlStyles` (attribute `control-styles`), `fieldLayout`, `optional`, `helperContent` (attribute `helper-content`), `hideRequiredIndicator` (attribute `hide-required-indicator`), `wrapLabel` (attribute `wrap-label`), `messages`, `showAIIndicator` (attribute `show-ai-indicator`), `variant` (reflected), `editMode` (attribute `edit-mode`, reflected).

#### Events

| Event | `detail` | Delivery | Fires when | Notes |
| --- | --- | --- | --- | --- |
| `AIUX_CONTROL_TEXTAREA#STAGED_VALUE_CHANGED` | textarea-defined detail shape | `bubbles: true, composed: true, cancelable: true` | The inner textarea's value changes before commit. | Dispatched by the nested `aiux-control-textarea`; passes through this component's shadow boundary unchanged. |
| `AIUX_CONTROL_TEXTAREA#VALUE_CHANGED` | textarea-defined detail shape | `bubbles: true, composed: true, cancelable: true` | The inner textarea commits a changed value. | Same as above. |

Selecting a picker item does not dispatch a public event from this component — it is handled internally (the content-tree's own `AIUX_CONTROL_CONTENT_TREE_CONNECTED#ITEM_CLICKED`, stopped from propagating) and translated directly into an `INSERT_CONTENT` call against the textarea.

#### Slots

None.

#### Methods

| Method | Description |
| --- | --- |
| `focus(options?: FocusOptions)` | Forwards focus to the inner `aiux-control-textarea`. |

### Data shapes

`TreePickerConfig` and `SelectMode` are defined by `aiux-control-content-tree` (imported from `../content-tree` internally) — see that component's own documentation for their shape.

## Integration details

No additional requirements beyond those of `aiux-control-textarea` and `aiux-control-content-tree`, both of which this component loads as static imports.

### Platform requirements

None beyond its two nested controls.

### SSR

Server-safe: the picker-click handler bails out under `isServer`, and layout rendering does not touch `window`/`document`.

### Lifecycle

No special lifecycle beyond standard Lit property updates — unlike `aiux-control-html-script`, the nested textarea has no deferred/idle-loaded dependency.

### Sizing and layout

Editor and picker render side by side (roughly 60/40) using CSS flex-wrap; the pair wraps onto stacked rows when the host is too narrow to fit both, with no `ResizeObserver` involved. This split is independent of `fieldLayout`, which only affects label positioning. The textarea always renders with `resize="none"`. When `useRowsHeight` is `false`, the picker column is capped to `height` pixels to stay aligned with the fixed-height textarea; when `true`, both stretch together via `align-items: stretch`.

Gotcha: unlike `aiux-control-html-script`'s picker (which clamps through the same height-resolution math as its editor), this picker's fixed-height mode uses the raw `height` value directly with no `minHeight`/`maxHeight` clamping — there is no equivalent floor/ceiling on the plain-textarea variant, so an unusually small `height` can make the picker column render shorter than its own content comfortably fits.

## Accessibility, localization, and customization

Inherits all keyboard and screen-reader behavior from the nested `aiux-control-textarea` (no editor-specific behavior of its own). The picker's own label ("Select Variables") is localized via `@lit/localize` `msg()` and is not host-settable. No additional `::part()`/CSS custom property styling surface beyond what the nested textarea and picker expose themselves.
