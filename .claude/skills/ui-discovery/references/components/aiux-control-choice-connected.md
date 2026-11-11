# AIUXControlChoiceConnected

> Source: `@servicenow/aiux-components-control@11.0.22` · `components/controls/docs/usage/aiux-control-choice-connected.md`

`<aiux-control-choice-connected>` is a single-select dropdown form control for a choice-list field (`type: 'choice'`/`internal_type`/`sys_event_name`/`index_name`/`radio` in ServiceNow's field model). The host sets `choices` (or lets the field's dependent-field metadata drive a GraphQL refetch) plus `value`; the component reports the user's selection back via a custom event carrying the new value, display label, and previous value.

Built in: dropdown trigger button and teleported listbox panel, keyboard navigation (arrow keys, Home/End, Enter, Escape, Tab-to-highlight), optional client-side search/filter of options by display label, automatic open-upward/downward positioning, loading spinner state, dependent-field choice refetching over GraphQL, an "option stack" mechanism for add/remove/update/clear of individual options at runtime, a temporary placeholder choice when the current value isn't in the list, automatic first-option selection, and an AI-suggestions section rendered above the regular options. Do not build these yourself.

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

class PriorityFieldHost extends AIUXElement {
  static properties = {
    _value: {state: true}
  };

  constructor() {
    super();
    if (!isServer) {
      this._value = '3';
    }
  }

  _onValueChanged = e => {
    this._value = e.detail.value;
  };

  render() {
    return html`
      <div style="max-width: 320px;">
        <aiux-control-choice-connected
          name="priority"
          label="Priority"
          .value=${this._value}
          .choices=${[
            {value: '1', displayValue: 'Critical'},
            {value: '2', displayValue: 'High'},
            {value: '3', displayValue: 'Medium'},
            {value: '4', displayValue: 'Low'}
          ]}
          @AIUX_CONTROL_CHOICE_CONNECTED#VALUE_CHANGED=${this._onValueChanged}
        ></aiux-control-choice-connected>
      </div>
    `;
  }
}

customElements.define('priority-field-host', PriorityFieldHost);
```

**What happens:** The button trigger shows "Medium" (from `value="3"`). Clicking or pressing Enter/Space/ArrowDown opens a teleported listbox positioned under (or above, if there's insufficient space) the trigger. Selecting an option closes the panel, updates the trigger text, returns focus to the trigger, and fires `AIUX_CONTROL_CHOICE_CONNECTED#VALUE_CHANGED`.

**Value ownership.** The component mirrors the controller's resolved `value`/`displayValue` back onto its own properties on every update, so reading `this.value` off the element after an interaction is safe — but that is a separate copy from whatever backing state you passed in as `.value`. Write `detail.value`/`detail.displayValue` back into your own state on every `VALUE_CHANGED`. If you don't, the next render still shows the component's own internally-resolved value (so the UI looks fine), but your host state is stale the moment a dependent-field refetch clears or re-resolves the selection (see Events below) — the change event it fires carries the new value, but only your handler, not the component, updates what you treat as the record's field value.

### Additional patterns

Dependent-field (cascading) choices — the component fetches `choices` itself over GraphQL whenever `dependentValue` changes, given `tableName`/`name`/`dependentField`:
```js
html`
  <aiux-control-choice-connected
    name="subcategory"
    label="Subcategory"
    .tableName=${'incident'}
    .dependentField=${'category'}
    .dependentValue=${this._category}
  ></aiux-control-choice-connected>
`;
```

Searchable dropdown with suggestions section:
```js
html`
  <aiux-control-choice-connected
    name="assignment_group"
    label="Assignment group"
    .isSearchable=${true}
    .choices=${this._groups}
    .suggestions=${{
      sectionLabel: 'Suggested',
      items: [{value: 'grp1', displayValue: 'Network Ops'}]
    }}
  ></aiux-control-choice-connected>
`;
```

## API

### `<aiux-control-choice-connected>`

#### Properties and attributes

