# aiux-control-slushbucket

> Source: `@servicenow/aiux-components-control@11.0.22` · `components/controls/docs/usage/aiux-control-slushbucket.md`

A compact trigger that opens a modal dual-list ("slushbucket") editor. The host sets `fields` to the full pool of `{value, label}` options and `value` to a comma-separated string of currently-selected field values; the control renders an inline trigger showing the current selection (or an empty-state "Click to add" button), and opens a modal with an available/selected two-list picker on click. Selection is staged inside the modal and only committed to `value`/`displayValue` when the user clicks OK — Cancel discards the staged change.

Built in: the trigger's empty/filled states, deriving a display label and count from `value` + `fields` when the host hasn't supplied `displayValue`, the modal (open/cancel/commit) lifecycle with OK/Cancel footer actions, and staging selection changes from the inner list-selector until committed. Do not build these yourself.

## Import

```js
import '@servicenow/aiux-components-control';
```

## Usage

### Minimal complete example

```js
// complete host component
import '@servicenow/aiux-components-control';
import {html} from 'lit';
import {AIUXElement} from '@servicenow/aiux/aiux-components-core';

class MyColumnPicker extends AIUXElement {
  static properties = {
    columns: {type: String}
  };

  render() {
    return html`
      <aiux-control-slushbucket
        name="columns"
        label="Columns"
        .fields=${[
          {value: 'number', label: 'Number'},
          {value: 'short_description', label: 'Short description'},
          {value: 'priority', label: 'Priority'}
        ]}
        .value=${this.columns ?? ''}
        @AIUX_CONTROL_SLUSHBUCKET#VALUE_CHANGED=${this._onValueChanged}
      ></aiux-control-slushbucket>
    `;
  }

  _onValueChanged(e) {
    this.columns = e.detail.value;
  }
}
```

