# List selector

> Source: `@servicenow/aiux-components-coe-list-selector@6.0.2` · `components/external/list-selector/docs/usage/aiux-list-selector.md`

`<aiux-list-selector>` shows an Available list and a Selected list. The user
checks items to add them, removes and reorders them in the Selected list, and
the element reports the ordered selection through events. It never saves the
selection; persisting it is the host's job.

Two data modes:

- `mode="manual"` (default): the host supplies `items`, and supplies each
  referenced category when the user expands into it.
- `mode="auto"`: the element loads `table`'s fields (and each referenced table
  the user expands) from the instance itself.

Built in: search, dot-walk navigation into reference fields with breadcrumbs,
Shift-click range selection, Ctrl/Cmd+A select all, drag-and-drop and
Alt+Arrow reordering, multi-select and bulk remove in the Selected list,
locked and unselectable items, item counts, per-item info popovers,
responsive three-panel / two-panel / tabbed layouts, loading and error states,
and screen-reader announcements. Do not build these yourself.

## Import

```js
import '@servicenow/aiux-components-coe-list-selector';
```

## Usage

### Minimal complete example

Manual mode, loading a referenced category on demand:

```ts
import {html} from 'lit';
import {customElement, state} from 'lit/decorators.js';
import {AIUXElement} from '@servicenow/aiux-components-core';
import '@servicenow/aiux-components-coe-list-selector';

type Item = {label: string; reference: string | null};

const USER_FIELDS: Record<string, Item> = {
  name: {label: 'Name', reference: null},
  email: {label: 'Email', reference: null}
};

const INITIAL_SELECTION = [[{id: 'number', label: 'Number', locked: true}]];

@customElement('my-column-picker')
export class MyColumnPicker extends AIUXElement {
  @state() private _items: Record<string, Record<string, Item>> = {
    incident: {
      number: {label: 'Number', reference: null},
      short_description: {label: 'Short description', reference: null},
      assigned_to: {label: 'Assigned to', reference: 'sys_user'}
    }
  };
  @state() private _columns: string[] = ['number'];

  private _onExpand(e: CustomEvent) {
    const table = e.detail.item.reference;
    if (!this._items[table] && table === 'sys_user') {
      this._items = {...this._items, [table]: USER_FIELDS};
    }
  }

  private _onChange(e: CustomEvent) {
    // [[{id:'assigned_to',...},{id:'email',...}]] -> 'assigned_to.email'
    this._columns = e.detail.items.map((path: {id: string}[]) =>
      path.map(s => s.id).join('.')
    );
  }

  render() {
    return html`
      <div class="h-[28rem]">
        <aiux-list-selector
          items-root="incident"
          .items=${this._items}
          .selectedItems=${INITIAL_SELECTION}
          @aiux-list-selector:item-expand-requested=${this._onExpand}
          @aiux-list-selector:selected-items-change=${this._onChange}
        ></aiux-list-selector>
      </div>
      <p>Columns: ${this._columns.join(', ')}</p>
    `;
  }
}
```

**What happens:** the element keeps its own selection; do not bind the event
detail back into `selectedItems` (a new `selectedItems` array replaces the
selection, and the detail has no `locked` flags). Without `items-root`, each
new `items` object sends the Available list back to the root category.

### Additional patterns

Auto mode for a ServiceNow table, reusing the stable `INITIAL_SELECTION` above:

```js
html`
  <div class="h-[32rem]">
    <aiux-list-selector
      mode="auto"
      table="incident"
      show-extended-fields
      .selectedItems=${INITIAL_SELECTION}
      @aiux-list-selector:selected-items-change=${this._onChange}
    ></aiux-list-selector>
  </div>
`;
```

Paging a large category in manual mode: on
`aiux-list-selector:scrolled-to-bottom`, assign a new `items` object with more
entries added to `items[e.detail.category]` (keep `items-root` set).

## API

### Properties and attributes