| Property | Attribute | Type | Default | Update behavior | Description |
| --- | --- | --- | --- | --- | --- |
| `choices` | none (`attribute: false`) | `Choice[]` | `[]` | Re-derives internal state (applies `optionStack`, coerces values to strings); on first update, resolves initial value/display value | The full option list. |
| `displayValue` | `displayvalue` (reflected) | `string` | `''` | Synced from controller state each render; setting it externally (with a changed `value`) updates the shown label | Label shown in the trigger for the current `value`. |
| `initialValue` | `initialvalue` | `string` | `''` | Read only on the very first update | Seed value used when `value` is empty on first load. |
| `initialDisplayValue` | `initialdisplayvalue` | `string` | `''` | Read only on the very first update | Label paired with `initialValue`. |
| `dependentField` | `dependentfield` | `string` | `''` | Changing it (with `dependentValue` set) triggers a GraphQL refetch of `choices` | Name of the field this control's options depend on. |
| `dependentValue` | `dependentvalue` | `string` | `''` | Changing it triggers a refetch; the current selection is cleared first unless this is the initial load | Value of the dependent field, passed to the server as `serialized_changes`. |
| `dontSelectFirstOption` | `dontselectfirstoption` | `boolean` | `false` | Read during initial-value resolution and value-validation | Suppresses auto-selecting the first choice when there is no value. |
| `forceUncontrolled` | `forceuncontrolled` | `boolean` | `false` | Declared and forwarded to the controller's props but not read by any controller branch | Not currently used. |
| `isLoading` | `isloading` | `boolean` | `false` | OR'd with internal controller loading state to drive the spinner; also written back into controller state | Shows a loading spinner in the trigger when true. |
| `isSearchable` | `issearchable` | `boolean` | `false` | Toggles the search input in the dropdown panel and search-driven filtering/focus-on-open behavior | Enables client-side search over `displayValue`. |
| `tableName` | `tablename` | `string` | `''` | Read by the dependent-choice fetch (fetch is skipped without it) | ServiceNow table name for the GraphQL choice fetch. |
| `recordSysId` | `recordsysid` | `string` | `''` | Passed as `sys_id` on the GraphQL fetch | Current record's sys_id. |
| `optionStack` | `optionstack` | `OptionStackItem[]` | `[]` | Re-applies `add`/`remove`/`update`/`clear` operations onto the base choice list | Runtime patch operations layered on top of `choices`. Not marked `attribute: false`, so Lit exposes an `optionstack` attribute (JSON-array-converted), but in practice this is bound as a property. |
| `suggestions` | `suggestions` (`type: Object`) | `Suggestion \| undefined` | `undefined` | Changes what `getRenderItems()` returns (adds a suggestions section above results) | AI-suggested options rendered in their own section. Not marked `attribute: false`; bind as a property in practice. |
| `color` | `color` | `ColorVariant` (`string`) | `'initial'` | Stored on the property; not read anywhere in render or the controller | Not currently used. |
| `configAria` | `configaria` (`type: Object`) | `{'aria-label'?: string}` | `{}` | Read on every render for the trigger's and panel's `aria-label` | Overrides the default accessible name (falls back to `label`, then "Choice"). Not marked `attribute: false`; bind as a property in practice. |
| `fieldLayout` | `fieldlayout` (`type: Object`) | `FieldLayout` | `{layout: 'auto'}` | Passed through to `renderWithLayout()` (inherited layout behavior) | Field layout configuration (vertical/horizontal/columns). Not marked `attribute: false`; bind as a property in practice. |
| `showAIIndicator` | `showaiindicator` | `boolean` | `false` | Passed through to the inherited label-inline AI sparkle rendering | Shows the AI indicator next to the label. |
| `isModified` | `ismodified` | `boolean` | `false` | Declared but never read in this file's render, controller, or dropdown templates | Not currently used. |
| `wrapLabel` | `wraplabel` | `boolean` | `false` | Passed through to inherited label rendering | Allows the label text to wrap instead of truncating. |
| `dictionaryAttributes` | `dictionaryattributes` (`type: Object`) | `Record<string, unknown>` | `{}` | Declared but never read in this file's render or controller logic | Not currently used. Not marked `attribute: false`; bind as a property in practice. |
| `formData` | `formdata` (`type: Object`) | `ControlFormData` | `{}` | Read by `shouldSelectFirstOption()` (checks `formData.isNewRecord`) during initial-value and value-validation logic | Form context; `isNewRecord` affects auto-select-first-option behavior. This control redeclares `formData` with its own `@property({type: Object})` (no `attribute: false`), overriding the base class's `attribute: false` declaration — so, unlike the base, this control's `formData` does have a (JSON-object) attribute. |

