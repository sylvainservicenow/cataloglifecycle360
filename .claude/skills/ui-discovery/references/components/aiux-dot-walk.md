# Dot walk

> Source: `@servicenow/aiux-components-condition-builder@4.0.20` · `components/condition-builder/docs/usage/aiux-dot-walk.md`

`<aiux-dot-walk>` is a field picker with a search box, breadcrumbs, and one list panel at a time. It never fetches data. The host sets `initialPanelSource`, answers each `dw-panel-request` event by setting `panelItems`, and receives the chosen path in `dw-path-updated`. Search, breadcrumbs, drill-in and back navigation, keyboard handling, loading and empty states, and the "Load more" row are built in.

Use `aiux-dot-walk-connected` instead when the host wants the component to fetch the table and field data itself.

## Import

```js
import '@servicenow/aiux-components-condition-builder';
```

The element class is exported as `AIUXDotWalk`.

Types: `import type {DwPanelItem, DotWalkPathEntry, DotWalkPathUpdatedDetail, DwPanelRequestDetail, DwLoadMoreDetail} from '@servicenow/aiux-components-condition-builder';`

## Usage

### Minimal complete example

```ts
import {html} from 'lit';
import {customElement, state} from 'lit/decorators.js';
import {AIUXElement} from '@servicenow/aiux-components-core';
import '@servicenow/aiux-components-condition-builder';
import type {
  DwPanelItem,
  DwPanelRequestDetail,
  DotWalkPathUpdatedDetail
} from '@servicenow/aiux-components-condition-builder';

const PANELS: Record<string, DwPanelItem[]> = {
  incident: [
    {
      itemType: 'DOTWALKABLE',
      internalValue: 'caller_id',
      displayValue: 'Caller',
      reference: 'sys_user',
      selectable: true
    },
    {
      itemType: 'ITEM',
      internalValue: 'number',
      displayValue: 'Number',
      selectable: true
    }
  ],
  sys_user: [
    {
      itemType: 'ITEM',
      internalValue: 'email',
      displayValue: 'Email',
      selectable: true
    },
    {
      itemType: 'ITEM',
      internalValue: 'name',
      displayValue: 'Name',
      selectable: true
    }
  ]
};

@customElement('my-field-picker')
export class MyFieldPicker extends AIUXElement {
  @state() private _items: DwPanelItem[] = [];
  @state() private _isLoading = false;
  @state() private _selected = '';

  // Responses are not matched to requests, so tag each request and drop stale ones.
  private _latestRequest = 0;

  // Replace with any async data source.
  private async _loadItems(source: string): Promise<DwPanelItem[]> {
    return PANELS[source] ?? [];
  }

  private async _handlePanelRequest(e: CustomEvent<DwPanelRequestDetail>) {
    const {source, searchTerm} = e.detail;
    const request = ++this._latestRequest;
    this._isLoading = true;
    try {
      const items = await this._loadItems(source);
      if (request !== this._latestRequest) return;
      this._items = items.filter(item =>
        item.displayValue.toLowerCase().includes(searchTerm.toLowerCase())
      );
    } catch {
      if (request !== this._latestRequest) return;
      // On failure show an empty panel; the element renders "No results".
      this._items = [];
    } finally {
      if (request === this._latestRequest) this._isLoading = false;
    }
  }

  private _handlePathUpdated(e: CustomEvent<DotWalkPathUpdatedDetail>) {
    this._selected = e.detail.combinedPath; // e.g. "caller_id.email"
  }

  render() {
    return html`
      <div style="height: 320px; width: 280px; padding: 0 1rem">
        <aiux-dot-walk
          .initialPanelSource=${'incident'}
          .panelItems=${this._items}
          .isLoading=${this._isLoading}
          @dw-panel-request=${this._handlePanelRequest}
          @dw-path-updated=${this._handlePathUpdated}
        ></aiux-dot-walk>
      </div>
      <p>Selected: ${this._selected}</p>
    `;
  }
}
```

**What happens:** After the element first renders in the browser it fires `dw-panel-request` with `source: 'incident'`; the host sets `panelItems` and the list appears. Clicking the chevron on "Caller" (or pressing the forward arrow key) fires a request with `source: 'sys_user'`, shows a breadcrumb, and displays the host's items. Choosing "Email" fires `dw-path-updated` with `combinedPath: 'caller_id.email'`.

### Additional patterns