Properties marked (config) can also be set by an admin in the platform Config
Editor; an admin value takes precedence over the bound value. Set
object-typed properties with a property binding.

| Property               | Attribute                 | Type                      | Default              | Update behavior                                    | Description                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ---------------------- | ------------------------- | ------------------------- | -------------------- | -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `mode`                 | `mode`                    | `'manual' \| 'auto'`      | `'manual'`           | Updates immediately; `auto` starts loading `table` | Data source. `table`, `graphqlEndpoint`, `showExtendedFields`, `includeSysId`, and `showVariables` apply only in `auto`.                                                                                                                                                                                                                                                                                                           |
| `table`                | `table`                   | `string`                  | `''`                 | Loads the table's fields                           | `auto`: table whose fields are listed. Required in `auto`. Changing it after the first render while items are selected clears the selection (see `hideResetWarning`). The Available list keeps showing the table it first opened; it follows `itemsRoot` changes only.                                                                                                                                                             |
| `tableName`            | `table-name`              | `string`                  | `''`                 | Same as `table`                                    | Alias of `table`; both read and write the same value.                                                                                                                                                                                                                                                                                                                                                                              |
| `graphqlEndpoint`      | `graphql-endpoint`        | `string`                  | `'/api/now/graphql'` | Next load                                          | `auto`: GraphQL URL used for field and variable queries.                                                                                                                                                                                                                                                                                                                                                                           |
| `allowDotWalking`      | `allow-dot-walking`       | `boolean`                 | `true`               | Updates immediately; reloads in `auto`             | `false` hides every expand chevron, in both modes, so only top-level items are selectable.                                                                                                                                                                                                                                                                                                                                         |
| `showExtendedFields`   | `show-extended-fields`    | `boolean`                 | `false`              | Reloads                                            | `auto`: also lists fields inherited from parent tables.                                                                                                                                                                                                                                                                                                                                                                            |
| `includeSysId`         | `include-sys-id`          | `boolean`                 | `false`              | Reloads                                            | `auto`: lists `sys_id`, which is hidden by default.                                                                                                                                                                                                                                                                                                                                                                                |
| `showVariables`        | `show-variables`          | `boolean`                 | `false`              | Applies to tables loaded after it is `true`        | `auto`: in panels whose table supports catalog variables, adds an "Other" section with a "Questions" entry that opens a searchable, paged list of variables (`item_option_new`) the user can select.                                                                                                                                                                                                                               |
| `items`                | property only             | `ItemsMap`                | `{}`                 | Updates immediately                                | `manual`: all available items, by category. Add a category when the user expands into it. `auto`: seeds only categories not yet loaded; later changes to a loaded category are ignored, so use `manual` when the host must control the data. `additionalData` is rendered as unsanitized HTML: pass only trusted or sanitized HTML.                                                                                                |
| `itemsRoot`            | `items-root`              | `string`                  | `''`                 | Returns the Available list to the root             | Root category. Empty uses `table` in `auto`, the first key of `items` in `manual`. In `manual`, while this category is missing from `items`, a loading state shows. Changing it from a non-empty value in `manual` while items are selected clears the selection.                                                                                                                                                                  |
| `selectedItems`        | property only             | `SelectedPathSegment[][]` | `[]`                 | Replaces the selection                             | Initial or reset selection, in order; each entry is the path from the root to the item. A path's last segment's `locked: true` makes it non-removable. Assign a new array to apply; no events fire.                                                                                                                                                                                                                                |
| `unselectableItems`    | property only             | `UnselectableItems`       | `{}`                 | Updates immediately                                | Item ids per category whose checkboxes are disabled and skipped by select all and range selection. Does not stop removing an already selected item; use `locked` for that.                                                                                                                                                                                                                                                         |
| `availableLabel`       | `available-label`         | `string`                  | `''`                 | Updates immediately                                | (config) Available heading. Empty shows "Available columns".                                                                                                                                                                                                                                                                                                                                                                       |
| `selectedLabel`        | `selected-label`          | `string`                  | `''`                 | Updates immediately                                | (config) Selected heading. Empty shows "Selected columns".                                                                                                                                                                                                                                                                                                                                                                         |
| `showCount`            | `show-count`              | `boolean`                 | `true`               | Updates immediately                                | (config) Appends `(n)` to headings: items in the current Available panel (unfiltered) and selected items. Set `false` with a property binding.                                                                                                                                                                                                                                                                                     |
| `headersLevel`         | `headers-level`           | `number`                  | `6`                  | Updates immediately                                | (config) Heading element level (1–6) for the two headings. Headings are tabs in the compact layout, where this has no effect.                                                                                                                                                                                                                                                                                                      |
| `search`               | `search`                  | `'initial' \| 'contains'` | `'initial'`          | Updates immediately                                | Case-insensitive match on labels and sub-labels: prefix (`initial`) or substring (`contains`). Also sets the operator of the server-side variable search.                                                                                                                                                                                                                                                                          |
| `viewType`             | `view-type`               | `ViewType`                | `'dotWalk'`          | Updates immediately                                | (config) Requested layout. `dotWalk`: expanded references open a second Available panel beside the first. `twoPanels`: one Available panel with breadcrumb drill-down. `compact`: Available and Selected as tabs. Overridden by the element's width: below the two-panel breakpoint always `compact`; below the three-panel breakpoint a requested `twoPanels` or `compact` becomes `twoPanels` (breakpoints under Customization). |
| `disableReorder`       | `disable-reorder`         | `boolean`                 | `false`              | Updates immediately                                | (config) Removes drag handles, drag-and-drop, and Alt+Arrow reordering.                                                                                                                                                                                                                                                                                                                                                            |
| `showSelectedItemPath` | `show-selected-item-path` | `boolean`                 | `false`              | Updates immediately                                | (config) `manual` only: clicking a Selected row opens its parent path in the Available list (every category on the path must be in `items`). Replaces click, Shift-click, and Ctrl/Cmd-click row selection in the Selected list.                                                                                                                                                                                                   |
| `hideResetWarning`     | `hide-reset-warning`      | `boolean`                 | `false`              | Updates immediately                                | (config) Hides the dismissible banner shown when a `table`/`itemsRoot` change clears the selection. The selection is still cleared.                                                                                                                                                                                                                                                                                                |
| `showHiddenControls`   | `show-hidden-controls`    | `boolean`                 | `false`              | Updates immediately                                | Shows info (ⓘ) buttons at all times instead of only on row hover or focus.                                                                                                                                                                                                                                                                                                                                                         |

