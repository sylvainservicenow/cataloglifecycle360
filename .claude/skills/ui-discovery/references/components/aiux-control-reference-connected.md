# aiux-control-reference-connected

> Source: `@servicenow/aiux-components-control@11.0.22` · `components/controls/docs/usage/aiux-control-reference-connected.md`

`aiux-control-reference-connected` is the connected control for a ServiceNow `reference`, `glide_list` (multi-select reference), `domain_id`, or `glide_action_list` field. The host sets the record context (`recordSysId`, `fieldName`, `tableName`) and the field's reference metadata (`referenceTable`, qualifiers, sort); the control queries matching records via GraphQL as the user types, and reports back the selected record's value/display value (and, for multi-select, a list of pills) through a single custom event. Internally it renders `<aiux-control-typeahead>` (an internal, unexported control used by this and other lookup controls) to own the actual input, dropdown, and pill UI — all of the identity/layout properties documented below are forwarded into that inner element.

Built in: debounced search-as-you-type (300ms) against the record's reference qualifier, a "Recent Selections" section above general matches, single- and multi-selection (pill) modes, a result-count link that expands the truncated result set, a full-screen lookup modal (flat list or, when the field supports it, a hierarchy tree), a record-preview popover on the info icon and on pill click, an "Add Me" shortcut for `sys_user`-scoped multi-select fields, a locked/unlocked toggle for multi-select fields that start locked, and a dependent-field-scoped field-tree picker for inserting `${field}` references. Do not build any of this yourself.

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

class MyReferenceField extends AIUXElement {
  static properties = {
    value: {type: String},
    displayValue: {type: String}
  };

  constructor() {
    super();
    this.value = '';
    this.displayValue = '';
  }

  render() {
    if (isServer) {
      // Server render still needs a sized container; the control itself is SSR-safe.
      return html`<div style="min-width: 280px;"></div>`;
    }
    return html`
      <div style="min-width: 280px;">
        <aiux-control-reference-connected
          name="assigned_to"
          label="Assigned to"
          .value=${this.value}
          .displayValue=${this.displayValue}
          .recordSysId=${'a1b2c3d4e5f6'}
          .fieldName=${'assigned_to'}
          .tableName=${'incident'}
          .referenceTable=${'sys_user'}
          @AIUX_CONTROL_REFERENCE_CONNECTED#VALUE_CHANGED=${this._onValueChanged}
        ></aiux-control-reference-connected>
      </div>
    `;
  }

  _onValueChanged(e) {
    this.value = e.detail.value ?? '';
    this.displayValue = e.detail.displayValue ?? '';
  }
}

