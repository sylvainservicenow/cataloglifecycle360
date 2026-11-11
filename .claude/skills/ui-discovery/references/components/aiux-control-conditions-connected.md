# aiux-control-conditions-connected

> Source: `@servicenow/aiux-components-control@11.0.22` · `components/controls/docs/usage/aiux-control-conditions-connected.md`

A form-field control that stores an encoded query string (`value`) built against a dependent table. It opens the platform condition builder in a modal, shows a read-only filter overview when conditions are set, and optionally shows a live "N matching results" count with a link to preview those records in a list modal.

Built in: resolving the dependent table from `dictionaryAttributes.staticDependent`, `dependentValue`, or (as a last resort) `referringTable`; a debounced GraphQL row-count query with stale-response discarding; snapshot/revert semantics so a cancelled modal edit restores the prior query; and custom condition-builder operator extensions (`VALCHANGES`/`CHANGESFROM`/`CHANGESTO`/pattern-and-regex match) gated by dictionary attributes. Do not build your own condition builder modal, row-count fetch, or operator wiring — configure this control instead.

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
    query: {type: String}
  };

  render() {
    return html`
      <aiux-control-conditions-connected
        name="conditions"
        label="Conditions"
        .referringTable=${'incident'}
        .dictionaryAttributes=${{showConditionCount: true}}
        .value=${this.query ?? ''}
        @AIUX_CONTROL_CONDITIONS_CONNECTED#VALUE_CHANGED=${this._onCommit}
      ></aiux-control-conditions-connected>
    `;
  }

  _onCommit(e) {
    this.query = e.detail.value;
  }
}
```

**What happens:** with no conditions set, a "Set conditions" button opens the condition builder in a modal, scoped to the resolved dependent table (`incident` here, via `referringTable` since no `dependentValue`/`dictionaryAttributes.staticDependent` is set). Clicking the modal's "Set" action commits the encoded query and dispatches `AIUX_CONTROL_CONDITIONS_CONNECTED#VALUE_CHANGED`; "Cancel" reverts to the query as it was before the modal opened.

### Additional patterns

Live-updating as the builder changes, without waiting for "Set" (default is `liveUpdate = true`, so this is already the default; set it to `false` to require an explicit "Set" click before committing):

```js
html`<aiux-control-conditions-connected
  name="conditions"
  label="Conditions"
  .referringTable=${'incident'}
  .liveUpdate=${false}
></aiux-control-conditions-connected>`;
```

Scoping the field to a table named by another field's current value, instead of a fixed table:

```js
html`<aiux-control-conditions-connected
  name="conditions"
  label="Conditions"
  .dependentValue=${this.tableField}
  .dependentFieldLabel=${'Table'}
></aiux-control-conditions-connected>`;
```

## API

### `aiux-control-conditions-connected`

#### Properties and attributes