### Events

Use the literal event names; they are not exported as constants. All bubble,
are composed, and are not cancelable.

| Event                                      | `detail`                    | Delivery          | Fires when                                                                                   | Notes                                                                                                                                                                     |
| ------------------------------------------ | --------------------------- | ----------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `aiux-list-selector:selected-items-change` | `SelectedItemsChangeDetail` | Bubbles, composed | After every user change to the selection: add, remove, reorder, select all, range selection. | Full ordered selection. No `locked` flags. Not fired for `selectedItems` assignments or for selections cleared by a `table`/`itemsRoot` change.                           |
| `aiux-list-selector:item-selected`         | `ItemSelectedDetail`        | Bubbles, composed | Once per item the user adds or removes.                                                      | On add, fires before `selected-items-change`; on removal from the Selected list, after it. Not fired for reorders.                                                        |
| `aiux-list-selector:item-expand-requested` | `ItemExpandRequestedDetail` | Bubbles, composed | The user clicks an item's expand chevron.                                                    | `manual`: add `items[detail.item.reference]` if missing; until then the panel shows "No fields to select from". `auto`: the element loads it; the event is informational. |
| `aiux-list-selector:scrolled-to-bottom`    | `ScrolledToBottomDetail`    | Bubbles, composed | An Available panel is scrolled near its bottom.                                              | Once per category until the user scrolls back up. The variables panel loads its own next page instead while more variables exist.                                         |
| `aiux-list-selector:search-term-set`       | `SearchTermSetDetail`       | Bubbles, composed | Every input in the Available search box.                                                     | The element already filters locally. Not fired by the variables search box.                                                                                               |