customElements.define('my-reference-field', MyReferenceField);
```

**What happens:** the control queries `sys_user` for matches as the host types, scoped by `recordSysId`/`fieldName`/`tableName` (the reference qualifier context). Each keystroke updates the input immediately, but the actual GraphQL search is debounced ~300ms behind typing, so results lag slightly after a fast typist stops. Selecting a result — from the dropdown or the lookup modal opened by the search icon — commits the record's value/display value via the `VALUE_CHANGED` event above.

**Value ownership.** The control owns the in-progress typed text and dropdown/pill state itself, but the committed record is still host state: write `detail.value` and `detail.displayValue` from every `VALUE_CHANGED` back into the properties you pass as `.value`/`.displayValue`. If you don't, the typeahead keeps showing whatever it last committed internally while your own backing state quietly falls behind — a sibling field keyed off this one (a dependent reference qualifier, or a reference-preview button) ends up reading the stale value, and the next render won't visibly "fix" it, because Lit only re-syncs the control from a genuine `value`/`displayValue` change, not from reassigning the same stale value it already has.

**Handlers.** `detail.additionalInfo.referenceSysId` is not a reliable record sys_id — it is a plain copy of `detail.value`, not the distinct sys_id the inner typeahead originally resolved for the option. This matters whenever `referenceKey` is set (so `value` is a dot-walked key rather than `sys_id`): `referenceSysId` still equals that key, not the record's actual sys_id, despite its name. Don't use it for navigation or lookups that need a true sys_id.

### Additional patterns

Multi-select (`glide_list`) with pills, an "Add Me" shortcut, and a lock toggle:

```js
html`
  <aiux-control-reference-connected
    name="watch_list"
    label="Watch list"
    .value=${this.value}
    .displayValue=${this.displayValues}
    .multiSelection=${true}
    .recordSysId=${this.recordSysId}
    .fieldName=${'watch_list'}
    .tableName=${'incident'}
    .referenceTable=${'sys_user'}
    .startLocked=${true}
    @AIUX_CONTROL_REFERENCE_CONNECTED#VALUE_CHANGED=${this._onValueChanged}
  ></aiux-control-reference-connected>
`;
```

Note that most attribute names below are the property name **lowercased with no separators** (Lit's default), not kebab-case — e.g. `record-sys-id` is wrong; the real attribute is `recordsysid`. Bind these as properties (`.recordSysId=${...}`) instead of attributes to avoid this trap; only the properties explicitly marked with a dashed attribute in the tables below are safe to set as HTML attributes.

Resolving a dependent reference qualifier for a record that hasn't been saved yet — pass the unsaved field values so the server can evaluate the qualifier against them, and switch off the saved record's own qualifier if it no longer applies:

```js
html`
  <aiux-control-reference-connected
    name="assignment_group"
    label="Assignment group"
    .tableName=${'incident'}
    .fieldName=${'assignment_group'}
    .referenceTable=${'sys_user_group'}
    .recordSysId=${'-1'}
    .encodedRecord=${this._encodedRecord}
    .serializedChanges=${JSON.stringify({category: this._category})}
    @AIUX_CONTROL_REFERENCE_CONNECTED#VALUE_CHANGED=${this._onValueChanged}
  ></aiux-control-reference-connected>
`;
```

`recordSysId="-1"` marks the record as new/unsaved; `encodedRecord`/`serializedChanges` carry the field values the server needs to evaluate a dependent qualifier before the record exists. Both are sent on every query, so keep them current as the user edits other fields on the same form.

## API

### `<aiux-control-reference-connected>`

#### Properties and attributes

Reference-specific:

| Property | Attribute | Type | Default | Update behavior | Description |
|---|---|---|---|---|---|
| `value` | `value` (reflects) | `string` | `''` | Re-syncs the controller's committed value/pills and re-runs eligibility checks for the tree picker. | The committed sys_id (single-select) or comma-separated sys_ids (multi-select). |
| `displayValue` | `displayvalue` | `string \| string[]` | `''` | Re-syncs the controller when it or `value` changes. | Display text for `value`. A `string[]` is required for multi-select display names that may contain commas. |
| `recordSysId` | `recordsysid` | `string` | `''` | Invalidates the tree-picker eligibility check and, with `fieldName`/`tableName`, gates whether any query can run. | sys_id of the record that owns this field. Only `''` is checked client-side (`!recordSysId`) to suppress the query — `'-1'` (the convention for a new/unsaved record) is truthy and is sent to the server literally as `sys_id: '-1'`, not converted to empty. |
| `fieldName` | `fieldname` | `string` | `''` | Same as `recordSysId`. | Name of this field on `tableName`, used for reference-qualifier resolution. |
| `tableName` | `tablename` | `string` | `''` | Same as `recordSysId`. | Table the owning record lives on. |
| `referenceKey` | `referencekey` | `string` | `''` | Not watched by itself — only reflected into the *next* query triggered by `value`/`displayValue`/`referenceTable`/`overrideReferenceTable`/`graphqlQuery`/`resultLimit` changing, or a domain-context change. | Column to use as the committed `value`/exclude-key instead of `sys_id` (e.g. for `domain_id`). |
| `referenceTable` | `referencetable` | `string` | `'global'` | Re-runs the query. | Table being searched/referenced. `'global'` means no fixed table (e.g. `glide_action_list`). |
| `overrideReferenceTable` | `overridereferencetable` | `string` | `''` | Re-runs the query. | Maps to `sysparm_ref_override`; overrides both the query table and the navigation/preview table. |
| `targetForm` | `targetform` | `string` | `''` | Not itself watched, but read whenever the modal/preview/click-through table is resolved. | Table override for the lookup modal, record preview, and click-through only — never affects the typeahead query. |
| `treePicker` | `treepicker` | `boolean` | `false` | Invalidates the tree-picker eligibility check. | Marks the field as eligible for a hierarchy-tree lookup modal; the server still decides whether a tree is actually supported. |
| `sortBy` | `sortby` | `string` | `''` | Not watched by itself — only reflected into the *next* query triggered by `value`/`displayValue`/`referenceTable`/`overrideReferenceTable`/`graphqlQuery`/`resultLimit` changing, or a domain-context change. | Sort column(s) for search results. |
| `query` | `query` | `string` | `''` | Not watched by itself — only reflected into the *next* query triggered by `value`/`displayValue`/`referenceTable`/`overrideReferenceTable`/`graphqlQuery`/`resultLimit` changing, or a domain-context change. | Additional encoded query string sent to the server as part of the reference qualifier. |
| `additionalQual` | `additionalqual` | `string` | `''` | Not watched by itself — only reflected into the *next* query triggered by `value`/`displayValue`/`referenceTable`/`overrideReferenceTable`/`graphqlQuery`/`resultLimit` changing, or a domain-context change. | Extra filter AND-combined with the reference qualifier (`sysparm_additional_qual`). |
| `orderByDisplayColumn` | `orderbydisplaycolumn` | `boolean` | `true` | Not watched by itself — only reflected into the *next* query triggered by `value`/`displayValue`/`referenceTable`/`overrideReferenceTable`/`graphqlQuery`/`resultLimit` changing, or a domain-context change. | Whether results are ordered by the display column. |
| `resultLimit` | `resultlimit` | `number` | `20` | Re-runs the query with the new page size; also resets any "show all" expansion from `RESULT_LIMIT_CLICK`. | Max results fetched per query page. |
| `disableReferenceQualifier` | `disablereferencequalifier` | `boolean` | `false` | Not watched by itself — only reflected into the *next* query triggered by `value`/`displayValue`/`referenceTable`/`overrideReferenceTable`/`graphqlQuery`/`resultLimit` changing, or a domain-context change. | Ignores the reference qualifier entirely (sent as `ignoreRefQual`). |
| `ignoreReferenceQualifier` | `ignorereferencequalifier` | `boolean` | `false` | Not watched by itself — only reflected into the *next* query triggered by `value`/`displayValue`/`referenceTable`/`overrideReferenceTable`/`graphqlQuery`/`resultLimit` changing, or a domain-context change. | Same effect as `disableReferenceQualifier`; either one being true ignores the qualifier. |
| `searchOnClick` | `searchonclick` | `boolean` | `false` | Affects the next query. | When `true`, clicking/focusing the empty input runs a wildcard (`**`) search instead of returning no results. |
| `graphqlQuery` | none (`attribute: false`) | `string \| undefined` | `undefined` | Re-runs the query. | Overrides the package's default reference GraphQL query document. |
| `multiSelection` | `multiselection` | `boolean` | `false` | Switches the controller between single-value and pill-list state. | Enables `glide_list`-style multi-select with pills instead of a single committed value. |
| `readonlyClickthrough` | `readonlyclickthrough` | `boolean` | `false` | Not watched directly. | When `readonly`, still allows the info/preview affordance to appear so the referenced record can be opened. |
| `bare` | `bare` | `boolean` | `false` | Forwarded to the inner typeahead every render. | Renders the inner input without its own box, for embedding inside another field's chrome. |
| `onOpenRecord` | none (`attribute: false`) | `(table: string, sysId: string) => void \| undefined` | `undefined` | Not watched. | Callback invoked when "Open record" is clicked in a preview popover. When unset, the "Open record" button is not rendered. |
| `encodedRecord` | `encodedrecord` | `string` | `''` | Re-runs the query; invalidates the tree-picker check. | Encoded record data used to resolve dependent-field context server-side (for unsaved records). |
| `serializedChanges` | `serializedchanges` | `string` | `''` | Same as `encodedRecord`. | Unsaved dependent-field values (normalized before being sent), from which the server derives eligibility and query context. Deliberately does **not** invalidate on `value` changes, since picking a value can't change eligibility. |
| `disableDisplayValueWarning` | `disabledisplayvaluewarning` | `boolean` | `true` | N/A. | **Not currently used** — declared but never read anywhere in the control. |
| `maxSearchMatches` | `maxsearchmatches` | `number` | `250` | Affects dropdown section label text only. | Threshold above which the results-count header reads "more than N" instead of an exact count. |
| `popupView` | `popupview` | `string` | `'sys_popup'` | Read when a record preview or the lookup modal's inline record form is opened. | View name used to render the referenced record inside a preview popover. |
| `hidePreview` | `hidepreview` | `boolean` | `false` | Affects suffix rendering. | Suppresses the info-icon record-preview affordance (single-select only). |
| `refDecorationDisabled` | `refdecorationdisabled` | `boolean` | `false` | Affects suffix rendering. | Suppresses both the info-icon preview and pill-click preview popovers. |
| `hideSearchModal` | `hidesearchmodal` | `boolean` | `false` | Affects suffix rendering. | Hides the search (lookup modal) button. |
| `disableEmailFreeformEntry` | `disableemailfreeformentry` | `boolean` | `false` | Forwarded to the inner typeahead as the inverse `allowEmailFreeformEntry` (only when `multiSelection` is also true). | Blocks typing a raw email address as a selectable multi-select entry. |
| `internationalizedEmail` | `internationalizedemail` | `boolean` | `false` | Forwarded to the inner typeahead. | Uses a Unicode-aware (RFC 6530-flavored) email pattern instead of the basic ASCII one when validating freeform email entry. |
| `hideAddMe` | `hideaddme` | `boolean` | `false` | Affects suffix rendering. | Hides the "Add Me" button on multi-select `sys_user`-referencing fields. |
| `fieldListSelectorTables` | `fieldlistselectortables` | `string` | `''` | Read when the field-selector button opens. | Semicolon-separated list of tables the field-tree picker restricts itself to. |
| `fieldListSelectorTypes` | `fieldlistselectortypes` | `string` | `''` | Same as `fieldListSelectorTables`. | Semicolon-separated list of field data types the field-tree picker restricts itself to. |
| `matchTypesAndTables` | `matchtypesandtables` | `boolean` | `false` | Read when the field-selector loads a level. | When `true`, `fieldListSelectorTables`/`fieldListSelectorTypes` must both match (AND) rather than either matching (OR). |
| `fieldListDependentField` | `fieldlistdependentfield` | `string` | `''` | Affects whether the field-selector button/root table resolves. | Name of a field on `formData` whose value provides the field-tree picker's root table. |
| `hideFieldListSelector` | `hidefieldlistselector` | `boolean` | `false` | Affects suffix rendering. | Hides the field-tree picker ("Select Field") button on multi-select fields. |
| `fieldListSelectorDisableReorder` | `fieldlistselectordisablereorder` | `boolean` | `false` | Forwarded to the field-tree picker's list-selector. | Disables drag-reordering in the field-tree picker modal. |
| `startLocked` | `startlocked` | `boolean` | `true` | Resets any manual unlock override. | Whether a multi-select field renders read-only-with-unlock-button initially (an explicit unlock/lock click overrides this per session). |

Inherited identity and layout properties (declared on the shared `ControlIdentityBase`, restated here since they're forwarded into the internal `<aiux-control-typeahead>` on every render):

| Property | Attribute | Type | Default | Update behavior | Description |
|---|---|---|---|---|---|
| `label` | `label` | `string` | `''` | Forwarded to the inner control's label rendering. | Field label text. |
| `placeholder` | `placeholder` | `string` | `''` | Forwarded. | Input placeholder shown when empty. |
| `autofocus` | `autofocus` | `boolean` | `false` | Forwarded. | Autofocuses the inner input on connect. |
| `readonly` | `readonly` (reflects) | `boolean` | `false` | Forwarded as the effective readonly (also `true` while a multi-select field is locked). | Marks the field read-only. |
| `disabled` | `disabled` (reflects) | `boolean` | `false` | Forwarded. | Disables the field. |
| `name` | `name` | `string` | `''` | Forwarded; also used as the `name` on every dispatched event's `detail`. | Form field name. |
| `required` | `required` (reflects) | `boolean` | `false` | Forwarded. | Marks the field required. |
| `invalid` | `invalid` (reflects) | `boolean` | `false` | Forwarded. | Marks the field invalid (error styling). |
| `nowId` | `now-id` | `string` | `''` | **Not currently used** — declared but never forwarded or read by this control. | — |
| `controlStyles` | `control-styles` | `string` | `''` | Forwarded. | Raw CSS declarations applied to the control's interactive element. |
| `fieldLayout` | `fieldlayout` | `{layout: 'auto'\|'vertical'\|'horizontal', columns?: string[]}` | `{layout: 'auto'}` | Forwarded. | Vertical/horizontal form-field layout configuration. |
| `optional` | `optional` | `boolean` | `false` | Forwarded. | Shows an "optional" label indicator. |
| `helperContent` | `helper-content` | `string` | `''` | Forwarded. | Helper text below the label. |
| `hideRequiredIndicator` | `hide-required-indicator` | `boolean` | `false` | Forwarded. | Hides the required-field asterisk. |
| `wrapLabel` | `wrap-label` | `boolean` | `false` | Forwarded. | Allows the label to wrap instead of truncating. |
| `messages` | `messages` | `ControlMessage[]` | `[]` | Forwarded. | Field-level messages (error/warning/info/etc.) rendered below the control. |
| `decorations` | `decorations` | `Decoration[]` | `[]` | Forwarded. | Label-inline decorations (icons/badges). |
| `decorationWidgets` | `decorationwidgets` | `DecorationWidget[]` | `[]` | Forwarded. | Widget-based addon content (not used by the reference control's own rendering, which delegates addon rendering to the inner typeahead). |
| `highlightedValue` | `highlightedvalue` | `HighlightedValue[]` | `[]` | Forwarded. | Status badges shown when the current value matches a configured entry. |
| `showAIIndicator` | `show-ai-indicator` | `boolean` | `false` | Forwarded. | Shows the "AI-assisted" label indicator. |
| `showUnsavedIndicator` | `show-unsaved-indicator` | `boolean` | `false` | Forwarded. | Shows an unsaved-change indicator. |
| `editMode` | `edit-mode` (reflects) | `FormFieldEditMode` | `FormFieldEditMode.DEFAULT` | Forwarded. | `default`, `inline`, or `display-only` field rendering mode. |
| `variant` | `variant` (reflects) | `'default' \| 'compact'` | `'default'` | Forwarded. | Density variant. |
| `nowAssistConfig` | `nowassistconfig` | `NacmConfig \| undefined` | `undefined` | Forwarded. | Now Assist contextual-menu configuration. |
| `referringRecordId` | `referring-record-id` | `string` | `''` | Forwarded. | Referring-record id for Now Assist context. Only meaningful when `nowAssistConfig` is set. |
| `referringTable` | `referring-table` | `string` | `''` | Forwarded. | Referring-table for Now Assist context. Only meaningful when `nowAssistConfig` is set. |
| `formData` | none (`attribute: false`) | `ControlFormData \| undefined` | `undefined` | Read for the "Add Me" current-user id/name and the field-tree picker's dependent-field table. | Ambient form data supplied by the record-form host. |
| `fieldContextMenu` | none (`attribute: false`) | `FieldContextMenuConfig \| undefined` | `undefined` | Forwarded to the inner typeahead every render. | Replaces the control's default right-click context menu when set; consumed by the inner typeahead's layout rendering. |
| `labelUrl` | `label-url` | `string \| undefined` | `undefined` | **Not currently used** — declared on the base class but never forwarded to the inner typeahead, so setting it has no visible effect. | — |
| `labelUrlTarget` | `label-url-target` | `string` | `'_blank'` | **Not currently used**, for the same reason as `labelUrl`. | — |

#### Events

All events are dispatched via an internal action-dispatch helper as `CustomEvent`s with `bubbles: true`, `composed: true`, `cancelable: true`. Internal typeahead-to-reference events (`TYPEAHEAD_*`) are intercepted and `stopPropagation()`-ed before they reach the host; only `VALUE_CHANGED` is meant for host consumption.

| Event | `detail` | Delivery | Fires when | Notes |
|---|---|---|---|---|
| `AIUX_CONTROL_REFERENCE_CONNECTED#VALUE_CHANGED` | `{name: string, value?: string, displayValue?: string \| string[], additionalInfo?: {referenceSysId?: string, secondaryData?: unknown}, error?: {type: string, message: string}}` | bubbles, composed, cancelable | A result is selected (dropdown, lookup modal, or tree), a pill is added/removed, the input is cleared, or blur commits/rejects the typed text. | For multi-select, `value` is a comma-joined sys_id list and `displayValue` is an array (never a joined string, to avoid corrupting names containing commas). `error` is present instead of a normal commit when blur leaves text that matches no result — the host is responsible for surfacing `error.message`. |