| Property | Attribute | Type | Default | Update behavior | Description |
| --- | --- | --- | --- | --- | --- |
| `value` | `value` (reflect) | `string` | `''` | The committed encoded query; read via the private `_queryValue` getter (coalesces `null`/`undefined` to `''`). Re-syncs `_builderQuery` on change when the modal is closed. | The field's committed encoded query. |
| `displayValue` | `displayvalue` | `string` | `''` | Set alongside `value` whenever the query is applied. | Mirrors `value`; also part of the change-detection check in `_applyQuery`. |
| `name` | `name` | `string` | `''` | Included in the dispatched event `detail`. | Field name identifier. |
| `label` | `label` | `string` | `''` | Used as the modal header text and the messages/label chrome via `renderWithLayout`. | Field label text. |
| `referringTable` | `referringtable` | `string` | `''` | Used as the dependent-table fallback only when `dependentFieldLabel` is empty (see `_effectiveDependentTable`); also read by the inherited `withNacm` mixin (as `<aiux-nacm>`'s `documentTableName`) when `nowAssistConfig` is set. | Table the current record belongs to. This control redeclares `referringTable` with its own `@property({type: String})` (no explicit `attribute` option), which replaces the base class's `referring-table` attribute mapping — the effective attribute here is the lowercased property name, not the kebab-case one the base class documents. |
| `dependentValue` | `dependentvalue` | `string` | `''` | Read (trimmed) as the dependent table when set and no `staticDependent` override exists. | The current value of the referenced "table name" field. |
| `dependentFieldLabel` | `dependentfieldlabel` | `string` | `''` | When set and `dependentValue` is empty, suppresses the `referringTable` fallback and shows a "Select a `<label>`" hint instead. | Label of the field that determines the dependent table, shown in the empty-state hint. |
| `dictionaryAttributes` | `dictionaryattributes` | `ConditionsDictionaryAttributes` | `{}` | Read on every access to `_effectiveDependentTable`, `_shouldShowConditionCount`, `_allowSort`, `_allowRelatedListQuery`, `_allowedFieldsList`, `_excludedFieldsList`, `_hideMatchOperators`, `_extendedOperatorsList`. | Field-configuration bag; see **Data shapes**. Set as a property (`.dictionaryAttributes=`) in practice — the object type has no meaningful attribute-string form. |
| `liveUpdate` | `liveupdate` | `boolean` | `true` | When `true`, every condition-builder change is applied and dispatched immediately; when `false`, changes are only applied when the modal's "Set" footer action is clicked. | Controls whether edits commit live or require explicit confirmation. |
| `readonly` | `readonly` (reflect) | `boolean` | `false` | Hides the actions bar/edit affordances and renders `cb-filter-overview` in a read-only wrapper; gates `_openConditionsModal`. | Read-only display. |
| `disabled` | `disabled` (reflect) | `boolean` | `false` | Gates `_openConditionsModal`. | Disables opening the conditions modal. |
| `required` | `required` (reflect) | `boolean` | `false` | Forwarded to the base layout chrome only (not read elsewhere in this control). | Marks the field required. |
| `fieldLayout` | `fieldlayout` | `{layout?: 'vertical' \| 'horizontal' \| 'auto', columns?: string[]}` | `{layout: 'auto'}` | Read by `renderWithLayout` (inherited); set as a property (`.fieldLayout=`) in practice since it's an object. | Label/control layout. |
| `messages` | `messages` | `ControlMessage[]` | `[]` | Read by `renderWithLayout` (inherited) since this control does not override the `messages` parameter; set as a property in practice. | Validation/status messages. |
| `variant` | `variant` (reflect) | `'default' \| 'compact'` | `'default'` | Read by `renderWithLayout` (inherited) to select compact density. | Visual density. |
| `editMode` | `edit-mode` (reflect) | `'default' \| 'inline' \| 'display-only'` | `'default'` | Read by `renderWithLayout` (inherited); this control always supplies an `inlineView`, so `inline`/`display-only` modes render the compact edit-on-demand view. | Rendering mode. |
| `nowAssistConfig` | `nowassistconfig` | `NacmConfig \| undefined` | `undefined` | Read by the inherited `withNacm` mixin's `renderWithLayout` override (invoked whenever this control calls `this.renderWithLayout(...)`) to decide whether to render a Now Assist Contextual Menu trigger. | Now Assist Contextual Menu configuration. |
| `referringRecordId` | `referring-record-id` | `string` | `''` | Read by the inherited `withNacm` mixin when NACM is enabled (passed to `<aiux-nacm>` as `documentSysId`). | Referring record identifier for NACM context. |
| `recordTable` | `recordtable` | `string` | `''` | Not currently used — declared but never read anywhere in this control. | Reserved. |
| `recordSysId` | `recordsysid` | `string` | `''` | Not currently used — declared but never read anywhere in this control. | Reserved. |
| `helperText` | `helpertext` | `string` | `''` | Inherited from `AIUXControlElement`; not read by this control or by `renderWithLayout`. | Not currently used. |
| `placeholder` | `placeholder` | `string` | `''` | Inherited; not read anywhere in this control's own code. | Not currently used by this control directly (part of the identity contract, not this control's rendering). |
| `labelUrl` | `label-url` | `string \| undefined` | `undefined` | Inherited; not read anywhere in this control's own code. | Not currently used by this control. |
| `labelUrlTarget` | `label-url-target` | `string` | `'_blank'` | Inherited; not read anywhere in this control's own code. | Not currently used by this control. |
| `nowId` | `now-id` | `string` | `''` | Inherited; not read anywhere in this control's own code. | Not currently used by this control. |
| `controlStyles` | `control-styles` | `string` | `''` | Inherited; not read anywhere in this control's own code. | Not currently used by this control. |
| `optional` | `optional` | `boolean` | `false` | Read by `renderWithLayout`/the shared label rendering (inherited). | Suppresses the required indicator. |
| `helperContent` | `helper-content` | `string` | `''` | Read by `renderWithLayout`/the shared label rendering (inherited) to decide whether a label row renders at all. | Helper text under the field. |
| `hideRequiredIndicator` | `hide-required-indicator` | `boolean` | `false` | Read by the shared label rendering (inherited). | Hides the required-field indicator. |
| `wrapLabel` | `wrap-label` | `boolean` | `false` | Read by the shared label rendering (inherited). | Allows the label to wrap. |
| `decorations` | `decorations` | `Decoration[]` | `[]` | Read by `renderLabelInlineContent` (inherited). | Label-row decorations. |
| `decorationWidgets` | `decorationwidgets` | `DecorationWidget[]` | `[]` | Read by `renderAddonContent` (inherited). | Custom widget slots in the addon area. |
| `highlightedValue` | `highlightedvalue` | `HighlightedValue[]` | `[]` | Read by `renderHighlightedValueBadges` (inherited). | Highlighted-value badge entries. |
| `showAIIndicator` | `show-ai-indicator` | `boolean` | `false` | Read by `renderLabelInlineContent` (inherited). | Shows the AI-generated indicator. |
| `showUnsavedIndicator` | `show-unsaved-indicator` | `boolean` | `false` | Read by the shared label rendering (inherited) to show/hide the unsaved-change indicator. | Shows the unsaved-change indicator. |
| `formData` | property only (`attribute: false`) | `ControlFormData \| undefined` | `undefined` | Inherited; not read anywhere in the base tower or this control's own code. | Not currently used by this control. |
| `fieldContextMenu` | property only (`attribute: false`) | `FieldContextMenuConfig \| undefined` | `undefined` | Read by the inherited `FieldContextMenuMixin` to gate and configure the right-click context menu. | Right-click personalize/configure menu, set by the controls factory. |

