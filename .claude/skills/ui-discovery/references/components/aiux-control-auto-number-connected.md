# aiux-control-auto-number-connected

> Source: `@servicenow/aiux-components-control@11.0.22` · `components/controls/docs/usage/aiux-control-auto-number-connected.md`

A single-line text control wrapping `<aiux-control-input>`, with a trailing button that calls the platform's `GetNextNumberAjax` processor to fetch and commit the next number in the sequence for `referringTable`/`name`. The host sets identity/layout props and reads the committed or staged value back off the dispatched events.

Built in: the trailing generate button (hidden when readonly), request cancellation via `AbortController` on disconnect/reconnect, and error surfacing when generation fails. Do not build a separate "generate next number" fetch or button yourself — configure this control instead.

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
    number: {type: String}
  };

  render() {
    return html`
      <aiux-control-auto-number-connected
        name="number"
        label="Number"
        referring-table="incident"
        .value=${this.number ?? ''}
        @AIUX_CONTROL_AUTO_NUMBER_CONNECTED#VALUE_CHANGED=${this._onCommit}
      ></aiux-control-auto-number-connected>
    `;
  }

  _onCommit(e) {
    const {value, error} = e.detail;
    this.number = value;
    if (error) {
      // error.message is a localized, user-facing string
    }
  }
}
```

**What happens:** the field renders as a plain text input with a trailing icon button. Typing dispatches `AIUX_CONTROL_AUTO_NUMBER_CONNECTED#STAGED_VALUE_CHANGED` on every keystroke; blurring the input commits and dispatches `AIUX_CONTROL_AUTO_NUMBER_CONNECTED#VALUE_CHANGED`. Clicking the generate button fetches the next number for `referring-table`/`name` from the server and commits it the same way.

### Additional patterns

Because event names contain a literal `#`, `@`-binding them in a Lit template (as above) works, but with `addEventListener` you must pass the string exactly:

```js
el.addEventListener(
  'AIUX_CONTROL_AUTO_NUMBER_CONNECTED#VALUE_CHANGED',
  e => console.log(e.detail.value)
);
```

Readonly display hides the generate button entirely:

```js
html`<aiux-control-auto-number-connected
  name="number"
  label="Number"
  value=${this.number}
  readonly
></aiux-control-auto-number-connected>`;
```

## API

### `aiux-control-auto-number-connected`

#### Properties and attributes

| Property | Attribute | Type | Default | Update behavior | Description |
| --- | --- | --- | --- | --- | --- |
| `value` | `value` (reflect) | `string` | `''` | Forwarded to the inner `<aiux-control-input>`; updated in place when a value is committed. | The field's committed value. |
| `name` | `name` | `string` | `''` | Read on generate click (as the field name sent to the server) and included in every dispatched event `detail`. | Field name identifier; also required (non-empty) for the generate button to act. |
| `label` | `label` | `string` | `''` | Forwarded to the inner input, which renders the actual label chrome. | Field label text. |
| `referringTable` | `referring-table` | `string` | `''` | Read on generate click as the table to query; forwarded to the inner input. Required (non-empty) for the generate button to act. | Table the auto-number sequence belongs to. |
| `referringRecordId` | `referring-record-id` | `string` | `''` | Forwarded to the inner input. | Referring record identifier, forwarded for NACM context. |
| `maxlength` | `maxlength` | `number \| undefined` | `undefined` | Forwarded to the inner input's `maxlength`. | Maximum character length for manual editing. |
| `disabled` | `disabled` (reflect) | `boolean` | `false` | Forwarded to the inner input; also disables the generate button and gates `_onGenerateClick`. | Disables the whole control. |
| `readonly` | `readonly` (reflect) | `boolean` | `false` | Forwarded to the inner input; also hides the generate button and gates `_onGenerateClick`. | Read-only display. |
| `required` | `required` (reflect) | `boolean` | `false` | Forwarded to the inner input. | Marks the field required. |
| `invalid` | `invalid` (reflect) | `boolean` | `false` | Forwarded to the inner input. | Marks the field invalid. |
| `autofocus` | `autofocus` | `boolean` | `false` | Forwarded to the inner input as the `autofocus` boolean attribute. | Focuses the inner input on mount. |
| `fieldLayout` | `fieldlayout` | `{layout?: 'vertical' \| 'horizontal' \| 'auto', columns?: string[]}` | `{layout: 'auto'}` | Forwarded to the inner input, which owns all layout rendering; set as a property (`.fieldLayout=`) in practice since it's an object. | Label/control layout, resolved by the inner input. |
| `optional` | `optional` | `boolean` | `false` | Forwarded to the inner input. | Suppresses the required indicator via the inner input's own logic. |
| `helperContent` | `helper-content` | `string` | `''` | Forwarded to the inner input. | Helper text shown by the inner input. |
| `hideRequiredIndicator` | `hide-required-indicator` | `boolean` | `false` | Forwarded to the inner input via a `.hideRequiredIndicator=` property binding (not the `?hide-required-indicator=` boolean-attribute form). | Hides the required-field indicator. |
| `wrapLabel` | `wrap-label` | `boolean` | `false` | Forwarded to the inner input via a `.wrapLabel=` property binding (not the `?wrap-label=` boolean-attribute form). | Allows the label to wrap instead of truncating. |
| `messages` | `messages` | `ControlMessage[]` | `[]` | Forwarded to the inner input, which renders them; set as a property (`.messages=`) in practice since it's an array. | Validation/status messages; each is `{status, content, icon?, debug?}`. |
| `decorations` | `decorations` | `Decoration[]` | `[]` | Forwarded to the inner input; set as a property in practice. | Label-row decorations (`{icon, text}`), rendered by the inner input. |
| `decorationWidgets` | `decorationwidgets` | `DecorationWidget[]` | `[]` | Forwarded to the inner input; set as a property in practice. | Custom widget slots rendered by the inner input's addon area. |
| `highlightedValue` | `highlightedvalue` | `HighlightedValue[]` | `[]` | Forwarded to the inner input, which renders the status badges; set as a property in practice. | Highlighted-value badge entries. |
| `showAIIndicator` | `show-ai-indicator` | `boolean` | `false` | Forwarded to the inner input. | Shows the AI-generated indicator on the label. |
| `showUnsavedIndicator` | `show-unsaved-indicator` | `boolean` | `false` | Forwarded to the inner input. | Shows the unsaved-change indicator. |
| `editMode` | `edit-mode` (reflect) | `'default' \| 'inline' \| 'display-only'` | `'default'` | Forwarded to the inner input dynamically (re-evaluated each render). | Rendering mode, resolved by the inner input. |
| `variant` | `variant` (reflect) | `'default' \| 'compact'` | `'default'` | Forwarded to the inner input. | Visual density. |
| `nowAssistConfig` | `nowassistconfig` | `NacmConfig \| undefined` | `undefined` | Forwarded to the inner input; set as a property in practice since it's an object. | Now Assist Contextual Menu configuration. |
| `fieldContextMenu` | property only (`attribute: false`) | `FieldContextMenuConfig \| undefined` | `undefined` | Forwarded to the inner input. | Right-click personalize/configure menu, set by the controls factory. |
| `placeholder` | `placeholder` | `string` | `''` | Not currently used — inherited from the shared control base but never read or forwarded by this control. | Reserved. |
| `labelUrl` | `label-url` | `string \| undefined` | `undefined` | Not currently used — inherited but never read or forwarded. | Reserved. |
| `labelUrlTarget` | `label-url-target` | `string` | `'_blank'` | Not currently used — inherited but never read or forwarded. | Reserved. |
| `nowId` | `now-id` | `string` | `''` | Not currently used — inherited but never read or forwarded. | Reserved. |
| `controlStyles` | `control-styles` | `string` | `''` | Not currently used — inherited but never read or forwarded. | Reserved. |
| `formData` | property only (`attribute: false`) | `ControlFormData \| undefined` | `undefined` | Not currently used — inherited but never read or forwarded. | Reserved. |