The inner typeahead's own events (`AIUX_CONTROL_TYPEAHEAD#STAGED_VALUE_CHANGED`, `#VALUE_CHANGED`, `#CLICK`, `#FOCUS`, `#BLUR`, `#PILL_CLICK`, `#RESULT_LIMIT_CLICK`) are internal wiring between the typeahead and this control and are stopped from propagating past this element; do not listen for them on `aiux-control-reference-connected`.

`VALUE_CHANGED` fires in several distinct situations, and the payload differs by situation — not just by whether a selection happened:

- A result is picked from the dropdown, the lookup modal, or the tree: commits that record's `value`/`displayValue` immediately. No debounce; only the underlying search query is debounced.
- The input is typed down to empty in single-select mode: fires `{value: '', displayValue: ''}` synchronously, independent of (and before) the now-moot debounced search would have resolved.
- Blur, single-select, with typed text matching exactly one remaining option: auto-commits that option as if it had been clicked.
- Blur, single-select, with typed text matching no option: clears to `{value: '', displayValue: <the mistyped text>, error}` — note `value` is wiped even though the typed text survives in `displayValue` so the error message can reference it.
- Blur, multi-select, with typed text matching no option: the existing pills (`value`/`displayValue`) are left untouched and only `error` is added — unlike single-select, a bad guess does not clear what was already committed.
- A pill is added or removed (click, Backspace/Delete, the lookup modal, the tree picker, or Add Me): recomputes the full pill list and commits it as `value` (comma-joined sys_ids) and `displayValue` (a `string[]`, never comma-joined, since a display name can itself contain a comma).
- Blur with a value already selected and the input showing matching text: no event — the display text just reverts to the current `displayValue`.