Also inherited from the shared control base (`AIUXControlElement` / `ControlIdentityBase` / `FormFieldLayoutMixin`) and used by this control:

| Property | Attribute | Type | Default | Update behavior | Description |
| --- | --- | --- | --- | --- | --- |
| `value` | `value` (reflected) | `string` | `''` | Synced from controller state on every update; external changes are picked up and re-validated against `choices` | The selected option's value. |
| `name` | `name` | `string` | `''` | Used to build the trigger's `id` (`form-field-${name}`) and passed to the GraphQL fetch as `fieldName` | Field name. |
| `label` | `label` | `string` | `''` | Used as the fallback accessible name and rendered by the layout mixin's label section | Field label text. |
| `placeholder` | `placeholder` | `string` | `''` | Shown in the trigger only when there is no `displayValue` and no localized "-- None --" override needed | Placeholder text for the trigger. |
| `readonly` | `readonly` (reflected) | `boolean` | `false` | Disables click/keydown handling on the trigger and styles it as readonly; also affects auto-select-first-option and dependent-field value validation | Read-only mode. |
| `disabled` | `disabled` (reflected) | `boolean` | `false` | Styled via the inherited base; the trigger's click handler also checks it directly | Disables the control. |
| `required` | `required` (reflected) | `boolean` | `false` | Reflected onto `aria-required` on the trigger button | Marks the field required. |
| `invalid` | `invalid` (reflected) | `boolean` | `false` | Adds the `aiux-input-error` class and sets `aria-invalid`-equivalent styling on the trigger | Error/invalid visual state. |
| `autofocus` | `autofocus` | `boolean` | `false` | Focuses the trigger button in `firstUpdated()` when true | Auto-focuses the trigger on first render. |
| `helperText` | `helpertext` | `string` | `''` | Declared on the base class; not read by this control's own render (helper text display goes through `helperContent`/messages instead) | Not currently used by this control's own rendering. |
| `helperContent` | `helper-content` | `string` | `''` | Rendered by the inherited label section | Supplemental helper text under the label. |
| `variant` | `variant` (reflected) | `FormFieldVariant` | `'default'` | `'compact'` adds `aiux-input-sm` to the trigger and compacts the layout | Visual density variant. |
| `editMode` | `edit-mode` (reflected) | `FormFieldEditMode` | `FormFieldEditMode.DEFAULT` | Controls whether the editable trigger or the read-only inline view (built from `displayValue`) is rendered | Edit-on-demand / display-only mode switch. |
| `messages` | `messages` | `ControlMessage[]` | `[]` | Rendered below the control by the layout mixin | Validation/info messages. |
| `decorations` | `decorations` | `Decoration[]` | `[]` | Rendered inline with the label | Small label-adjacent decorations/icons. |
| `decorationWidgets` | `decorationwidgets` | `DecorationWidget[]` | `[]` | Rendered in the addon column via `renderAddonContent()` | Widget-loader-backed decorations. |
| `nowId` | `now-id` | `string` | `''` | Not read directly in this file (available to host tooling/selectors) | Stable identifier for the field instance. |
| `controlStyles` | `control-styles` | `string` | `''` | Parsed and applied in full (via `fullControlStylesMap()`) to the trigger `<button>`, since it is both the box-chrome and text-bearing element | Raw CSS declarations from admin field-style rules. |