### Slots

None.

### Methods

None.

### Data shapes

```ts
type ItemsMap = Record<string, Record<string, ListSelectorItem>>; // category -> item id -> item

interface ListSelectorItem {
  label: string;
  reference: string | null; // category opened when expanded; null = not expandable
  subLabel?: string; // shown under the label; searched
  additionalData?: string; // HTML shown in the item's info popover; unsanitized (see `items`)
}

interface SelectedPathSegment {
  id: string;
  label: string;
  locked?: boolean; // read from the last segment only
}

type UnselectableItems = Record<string, string[]>; // category -> item ids

type ViewType = 'dotWalk' | 'twoPanels' | 'compact';

interface SelectedItemsChangeDetail {
  items: Array<Array<{id: string; label: string}>>;
}

interface ItemSelectedDetail {
  item: Array<{id: string; label: string}>; // path from root
  selected: boolean;
}

interface ItemExpandRequestedDetail {
  category: string; // category the expanded item is in
  itemId: string;
  item: ListSelectorItem;
  path: string[]; // item ids from root to the expanded item
}

interface ScrolledToBottomDetail {
  category: string;
}

interface SearchTermSetDetail {
  value: string;
  category: string; // left Available panel
  openedCategory: string | null; // right panel when a reference is expanded
}
```

A selected catalog variable's path is
`[{id: 'item_option_new', label: 'item_option_new'}, {id: <variable sys_id>, label}]`,
prefixed by any reference segments it was opened from. These types are not
exported by the package.

## Integration details

### SSR

The lists render on the server with the requested `viewType`; after
hydration the layout adjusts to the element's width. Loading spinners and info
popovers appear only in the browser. In `auto`, when the page URL has a `table`
query or route parameter, the element's loader pre-fetches that table's fields
on the server; when it equals `table`, no client request is made for it.
The pre-fetched data is not used when `showExtendedFields` or
`includeSysId` is `true`.

### Lifecycle

- `auto` field lists are cached per table for the element's lifetime; they
  reload only when `showExtendedFields`, `includeSysId`, or `allowDotWalking`
  changes.
- A failed or 10-second-timed-out load shows "Error loading data: <reason>"
  above the lists.
- Removing the element aborts in-flight loads; after re-insertion an aborted
  load shows the timeout error and is not retried until `table` or `mode`
  changes.

### Sizing and layout

`display: block; height: 100%`. Give the parent a bounded height; each list
scrolls inside it. The layout breakpoints are measured on the element's own
width, not the viewport.

## Accessibility, localization, and customization

- **Accessibility:** keyboard support is built in. Available list: `Enter`
  toggles the focused checkbox, Ctrl/Cmd+A selects all visible items in the
  focused panel, Shift+click selects a range, Left/Right arrows move between the
  two Available panels (mirrored in RTL). Selected list: click, Shift+click, and
  Ctrl/Cmd+click select rows, Ctrl/Cmd+A selects all unlocked rows,
  `Delete`/`Backspace` removes selected rows, Alt+Up/Down moves the focused row.
  Additions, removals, and reorders are announced. RTL is detected from the
  element's computed direction at first render.
- **Localization:** all built-in text is localized. The defaults refer to
  "columns" and "fields" ("Available columns", "No fields selected yet"); set
  `availableLabel`/`selectedLabel` for other content. Fetch error reasons are
  not localized.
- **Customization:** set `--list-selector-three-panel-breakpoint` (default
  `660px`) and `--list-selector-two-panel-breakpoint` (default `480px`) on the
  element. Colors come from the page's DaisyUI theme tokens (`--color-base-*`,
  `--color-primary`, `--color-text-*`); the font from `--wa-font-sans`. There
  are no parts or slots.
