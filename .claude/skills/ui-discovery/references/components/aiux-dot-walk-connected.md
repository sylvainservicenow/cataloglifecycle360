# Dot walk (connected)

> Source: `@servicenow/aiux-components-condition-builder@4.0.20` · `components/condition-builder/docs/usage/aiux-dot-walk-connected.md`

`<aiux-dot-walk-connected>` is a self-fetching field navigator. The host sets `tableName`; the element loads that table's fields, renders the search box, breadcrumbs, field list and "Load more" itself, and lets the user drill through reference fields (for example `caller_id.department.name`). When the user picks a final field it fires `dot-walk-connected-path-updated` with the dotted path, the path entries, and the field's type and metadata. Search, paging, drill-in and back navigation are built in; do not rebuild them.

Use `aiux-dot-walk` instead when the host supplies the field data itself.

## Import

```js
import '@servicenow/aiux-components-condition-builder';
```

The element class is exported as `AIUXDotWalkConnected`.

## Usage

### Minimal complete example

```ts
import {html} from 'lit';
import {customElement, state} from 'lit/decorators.js';
import {AIUXElement} from '@servicenow/aiux-components-core';
import '@servicenow/aiux-components-condition-builder';
import type {DotWalkConnectedPathUpdatedDetail} from '@servicenow/aiux-components-condition-builder';

@customElement('my-field-picker')
export class MyFieldPicker extends AIUXElement {
  @state() private _selection?: DotWalkConnectedPathUpdatedDetail;

  private _handlePathUpdated(
    event: CustomEvent<DotWalkConnectedPathUpdatedDetail>
  ) {
    this._selection = event.detail;
  }

  render() {
    return html`
      <div class="px-4" style="height: 360px; width: 320px">
        <aiux-dot-walk-connected
          .tableName=${'incident'}
          @dot-walk-connected-path-updated=${this._handlePathUpdated}
        ></aiux-dot-walk-connected>
      </div>
      <p>
        Selected: ${this._selection?.combinedPath ?? 'none'}
        (${this._selection?.type ?? ''})
      </p>
    `;
  }
}
```

**What happens:** the incident fields load in the browser and appear in a searchable list. Reference fields show a forward chevron; clicking it (or pressing the forward arrow key) opens the referenced table and adds a breadcrumb, while clicking the row selects the reference field itself when the instance marks that field selectable. Choosing a field fires `dot-walk-connected-path-updated` (for example `combinedPath` `caller_id.department` after drilling into `caller_id` and choosing `department`).

### Additional patterns

Restrict the visible fields per table, and filter by custom logic:

```ts
import type {PanelItemFilter} from '@servicenow/aiux-components-condition-builder';

// Hide system fields. Return the item to keep it, or null to drop it.
const hideSystemFields: PanelItemFilter = item =>
  item.internalValue.startsWith('sys_') ? null : item;

html`<aiux-dot-walk-connected
  .tableName=${'incident'}
  .fieldInclusions=${{incident: ['number', 'priority', 'caller_id'], '*': ['name']}}
  .fieldExclusions=${{sys_user: ['password']}}
  .panelItemFilter=${hideSystemFields}
  .disableDotwalking=${false}
></aiux-dot-walk-connected>`;
```

Resolve the type and metadata of a saved path without user interaction:

```ts
const picker = this.renderRoot.querySelector('aiux-dot-walk-connected');
const fieldContext = await picker?.getFieldContext(savedPath);
```

## API

### Properties and attributes

Attributes are lowercased property names. Boolean attributes are true when present, so `enablesearchautofocus` and `showsearch` (default `true`) cannot be turned off by attribute; set the property to `false`. `fieldexclusions`, `fieldinclusions` and `dotwalkpath` parse as JSON. Use property bindings.