Internal reactive state inherited from `AIUXControlElement` (`stagedValue`, `hasFocus`, `isTouched`, `hasError`, `errorMessage`) exists on the base class but is not read or written by this control's own code — `choice-connected` manages its selection state entirely through `ChoiceConnectedController` instead.

#### Events

| Event | `detail` | Delivery | Fires when | Notes |
| --- | --- | --- | --- | --- |
| `AIUX_CONTROL_CHOICE_CONNECTED#VALUE_CHANGED` | `{value: string, displayValue: string, oldValue: string, name: string, meta?: unknown}` | bubbles, composed, cancelable | The user selects an option from the dropdown, or the controller resolves/changes the value after an initial load or a dependent-field refetch (not fired for the very first, pre-interaction value resolution) | Dispatched via the shared `dispatchAction()` helper (not the package's generic `EVENTS.VALUE_CHANGED`/`'value-changed'` constant — this control uses its own namespaced action type, exported as `ActionTypes.VALUE_CHANGED`). |

No other event from the shared `EVENTS` constant (`staged-value-changed`, `control-focus`, `control-blur`, `invalid-set`) is dispatched by this control.

`VALUE_CHANGED` fires for more than just a click — several are controller-initiated, not direct user actions:

- The user selects a non-disabled option (click, Enter/Space on a highlighted item, or Enter inside the search panel): commits it immediately, closes the panel, and returns focus to the trigger.
- `dependentField`/`dependentValue` changes after the control has already initialized: the current selection is cleared first — `{value: '', displayValue: '', oldValue}` fires before the refetch even resolves — then, once the refreshed `choices` come back, if the old value isn't among them and the control isn't `readonly` and auto-select-first isn't suppressed, the first new choice is auto-selected and a second change fires.
- The current value simply falls off the list after `choices` or `optionStack` changes from the host (not a dependent-field refetch): same auto-select-first-choice behavior and event, if applicable.
- A domain-context change while a dependent field is already configured, with `dependentField`/`dependentValue` themselves unchanged: refetches but deliberately preserves the current selection against the refreshed list — it only fires if that value no longer exists in the new choices, not pre-emptively.
- The very first resolution of a value on initial load (seeding from `value`/`initialValue`, or auto-selecting the first choice because nothing was provided) never fires the event — only post-init changes dispatch.
- Setting `.choices`, `.value`, or `.displayValue` directly from the host does not itself fire the event; it is absorbed as an external sync.

#### Slots

None. `label-start`/`label-inline`/`label-end` are `FormFieldLayoutMixin` override *hooks* (`renderLabelStartContent()` etc.), not light-DOM `<slot>` elements — this control doesn't override them or declare a `slots` config, so they render their non-slot defaults (nothing / the AI indicator and `decorations` / nothing) and are not usable as slotted content here. `start`/`end` are `InputBase` slots that don't apply either — this control extends `AIUXControlElement` directly and renders its own trigger button markup with no `<slot>` of any kind.

#### Methods

| Method | Description |
| --- | --- |
| `focus(options?: FocusOptions)` | Overridden to move focus to the trigger `<button>` (`[data-choice-trigger]`) instead of the base class's textarea/input lookup. |
| `reset()` | Inherited from `AIUXControlElement`: clears `value`, `stagedValue`, `hasFocus`, `isTouched`, `hasError`, `errorMessage`, and `invalid`. Does not clear `displayValue`, `choices`, or controller-managed state, so the trigger may still show the previous label until the controller resyncs. |

### Data shapes

```typescript
interface Choice {
  value: string;
  displayValue: string;
  sublabel?: string;
  /** sys_choice hint; rendered as a tooltip on the option. Only populated when the
   *  backend advertises the `choice_hint` GraphQL schema capability. */
  hint?: string;
  disabled?: boolean;
  /** When false, the choice is filtered out of the rendered list. Defaults to visible. */
  display?: boolean;
}

interface Suggestion {
  items?: Choice[];
  sectionLabel?: string;
  /** Shown as a disabled row when items is empty. Default: "No predictions available". */
  emptyMessage?: string;
  /** Merged onto every suggested item (e.g. extra metadata for telemetry). */
  meta?: Record<string, unknown>;
}

interface OptionStackItem {
  operation: 'add' | 'remove' | 'clear' | 'update';
  value?: string;
  label?: string;
  index?: number;
  disabled?: boolean;
}
```

`Choice.value` is coerced to a string wherever it's consumed; numeric-looking values from the host are accepted.

## Integration details

### Platform requirements
Dependent-field refetching (`tableName` + `name` + `dependentField`/`dependentValue`) requires a GraphQL endpoint reachable via the shared `graphQLClient`, resolving `GlideLayout_Query.choiceDataRetriever(tableName, fieldName, sysId, serializedChanges)`. Without `tableName` and `name` set, no fetch is attempted and `choices` must be supplied directly by the host.

### SSR
The component renders on the server without touching `window`/`document`; the dropdown panel itself is only created client-side (`DropdownTeleportController` guards its `open()`/DOM work with `isServer`). On the server the trigger renders closed, showing the placeholder or the initial `displayValue`.

### Lifecycle
On `firstUpdated()`, if `autofocus` is set, focus moves to the trigger button. Choice/value resolution (initial value seeding, first-option auto-selection, dependent-field fetch) happens in `willUpdate()` via `ChoiceConnectedController`, before the DOM paints. Selecting an option closes the dropdown and returns focus to the trigger once the update completes.

### Sizing and layout
The trigger is a full-width (`w-full`) button; the dropdown panel is teleported to `document.body` (escaping shadow-DOM clipping) and sized to match the trigger's width (`matchTriggerWidth: true`), opening downward or upward automatically based on available viewport space (estimated panel height: 300px).

## Accessibility, localization, and customization

Keyboard support is built in on the trigger and panel: ArrowDown/ArrowUp open the closed dropdown or move the highlight; Enter/Space (native button activation) and Enter inside the panel select the highlighted option; Escape closes the panel and returns focus to the trigger; Tab moves the highlight to the next/previous item without closing; Home/End jump to the first/last item. Clicking outside the trigger and panel closes the dropdown.

The trigger has `role="combobox"`, `aria-expanded`, `aria-haspopup="listbox"`, `aria-required`, and `aria-readonly`; its accessible name comes from `configAria['aria-label']`, falling back to `label`, then an empty string. The teleported panel has `role="listbox"` with its own `aria-label` (falling back to `label`, then the localized string "Choice"). The loading spinner shown in the trigger while `isLoading` is true is a bare, unlabeled element (no `aria-hidden`, no visually-hidden text), so it is not announced to screen readers. Note: the option buttons rendered inside the panel (`_renderChoiceItemContent`) do not set `role="option"` or `aria-selected` on the interactive element, even though `renderDropdownPanel()` offers those attributes via its `optionAttrs` callback parameter — that parameter is not consumed by this control, so screen readers rely on the wrapping `<li role="presentation">` and button text alone rather than explicit option semantics.

Hard-coded, localized (via `@lit/localize`'s `msg()`) English strings: the default aria-label "Choice", the search placeholder "Search...", the empty-list message "No options available", the "-- None --" placeholder shown when nothing is selected, and the suggestions-empty message "No predictions available" plus the "Results" section header. All of these can be overridden by the host except the "Results" label. Disabled choices (`disabled: true`) are visually dimmed (`opacity-50`) and excluded from click/keyboard selection.

Styling is Tailwind/DaisyUI-based (`aiux-input`, `aiux-menu`, etc.) with no exposed `::part()` targets or CSS custom-property hooks; the only host-configurable styling surface is the `controlStyles` attribute, applied in full to the trigger button via `fullControlStylesMap()` since the trigger is both the box-chrome and text-bearing element.