#### Events

| Event | `detail` | Delivery | Fires when | Notes |
| --- | --- | --- | --- | --- |
| `AIUX_CONTROL_AUTO_NUMBER_CONNECTED#VALUE_CHANGED` | `{name: string, value: string, error: {type: 'error', message: string} \| null}` | `bubbles: true, composed: true, cancelable: true` | The inner input commits on blur, or a generate-button fetch resolves (success or failure). | Dispatched via the shared `dispatchAction` helper, which also injects the current `name` into `detail`. Skipped when the value is unchanged and there is no error. |
| `AIUX_CONTROL_AUTO_NUMBER_CONNECTED#STAGED_VALUE_CHANGED` | `{name: string, value: string}` | `bubbles: true, composed: true, cancelable: true` | The inner input's value changes before blur (every keystroke). | Does not mutate `value`. |

#### Slots

None (the generate button is rendered into the inner `<aiux-control-input>`'s `end` slot internally; the host does not place content into this control directly).

#### Methods

| Method | Description |
| --- | --- |
| `focus(options?: FocusOptions)` | Delegates focus to the inner `<aiux-control-input>`. |

### Data shapes

`AutoNumberError`:

| Property | Type | Description |
| --- | --- | --- |
| `type` | `'error'` | Fixed discriminator. |
| `message` | `string` | Localized, user-facing error message (e.g. "Unable to generate Auto Number."). |

## Integration details

Fetches the next number via `POST /xmlhttp.do?sysparm_processor=GetNextNumberAjax&sysparm_name=<referringTable>.<name>`, parsing an XML `<item value="...">` response. The in-flight request is cancelled (`AbortController.abort()`) on `disconnectedCallback` and re-armed with a fresh controller on the next `connectedCallback`.

**Gotcha:** `_onGenerateClick` requires both `referringTable` and `name` to be non-empty before it does anything, but the button's own `?disabled` binding only checks `disabled`/in-flight state — it never reflects a missing `referringTable`/`name`. If either is unset, the button still renders enabled and clickable, and clicking it is a complete no-op (no fetch, no error, no event). Always set `referringTable` alongside `name` before rendering this control.

### Platform requirements

Requires the `/xmlhttp.do` `GetNextNumberAjax` processor to be reachable from the host page (same-origin, credentials included).

### SSR

Safe to render on the server: the fetch only runs from a user click (`_onGenerateClick`), never during `connectedCallback` or `render()`.

### Lifecycle

`connectedCallback` creates a fresh `AbortController`; `disconnectedCallback` aborts any in-flight generate request and clears the controller, so a request started before disconnect never mutates `value` after the element is removed.

### Sizing and layout

This control does not implement its own layout (no `renderWithLayout`/`inlineView`) — it forwards every layout-affecting property straight through to the inner `<aiux-control-input>`, which owns all label/control/messages positioning and sizing.

## Accessibility, localization, and customization

The generate button has an `aria-label` ("Generate Auto Number") and a tooltip with the same text, both localized through `@lit/localize`'s `msg()` — not host-settable. The error message returned on a failed generate ("Unable to generate Auto Number.") is likewise a fixed, localized string, not configurable by the host. All other labeling, required/invalid indicators, and messages are rendered by the inner `<aiux-control-input>` per its own accessibility contract, since this control has no markup of its own beyond the generate button. No `::part()` or slot-based styling surface is exposed by this control directly; `controlStyles` is declared but not forwarded, so it currently has no visual effect here.