**What happens:** clicking the trigger opens a modal seeded with the current selection (order preserved unless `shouldSort` reorders it to match `fields`). Rearranging/adding/removing items in the modal only updates internal staged state; clicking OK commits the staged selection to `value`/`displayValue` and dispatches `AIUX_CONTROL_SLUSHBUCKET#VALUE_CHANGED` (only if it actually changed); clicking Cancel (or the modal's own close) discards the staged change and leaves `value` untouched.

`fields` and `value` are frequently set from two different async sources (a fixed column pool vs. a saved selection). If `fields` is still empty (or doesn't yet contain the values in `value`) on the render where `value` first arrives, the derived display label is empty, and the trigger renders its empty "Click to add" state even though `value` is non-empty — because the trigger falls back to the *derived* label only when no `displayValue` was supplied. It self-corrects once `fields` populates and both re-derive, but a snapshot/test taken in between will see the empty state.

### Additional patterns

Passing a host-computed `displayValue` instead of relying on the field-label derivation (useful when the label text differs from `fields`, e.g. already-localized labels from the server):

```js
html`<aiux-control-slushbucket
  name="columns"
  .displayValue=${'Number, Priority'}
  .value=${'number,priority'}
  .fields=${fieldsPool}
></aiux-control-slushbucket>`;
```

Avoiding the empty-state flash described above when `fields` loads asynchronously after `value` is already known, by supplying `displayValue` up front so the trigger has something to show before the pool arrives:

```js
class MyColumnPicker extends AIUXElement {
  static properties = {
    columns: {type: String},
    columnLabels: {type: String},
    fieldsPool: {type: Array}
  };

  render() {
    return html`
      <aiux-control-slushbucket
        name="columns"
        label="Columns"
        .value=${this.columns ?? ''}
        .displayValue=${this.columnLabels ?? ''}
        .fields=${this.fieldsPool ?? []}
        @AIUX_CONTROL_SLUSHBUCKET#VALUE_CHANGED=${this._onValueChanged}
      ></aiux-control-slushbucket>
    `;
  }

  async connectedCallback() {
    super.connectedCallback();
    this.fieldsPool = await fetchColumnPool(); // arrives after first render
  }

  _onValueChanged(e) {
    this.columns = e.detail.value;
    this.columnLabels = e.detail.displayValue; // keep in sync once committed
  }
}
```

## API

### Properties and attributes

| Property | Attribute | Type | Default | Update behavior | Description |
| --- | --- | --- | --- | --- | --- |
| `value` | `value` (reflected) | `string` | `''` | Reactive; drives `_selectedItems`/derived display on change | Comma-separated selected field values, e.g. `'number,priority'`. Unknown values (not present in `fields`) are dropped when computing the derived selection/display, but the raw string is still reflected onto the `value` attribute as-is. |
| `displayValue` | `displayvalue` (reflected) | `string` | `''` | Reactive | Host-supplied label for the trigger and inline view. Takes precedence over the label derived from `value` + `fields` when non-empty. No explicit `attribute:` override is set on this property, so Lit's default (the property name lowercased, not kebab-cased) applies — set it from markup as `displayvalue="..."` or, preferably, via the `.displayValue=` property binding. |
| `fields` | `fields` (`attribute: false`, array property; set via `.fields`) | `SlushBucketField[]` (`{value: string; label: string}[]`) | `[]` | Reactive; rebuilds the internal items map and re-derives selection on change | The full pool of selectable options. |
| `availableLabel` | `available-label` | `string` | `''` | Reactive | Header label for the "available" list in the modal. Falls back to a localized "Available columns" when empty. |
| `selectedLabel` | `selected-label` | `string` | `''` | Reactive | Header label for the "selected" list in the modal. Falls back to a localized "Selected columns" when empty. |
| `disableReorder` | `disable-reorder` | `boolean` | `false` | Reactive | Forwarded to the inner list-selector to disable drag-reordering of selected items. |
| `shouldSort` | `should-sort` | `boolean` | `true` | Reactive; re-derives `_selectedItems` (and the trigger's derived display) on change, even if `fields`/`value` haven't changed | When `true`, the derived selected-items order follows `fields`' order; when `false`, it follows the order values appear in `value`. |
| `configAria` | `configaria` (object property; set via `.configAria`) | `{'aria-label'?: string}` | `{}` | Reactive | `configAria['aria-label']` overrides `label` as the inner list-selector's `aria-label`, and as the fallback for the modal's own `aria-label` when `label` is also empty. |
| `label` | `label` | `string` | `''` | Reactive | Field label. Also used as the modal header text (falling back to `name` when empty) and as the aria-label fallback described above. |
| `name` | `name` | `string` | `''` | Reactive | Field name, echoed in the dispatched event's `detail.name`, and used as the modal header text when `label` is empty. |
| `readonly` | `readonly` (reflected) | `boolean` | `false` | Reactive | Renders the filled-state trigger without an edit button and suppresses `_openModal`/selection-change handling entirely (clicking the trigger or receiving a selection-change event both become no-ops). |
| `disabled`, `required`, `invalid`, `nowId` | see attribute names in the `aiux-control-color` doc | — | — | Reactive | Inherited identity properties; not read by this control's own render/interaction logic (e.g. `disabled` does not currently gate opening the modal — only `readonly` does). |
| `controlStyles` | `control-styles` | `string` | `''` | Reactive | Applied to the trigger element (both empty- and filled-state) via `fullControlStylesMap()` (the full, unsplit declaration set, since the trigger is a single node). |
| `autofocus`, `placeholder`, `labelUrl`, `labelUrlTarget`, `helperText` | see attribute names in the `aiux-control-color` doc | — | — | Reactive | Inherited identity properties; not read by this control's own logic. |
| `fieldLayout`, `variant`, `optional`, `helperContent`, `hideRequiredIndicator`, `wrapLabel`, `messages`, `decorations`, `decorationWidgets`, `highlightedValue`, `showAIIndicator`, `showUnsavedIndicator`, `editMode`, `fieldContextMenu` | see attribute names in the `aiux-control-color` doc | — | — | Reactive | Standard shared form-field layout properties, forwarded to `renderWithLayout()` around the trigger. |
| `nowAssistConfig`, `referringRecordId`, `referringTable`, `formData` | see attribute names in the `aiux-control-color` doc | — | — | Reactive | Inherited NACM/form-context properties. Not currently used — this control has no NACM integration of its own. |

### Events

| Event | `detail` | Delivery | Fires when | Notes |
| --- | --- | --- | --- | --- |
| `AIUX_CONTROL_SLUSHBUCKET#VALUE_CHANGED` | `{name, value, displayValue, items, oldValue}` — `value`/`displayValue` are the committed comma-separated string / joined label string; `items: Array<{id: string; label: string}>` is the final ordered selection; `oldValue` is the pre-commit `value` | Bubbles, composed, cancelable | Only when the user clicks OK in the modal **and** the resulting `value` or `displayValue` actually differs from the current one | Clicking OK with an unchanged selection does not dispatch anything. There is no staged/intermediate change event — only this one commit-time event exists for this control. |

### Slots

None on the host element itself. Internally, the control renders into a `<aiux-control-modal>` using that component's `header`/`body` slots — these are private implementation detail, not part of this control's own public surface.

### Methods

| Method | Description |
| --- | --- |
| `focus(options?: FocusOptions)` | Overridden: moves focus to whichever trigger button is currently rendered (`.slushbucket-trigger` in the empty state, or `.slushbucket-trigger__edit` in the filled state) — not to an input, since this control has no native input of its own. |
| `reset()` | Resets `value` and shared identity/error state (inherited, unmodified). Does not directly clear `fields`, `displayValue`, or close an open modal. |

### Data shapes

`SlushBucketField`: `{value: string; label: string}` — one entry in the `fields` pool.

`SlushbucketValueChangedDetail`: `{name: string; value: string; displayValue: string; items: Array<{id: string; label: string}>; oldValue: string}` — the shape of the `VALUE_CHANGED` event's `detail`. This type is exported from `src/slushbucket/index.ts`, but `src/index.ts` only side-effect-imports `./slushbucket` and the package's `exports` map exposes just `"."` — so it isn't importable from `@servicenow/aiux-components-control`. Inline the shape above in your own handler's type instead.

## Integration details

This control renders an internal `<aiux-control-modal>` (from this same package's `modal` module) and an `<aiux-list-selector>` (from `@servicenow/aiux-components-coe-list-selector`) only while the modal is open — neither is present in the DOM (or paid for) while closed.

### Platform requirements

None beyond a standard DOM; no browser APIs beyond what Lit itself requires.

### SSR

SSR-safe: the modal and list-selector are lazily rendered only when `_modalOpen` is `true`, and `_modalOpen` starts `false`, so a server render never needs to construct either.

### Lifecycle

`willUpdate` rebuilds the internal items map whenever `fields` changes, and re-derives `_selectedItems` / the trigger's derived display label whenever `fields`, `value`, or `shouldSort` changes.

### Sizing and layout

The trigger renders through the shared form-field grid (`renderWithLayout`) as a single-line button/row; the modal itself is a `size="lg"` `<aiux-control-modal>`, sized independently of the trigger.

## Accessibility, localization, and customization

The modal's `aria-label` resolves from `configAria['aria-label']`, then `label`, then a localized "Select items" fallback; the inner list-selector gets the same `aria-label`. The empty-state trigger's "Click to add" text and the filled-state edit button's "Edit list" label/tooltip, along with the modal's "Cancel"/"OK" footer button labels and the instructional "Select columns and put them in the order you want." body text, are all produced via `@lit/localize`'s `msg()`, so they are host-localizable, not hard-coded English. `label`, `availableLabel`, and `selectedLabel` are host-supplied strings and are not translated by the control (though each has a localized fallback when left empty). Keyboard/screen-reader support for the actual available/selected list interaction (drag-reorder, move between lists) is owned entirely by the external `<aiux-list-selector>` component, not by this control. No CSS custom properties or `::part()` hooks are exposed beyond the inherited `controlStyles` binding on the trigger.