| Property | Attribute | Type | Default | Update behavior | Description |
| --- | --- | --- | --- | --- | --- |
| `tableName` | `tablename` | `string` | `''` | Updates immediately | Root table whose fields are browsed. Changing it after mount clears breadcrumbs and the shown items, resets `dotWalkPath` to `[]`, and loads the new table's fields; the search box text is not cleared. Returning to a table this instance has already loaded shows an empty list until the user searches or navigates. After mount, an empty value loads nothing. Set it before the element first renders: an empty value at first render still requests an empty table. |
| `dotWalkPath` | `dotwalkpath` | [`DotWalkPathEntry[]`](#dotwalkpathentry) | `[]` | Applied when set; intended as the initial value | Restores a previously chosen path, with the list opened on the last entry's table and that entry marked selected. Changing it later updates the navigation state but does not request panel items. Reset to `[]` when `tableName` changes. |
| `customSearchTerm` | `customsearchterm` | `string` | `''` | Updates immediately | Sets the search box text only; it does not run a search. The list keeps its current items until the user types. Until then "Load more" does nothing, because it pages the results of a search that was never run. |
| `showSearch` | `showsearch` | `boolean` | `true` | Updates immediately | Shows the search box. |
| `enableSearchAutofocus` | `enablesearchautofocus` | `boolean` | `true` | Applied when the search box first mounts | Focuses the search box on mount. |
| `disableDotwalking` | `disabledotwalking` | `boolean` | `false` | Applies to panels fetched after the change | Stops users drilling into reference fields; only the root table's fields can be picked. Panels already loaded keep their reference affordances. |
| `fieldInclusions` | `fieldinclusions` | `Record<string, string[]>` | `undefined` | Updates immediately | Per-table allowlist of field names. Key `"*"` applies to every table and is combined with the table's own list; empty lists are ignored. Tables with no matching key are unfiltered. Headings always pass. A field in both `fieldInclusions` and `fieldExclusions` is excluded. |
| `fieldExclusions` | `fieldexclusions` | `Record<string, string[]>` | `undefined` | Updates immediately | Per-table denylist of field names. Key `"*"` applies to every table and is combined with the table's own list; empty lists are ignored. Applied after `panelItemFilter` and `fieldInclusions`. |
| `panelItemFilter` | property only | [`PanelItemFilter`](#panelitemfilter) | `undefined` | Updates immediately | Custom filter run on every item of every table the user visits, before the field maps. |

### Events

Events bubble and are composed; none is cancelable. Other `dw-*` and `cb-*` events may bubble out of the element; they are internal. The inner `dw-panel-request`, `dw-load-more` and `dw-path-updated` events are consumed by this element and never reach the host.

| Event | `detail` | Delivery | Fires when | Notes |
| --- | --- | --- | --- | --- |
| `dot-walk-connected-path-updated` | [`DotWalkConnectedPathUpdatedDetail`](#dotwalkconnectedpathupdateddetail) | Bubbles, composed | The user chooses a selectable field row, including a reference field's own row (click or Enter) | Fires on every such selection, including re-selecting the same field. Drilling in with the chevron or the forward arrow key does not fire it. |

### Slots

None.

### Methods

| Method | Returns | Description |
| --- | --- | --- |
| `resetNavigation()` | `void` | Discards un-committed drill-in, clears the search, and returns to the panel for the current `dotWalkPath`, re-requesting its items. Call it before each reopen when the element stays mounted (for example inside a popover that is dismissed without a selection). |
| `getFieldContext(path: DotWalkPathEntry[])` | `Promise<DotWalkFieldContext \| undefined>` | Resolves the field metadata of the last entry in `path`, loading that entry's table through this element's own data when not already loaded. Resolves `undefined` for an empty path or a field the table does not have. Rejects with an `Error` carrying the load error message when the table's fields failed to load (for example an access error). |

### Data shapes

#### DotWalkConnectedPathUpdatedDetail

Parent: `dot-walk-connected-path-updated` `detail`

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `combinedPath` | `string` | required | Dotted path of the selection, for example `caller_id.department`. |
| `path` | [`DotWalkPathEntry[]`](#dotwalkpathentry) | required | One entry per hop, without hops marked `excludeFromPath`. Pass it back as `dotWalkPath` to restore the selection; a path that had excluded hops does not restore them. |
| `fieldContext` | [`DotWalkFieldContext`](#dotwalkfieldcontext) | `undefined` | Metadata of the selected (last) field; absent when none is available. |
| `type` | `string` | `undefined` | `fieldContext.type`, for choosing operators; absent when unknown. |

#### DotWalkPathEntry

Parent: `path[]`, `dotWalkPath[]`

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `source` | `string` | required | Table the field was picked from. |
| `internalValue` | `string` | required | Field name. |
| `displayValue` | `string` | required | Field label. |
| `reference` | `string` | `undefined` | Referenced table, for reference fields. |
| `precedingSeparatorTerm` | `string` | `undefined` | Separator placed before this entry when the combined path is built. |
| `excludeFromPath` | `boolean` | `undefined` | `true` omits the entry from `combinedPath` and the emitted `path`. |

#### DotWalkFieldContext

Parent: `fieldContext`

The subset of platform field metadata that is part of the contract; the runtime object may carry more.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `name` | `string` | required | Field name. |
| `type` | `string` | required | Field type, for example `string` or `reference`. |
| `label` | `string` | `undefined` | Field label. |
| `referenceTable` | `string \| null` | `undefined` | Referenced table, for reference fields. |
| `referenceKey` | `string \| null` | `undefined` | Key field of the referenced table. |
| `referenceTableDefaultField` | `string \| null` | `undefined` | Display field of the referenced table. |
| `dictionaryAttributes` | `Record<string, string> \| null` | `undefined` | Dictionary attributes of the field. |
| `extendedOperators` | `string[] \| null` | `undefined` | Operators the server adds for this field. |
| `excludedOperators` | `string[] \| null` | `undefined` | Operators the server removes for this field. |

#### PanelItemFilter

Parent: `panelItemFilter`

`(panelItem: PanelItem, source: string) => PanelItem | null`. Return the item (or a modified copy) to keep it, or `null` to drop it. `source` is the table the visible panel shows (for example `incident` at the root, `sys_user` after drilling into `caller_id`). It receives every row, including section headings (`itemType: 'HEADING'`).

`PanelItem` is not exported; type the parameter through `PanelItemFilter`, as in the example. Its fields:

| Field | Type | Description |
| --- | --- | --- |
| `internalValue` | `string` | Field name. |
| `displayValue` | `string` | Label shown. |
| `itemType` | `string \| undefined` | `'ITEM'`, `'DOTWALKABLE'` or `'HEADING'`. |
| `reference` | `string \| undefined` | Referenced table, for drillable items. |
| `description` | `string \| undefined` | Secondary description. |
| `secondaryLabel` | `string \| undefined` | Secondary label. |
| `selectable` | `boolean \| undefined` | Whether the item can be chosen. |
| `context` | object \| `undefined` | Field metadata; has every `DotWalkFieldContext` field. Not read from the returned item: `fieldContext` and `type` are looked up by `internalValue`, so keep `internalValue` unchanged in a modified copy. |
| `initialPanelOnly` | `boolean \| undefined` | Hides the item once the user has drilled past the root panel. |
| `excludeFromPath` | `boolean \| undefined` | Leaves this hop out of the emitted path. |
| `precedingSeparatorTerm` | `string \| undefined` | Joiner placed before this hop in `combinedPath`. |

## Integration details

### Platform requirements

- Needs a signed-in ServiceNow session. Serve the page from the instance origin (or its proxy).
- Creates and owns its own data cache; no store provider or other wrapper element is needed, and it does not share data with other instances or with `aiux-condition-builder`.
- A failed table load fires no event; `getFieldContext` rejects with the error.

### SSR

The constructor runs on the server; it creates the cache and fetches nothing. The server renders the search box and a "No results" message. Field data is requested in the browser after the inner element's first update, so the list populates only on the client.

### Lifecycle

- The cache is created once per element instance and survives disconnect and reconnect, so a re-attached element shows already loaded tables without refetching. Disconnect only stops live updates until reconnect. A load that finishes while detached is not shown on reconnect; call `resetNavigation()` after re-attaching.
- Search matches field labels among the already loaded items, about 500 ms after typing stops.
- Loaded tables are cached per table for the life of the instance and are not refetched.

### Sizing and layout

The element has no host styles. The inner panel fills its parent's height and applies a `-1rem` inline margin to cancel the padding of a popover; place it in a parent with bounded height and about `1rem` of inline padding (or inside a popover's content), otherwise the list overflows or clips at the edges.

## Accessibility, localization, and customization

- **Accessibility:** the field list is a labelled `listbox` of `option` items with `aria-selected`; a polite live region announces loading, no results and result counts. Arrow keys move through items, the forward key drills into a reference, the backward key goes up a level, and ArrowDown in the search box moves into the list. The "Load more" row is mouse-only. Focus moves to the first item after drill-in or back navigation. Arrow direction follows page direction in right-to-left layouts.
- **Localization:** built-in strings (no results, load more, drill-in labels) are localized, except the live-region announcements and the breadcrumb's "… options" label, which are English only. Field and table labels come from the instance.
- **Customization:** no slots, parts or CSS properties. Content is shaped with `fieldInclusions`, `fieldExclusions`, `panelItemFilter`, `disableDotwalking`, and `showSearch`. The focus ring follows the theme; row hover and selected backgrounds and the breadcrumb divider use fixed colors.