#### Slots

None. The control's `render()` does not expose any named slots of its own (the inner typeahead's `suffix` slot is filled internally with this control's own buttons — info, search, add-me, field-selector, lock/unlock — and is not host-configurable).

#### Methods

| Method | Description |
|---|---|
| `focus(options?: FocusOptions)` | Focuses the inner typeahead's text input (forwarded to the inner element's own `focus()`, since the real `<input>` lives in a nested shadow root that a native `label for` can't reach). |

### Data shapes

`ReferenceValueChangePayload` (the `VALUE_CHANGED` event's `detail`, minus `name`):

```ts
interface ReferenceValueChangePayload {
  value: string | undefined;
  displayValue: string | string[] | undefined;
  additionalInfo?: {
    referenceSysId: string | undefined;
    secondaryData?: unknown;
  };
  error?: {
    type: string;
    message: string;
  };
}
```

`Pill` (one selected item in multi-select mode, from the shared query controller's state — not part of the public event payload, but shapes what `displayValue` arrays are built from):

```ts
interface Pill {
  id: string;
  value: string;
  displayValue: string;
}
```

The platform `ReferenceField` form-field descriptor (`reference`, `domain_id`, `glide_list`, `glide_action_list` field types) that this control's properties mirror one-to-one: `value`, `displayValue`, `reference` (→ `referenceTable`), `referenceQualifier`/`encodedQuery` (→ `query`), `referenceKey`, `sortBy`, `orderByDisplayColumn`, `resultLimit`, `disableReferenceQualifier`, `ignoreReferenceQualifier`, `searchOnClick`, `encodedRecord`, `serializedChanges`, `overrideReferenceTable`, `multiSelection`.

## Integration details

### Platform requirements

Requires the native Popover API for the search dropdown (used internally by the typeahead: Chrome 114+, Safari 17+, Firefox 125+). There is no fallback UI on older engines — the panel simply will not open. Requires a GraphQL endpoint reachable by the shared `graphQLClient` for search queries; with no `recordSysId`/`fieldName`/`tableName` set, queries are skipped entirely (empty variables are sent) and the control renders with no results.

### SSR

SSR-safe. On the server, the rendered value is `toDisplayString(displayValue)` rather than the live query state, and the debounced query, popover positioning loop, and result-limit expansion are all guarded to no-op (`isServer` checks in the shared query controller and the inner typeahead).

### Lifecycle

Query eligibility (`recordSysId`/`fieldName`/`tableName`) and tree-picker eligibility are re-evaluated automatically on `updated()` whenever the relevant properties, or the ambient domain context, change. The tree-picker config is fetched lazily — only when the search/lookup modal is actually opened for a field with `treePicker` set — so it costs at most one request per field the user opens, not one per reference field on a form.

### Sizing and layout

Renders at `w-full` inside whatever container the host provides; there is no intrinsic width or height beyond the single-line input (the lookup modal is a fixed `size="xl"` `aiux-modal` with a `50vh`/`min-h-72` body, independent of the field's own size).

## Accessibility, localization, and customization

The inner input uses `role="combobox"` with `aria-expanded`, `aria-owns`, `aria-autocomplete="list"`, and `aria-activedescendant` wired to the open dropdown (`role="listbox"`/`role="option"`); arrow up/down move the highlighted option (scrolled into view), Enter selects the highlighted option (or the sole option when only one is showing), and Escape/Tab close the dropdown. In multi-select mode, each pill is a focusable `role="button"` reachable via Left/Right (or Right/Left in RTL, via `dir`-aware key mapping), Home/End; Backspace/Delete removes a focused pill (removal-focus then moves to the next remaining pill, or the input if none remain); Space/Enter on a pill opens its record-preview popover. Backspace on an empty input focuses the last pill. Closing a record-preview popover returns focus to the button/pill that opened it (WCAG 2.4.3).

Hard-coded English strings (all wrapped for translation via `@lit/localize`, so they render in other locales but are not host-configurable): "Search for Record", "Open record", "Open Record", "Close", "Lock", "Unlock", "Add Me", "Select Field", "Select a field", "Cancel", "OK", "Record details", "Action preview", "(empty)", "Recent Selections", "Suggestions", "Loading...", "No results found", "Showing 1-N of M" / "Showing 1-N of more than M", and the "Please select a value from the list of results in the dropdown." validation message. Host-settable text: `label`, `placeholder`, `helperContent`, `messages`, and the lookup modal's header (`label` → `fieldName` → the resolved table name, in that priority order).

Styling is DaisyUI/Tailwind class–based on the inner elements; the only host-facing style hook is `controlStyles` (raw CSS declarations, split automatically between the input's text styling and its container box styling). There are no CSS custom properties or `::part()` selectors exposed.