#### Events

| Event | `detail` | Delivery | Fires when | Notes |
| --- | --- | --- | --- | --- |
| `AIUX_CONTROL_CONDITIONS_CONNECTED#VALUE_CHANGED` | `{name: string, value: string, displayValue: string}` | `bubbles: true, composed: true, cancelable: true` | The condition builder's query is applied — live (each edit, when `liveUpdate` is `true`) or on "Set" (when `liveUpdate` is `false` or the modal footer confirms). | Dispatched via the shared `dispatchAction` helper. Skipped when the new query equals both the current `value` and `displayValue`. |

No `STAGED_VALUE_CHANGED` (or other staged/intermediate) event is dispatched by this control — in-progress modal edits are tracked only in internal state (`_builderQuery`) until applied.

#### Slots

None.

#### Methods

| Method | Description |
| --- | --- |
| `focus(options?: FocusOptions)` | Focuses the element matching `[data-conditions-trigger]` in this control's shadow root — the "Set conditions"/"Edit conditions" trigger button, in whichever of the empty/active-state render branches it currently appears. |

### Data shapes

`ConditionsDictionaryAttributes`:

| Property | Type | Description |
| --- | --- | --- |
| `staticDependent` | `string`, optional | Fixed dependent table name; takes precedence over `dependentValue` and `referringTable`. |
| `showConditionCount` | `boolean`, optional | Shows the live matching-record count and "View N matching results" / sync-count affordances. |
| `allowedFields` | `string`, optional | Semicolon-separated field names to include in the condition builder's field picker. |
| `excludedFields` | `string`, optional | Semicolon-separated field names to exclude from the field picker. |
| `allowRelatedListQuery` | `boolean`, optional | Passed to the condition builder as `allowRelatedListQuery`. |
| `allowSort` | `boolean`, optional | Shows the "sort by" section in the condition builder. |
| `hideMatchOperators` | `boolean`, optional | Removes `matches pattern`/`matches regex` from string-field operators. |
| `extendedOperators` | `string`, optional | Semicolon-separated subset of `VALCHANGES`, `CHANGESFROM`, `CHANGESTO` to add to every field type's operator list (`CHANGESFROM`/`CHANGESTO` only take effect where that field type's `=` operator has a value editor). |

## Integration details

Row counts are fetched via `graphQLClient.query` against a fixed `ROW_COUNT_QUERY` (`GlideAggregateRecord_Query`), debounced 150ms, with request-id tracking so a stale response never overwrites a newer one's result.

### Platform requirements

Requires `@servicenow/aiux-components-condition-builder` (`<aiux-condition-builder>`, `fieldOperatorRelationship`) and `@servicenow/aiux-components-list` (`<aiux-list-connected>`, used for the results-preview modal) to be registered, and a reachable GraphQL endpoint for the row-count query when `dictionaryAttributes.showConditionCount` is set.

### SSR

`connectedCallback` guards its row-count fetch with `isServer` from `lit`, so no fetch runs during server rendering.

### Lifecycle

`connectedCallback` seeds `_builderQuery` from the current `value` and, on the client, triggers an initial row-count fetch if a count is configured, a dependent table resolves, and a query is already set. `disconnectedCallback` cancels the debounced row-count fetch and tears down a `MutationObserver` used to re-show teleported popovers after the condition builder's modal reparents them.

**Gotcha:** setting `dependentFieldLabel` opts the control out of the `referringTable` fallback entirely — `_effectiveDependentTable` only falls back to `referringTable` when `dependentFieldLabel` is empty. If you set `dependentFieldLabel` (e.g. to show the "Select a *label*" hint) but never populate `dependentValue`, the control stays permanently in its empty, un-openable state even with a valid `referringTable` set — it is not a temporary "waiting for the dependent field" state in that configuration.

### Sizing and layout

Uses the shared `renderWithLayout`/`inlineView` form-field chrome (label, messages, edit-on-demand compact view); the condition builder and results-preview open in `size="lg"` modals (`<aiux-control-modal>`), independent of the field's own layout.

## Accessibility, localization, and customization

All user-facing strings (button labels, empty-state hints, modal headers, the "Loading..."/"View N matching results" text) are wrapped in `@lit/localize`'s `msg()` — hard-coded English source text, localized through the standard pipeline, not host-settable. The readonly empty state renders `role="textbox"` with `aria-readonly="true"`; the "sync conditions results" and "edit conditions" icon buttons carry `title` tooltips built from localized strings. Keyboard/focus support beyond `focus()` delegation is provided by the underlying `<aiux-condition-builder>`, `<aiux-control-modal>`, and `<aiux-list-connected>` components. Styling is limited to what those nested components and the shared form-field CSS parts expose; this control does not add its own `::part()` or slot surface.