- **Restore a saved selection.** Set `dotWalkPath` to the `path` from an earlier `dw-path-updated`. Hops marked `excludeFromPath` are not in that `path`, so they are not restored. On mount the element requests the panel of the last entry's `source` and highlights that entry.
- **Paging.** Set `showLoadMore` while more items exist. On `dw-load-more`, set `isLoadingMore` to `true`, fetch the next page for `detail.source` and `detail.searchTerm`, set `panelItems` to the existing items plus the new ones (the element does not append), then clear `isLoadingMore` and update `showLoadMore`.
- **Reset on reopen.** If the host keeps the element mounted while hiding it, call `resetNavigation()` when it is dismissed or reopened so the next view starts from the committed `dotWalkPath`.

## API

### Properties and attributes

Attributes are the lowercased property name (no kebab-case). Boolean attributes are true when present, so set `showSearch` to `false` as a property. Pass arrays as properties.

| Property | Attribute | Type | Default | Update behavior | Description |
| --- | --- | --- | --- | --- | --- |
| `initialPanelSource` | `initialpanelsource` | `string` | `''` | Read when a request is made | Source identifier of the root panel, sent as `source` in the first `dw-panel-request` and whenever navigation returns to the root. Required. |
| `panelItems` | `panelitems` (JSON) | [`DwPanelItem[]`](#dwpanelitem) | `[]` | Updates immediately | Items for the currently active panel only. Set in response to `dw-panel-request`. Items with `initialPanelOnly` are hidden below the root panel. |
| `isLoading` | `isloading` | `boolean` | `false` | Updates immediately | `true` replaces the list with a spinner. Set it before fetching and clear it when `panelItems` is set. |
| `isLoadingMore` | `isloadingmore` | `boolean` | `false` | Updates immediately | `true` changes the "Load more" row to a non-clickable loading label. |
| `showLoadMore` | `showloadmore` | `boolean` | `false` | Updates immediately | Shows a "Load more" row after the items; clicking it fires `dw-load-more`. |
| `showSearch` | `showsearch` | `boolean` | `true` | Updates immediately | Shows the search input above the list. |
| `customSearchTerm` | `customsearchterm` | `string` | `''` | Applied when the value changes | Text shown in the search input. Changing it updates the input and becomes the `searchTerm` of the next `dw-load-more`; it does not fire `dw-panel-request`. |
| `enableSearchAutofocus` | `enablesearchautofocus` | `boolean` | `false` | Read on first render | Focuses the search input when the element first renders. |
| `dotWalkPath` | `dotwalkpath` (JSON) | [`DotWalkPathEntry[]`](#dotwalkpathentry) | `[]` | Applied when the array reference changes | Committed path to restore. Replaces the element's current navigation and returns to the last entry's panel (no request is fired; call `resetNavigation()` or re-request yourself to refresh items). The element does not update this property when the user picks a field. |

### Events

All events bubble, are composed, and are not cancelable. Other `dw-*` and `cb-*` events may bubble out of the element; they are internal.

| Event | `detail` | Delivery | Fires when | Notes |
| --- | --- | --- | --- | --- |
| `dw-panel-request` | `{source: string, searchTerm: string}` | Bubbles, composed | After first render (browser only); the user drills into a reference; goes back or clicks a breadcrumb; types in the search input (about 500 ms after typing stops); `resetNavigation()` is called | Answer by setting `panelItems`. `source` is `initialPanelSource` at the root; otherwise it is the table of the panel being shown: a path entry's `source`, or the `reference` of the hop drilled into. `searchTerm` is trimmed and is `''` for all but search input. Responses are not matched to requests, so ignore stale ones. |
| `dw-load-more` | `{source: string, searchTerm: string}` | Bubbles, composed | The user clicks the "Load more" row | `source` and `searchTerm` describe the active panel. Fetch the next page and set `panelItems` to the combined list. |
| `dw-path-updated` | [`DotWalkPathUpdatedDetail`](#dotwalkpathupdateddetail) | Bubbles, composed | The user chooses a selectable item (click or Enter) | `DOTWALKABLE` items that are `selectable` also fire this when the row itself is chosen; the chevron or forward arrow key drills in instead. |

### Slots

None.

### Methods

| Method | Returns | Description |
| --- | --- | --- |
| `resetNavigation()` | `void` | Discards in-progress navigation, returns to the current `dotWalkPath` (root panel when empty), clears the search text, and fires `dw-panel-request` for that panel. |

### Data shapes

#### DwPanelItem

Parent: `panelItems[]`

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `internalValue` | `string` | required | Value used in the path and `combinedPath`; also marks the highlighted row when it equals the path entry's `internalValue`. |
| `displayValue` | `string` | required | Row label. |
| `itemType` | `string`: `'ITEM'`, `'DOTWALKABLE'` or `'HEADING'` | `undefined` | `HEADING` renders a non-interactive title. `DOTWALKABLE` adds a chevron that drills into `reference`. Any other value, including `undefined`, renders a plain row. |
| `selectable` | `boolean` | `undefined` | Falsy renders the row disabled: clicking or pressing Enter does nothing. A non-selectable `DOTWALKABLE` row can still be drilled into. |
| `reference` | `string` | `undefined` | Source requested when the item is drilled into. A `DOTWALKABLE` item without it fires no request; the previous items stay visible under the new breadcrumb. |
| `description` | `string` | `undefined` | Second line under the label. |
| `secondaryLabel` | `string` | `undefined` | Text shown after the label, or after a heading title. |
| `initialPanelOnly` | `boolean` | `undefined` | Hides the item once the user has drilled past the root panel. |
| `excludeFromPath` | `boolean` | `undefined` | Leaves this hop out of `path` and `combinedPath` in `dw-path-updated`. |
| `precedingSeparatorTerm` | `string` | `'.'` | Joiner placed before this hop in `combinedPath`; ignored for the first hop. |

#### DotWalkPathEntry

Parent: `dotWalkPath[]`, `DotWalkPathUpdatedDetail.path[]`

One hop of the path. It has the same `internalValue`, `displayValue`, `reference`, `precedingSeparatorTerm`, and `excludeFromPath` fields as `DwPanelItem`, plus:

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `source` | `string` | required | Source of the panel the hop was chosen from. Set by the element; supply it when restoring. |

#### DotWalkPathUpdatedDetail

Parent: `dw-path-updated` `detail`

| Field | Type | Description |
| --- | --- | --- |
| `path` | [`DotWalkPathEntry[]`](#dotwalkpathentry) | Chosen hops, without those marked `excludeFromPath`. |
| `combinedPath` | `string` | `internalValue` of each hop joined by `.` (or each hop's `precedingSeparatorTerm`), such as `caller_id.department`. |

## Integration details

### SSR

The element renders on the server. The first `dw-panel-request` fires only in the browser after first render, so server output contains the search box and the host's `panelItems` (a "No results" message when there are none). To avoid an empty or flashing list, pass items for the root source at render time and still answer the first browser request.

### Lifecycle

- Drill-in, back, and breadcrumb navigation are internal and are not committed until a selection fires `dw-path-updated`. After a selection the path and breadcrumbs stay and the search box is cleared; no new `dw-panel-request` fires, so the list keeps its last items until the next request. The path and breadcrumbs reset when `dotWalkPath` changes or `resetNavigation()` is called.
- After drill-in, back, or breadcrumb navigation, focus moves to the first item once the host's new `panelItems` arrive (when `isLoading` returns to `false`, or when `panelItems` changes while not loading).
- Clicking the root breadcrumb clears the path and returns to `initialPanelSource`.

### Sizing and layout

The host element has no styles of its own and renders inline; its inner container is `height: 100%` and scrolls the list, so put it in a block parent with a bounded height. Its content has a negative `-1rem` horizontal margin intended to cancel the padding of a popover container; inside a plain container the content extends past the edges, so wrap it in an element with horizontal padding or `overflow: hidden` if that is unwanted.

## Accessibility, localization, and customization

- **Accessibility:** The list is a `listbox` of `option` rows with `aria-selected` and `aria-disabled`, labeled by the active source. A polite live region announces loading, "No results", or the result count. Keyboard: Up and Down move between rows, Enter chooses a selectable row, the forward arrow key (Right in LTR, Left in RTL) drills into a `DOTWALKABLE` row, the opposite arrow goes back one level, and Down from the search input focuses the first row. Arrow direction follows the computed text direction. The "Load more" row is mouse-only.
- **Localization:** Built-in strings (search placeholder, "No results", "Expand", "Load more…", "Loading…") are localized. The live region messages and the breadcrumb's "… options" label are English only. The host supplies all item labels.
- **Customization:** No slots or documented parts. The focus ring follows the theme tokens; row hover and selected backgrounds and the breadcrumb divider use fixed colors.
