# Checklist

> Source: `@servicenow/aiux-checklist@4.0.2` · `components/external/checklist/docs/usage/aiux-checklist.md`

`<aiux-checklist>` renders the items in `checklistData`, sorted by `order`.
It never changes `checklistData` itself: every check, add, edit, delete, and
reorder is reported as an event, and the host must set a new `checklistData`
(and save it, if needed). It loads and saves nothing.

Built in: per-item checkbox, link, required marker, and error text; numeric
or alphabetic prefixes; empty state; loading spinner. With `allow-editing`:
an add-item input, a "More options" menu (Edit all, Select all, Delete all),
per-item edit and delete buttons, double-click inline rename, a full-edit
panel (label, link, state toggles), and drag or keyboard reorder. Do not
build these yourself.

## Import

```js
import '@servicenow/aiux-checklist';
```

## Usage

### Minimal complete example

```ts
import {html} from 'lit';
import {customElement, state} from 'lit/decorators.js';
import {AIUXElement} from '@servicenow/aiux-components-core';
import '@servicenow/aiux-checklist';

// Declared locally from Data shapes (trimmed to the fields used here).
interface ChecklistItem {
  itemId: string;
  checked: boolean;
  label?: string;
  order?: number;
  required?: boolean;
}

@customElement('my-task-list')
export class MyTaskList extends AIUXElement {
  @state() private _items: ChecklistItem[] = [
    {
      itemId: 'review',
      label: 'Review request',
      checked: false,
      order: 1,
      required: true
    },
    {itemId: 'budget', label: 'Approve budget', checked: false, order: 2}
  ];

  private _replace(item: ChecklistItem) {
    this._items = this._items.map(it =>
      it.itemId === item.itemId ? item : it
    );
  }

  render() {
    return html`
      <aiux-checklist
        header-title="Tasks"
        prefix-type="numeric"
        allow-editing
        .checklistData=${this._items}
        @aiux-checklist:item-clicked=${(e: CustomEvent) =>
          this._replace({...e.detail.item, checked: e.detail.checked})}
        @aiux-checklist:item-added=${(e: CustomEvent) =>
          (this._items = [...this._items, e.detail.item])}
        @aiux-checklist:item-edited=${(e: CustomEvent) => this._replace(e.detail.item)}
        @aiux-checklist:item-deleted=${(e: CustomEvent) =>
          (this._items = this._items.filter(
            it => it.itemId !== e.detail.item.itemId
          ))}
        @aiux-checklist:all-items-edited=${(e: CustomEvent) => (this._items = e.detail.items)}
        @aiux-checklist:all-items-selected=${(e: CustomEvent) => (this._items = e.detail.items)}
        @aiux-checklist:all-items-deleted=${() => (this._items = [])}
        @aiux-checklist:list-reordered=${(e: CustomEvent) =>
          (this._items = e.detail.checklistData)}
      ></aiux-checklist>
    `;
  }
}
```

**What happens:** rows are added, removed, renamed, and reordered only when
`checklistData` changes. A clicked checkbox toggles on screen, but its state
persists only through `checklistData`.

### Additional patterns

Non-editable labels, checkable items, links in a new tab (set item `readonly` to block checking):

```js
html`
  <aiux-checklist
    .checklistData=${items}
    prefix-type="alphabetic"
    opens-window
    hide-border
    @aiux-checklist:item-clicked=${onItemClicked}
  ></aiux-checklist>
`;
```

## API

### Properties and attributes

Set `checklistData` and `checklistEditOptions` with property bindings.
Every property except `checklistData`, `showLoadingSpinner`, and
`checklistEditOptions` is also admin-configurable: a value set in the
element's configuration overrides the host's value until the override is
cleared.

| Property               | Attribute              | Type                                  | Default     | Update behavior     | Description                                                                                                                                       |
| ---------------------- | ---------------------- | ------------------------------------- | ----------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `checklistData`        | `checklist-data`       | `ChecklistItem[]`                     | `[]`        | Updates immediately | Items, rendered in ascending `order` (missing `order` counts as `0`). Omitted optional fields get their defaults. Empty shows the empty state.    |
| `allowEditing`         | `allow-editing`        | `boolean`                             | `false`     | Updates immediately | Shows the add-item input, the "More options" menu, per-item edit/delete buttons, reorder grips, and enables double-click rename and drag reorder. |
| `prefixType`           | `prefix-type`          | `'none' \| 'numeric' \| 'alphabetic'` | `'none'`    | Updates immediately | Label prefix: `1.`, `2.` … or `A.` … `Z.`, then `A.` again.                                                                                       |
| `size`                 | `size`                 | `'sm' \| 'md'`                        | `'md'`      | Updates immediately | Text size of items and the menu button size.                                                                                                      |
| `opensWindow`          | `opens-window`         | `boolean`                             | `false`     | Updates immediately | `true`: links open in a new tab with an icon. `false`: clicking a link does not navigate; handle `item-link-clicked`.                             |
| `headerTitle`          | `header-title`         | `string`                              | `''`        | Updates immediately | Heading with a divider above the list or empty state. None when empty.                                                                            |
| `emptyStateTitle`      | `empty-state-title`    | `string`                              | `''`        | Updates immediately | Empty-state heading. Empty uses "No items added yet".                                                                                             |
| `emptyStateMsg`        | `empty-state-msg`      | `string`                              | `''`        | Updates immediately | Empty-state text. Empty uses "Type and press Enter to add an item to the list" when editing is allowed, else no text.                             |
| `hideBorder`           | `hide-border`          | `boolean`                             | `false`     | Updates immediately | Removes the card background, border, radius, and padding.                                                                                         |
| `showLoadingSpinner`   | `show-loading-spinner` | `boolean`                             | `false`     | Updates immediately | Replaces everything, including the header and add-item input, with a spinner.                                                                     |
| `disableAddLink`       | `disable-add-link`     | `boolean`                             | `false`     | Updates immediately | Hides "Add link" in a single item's edit panel, so link-less items cannot gain a link there. Edit all always shows the link fields.               |
| `checklistEditOptions` | property only          | `ChecklistEditOptions`                | all `false` | Updates immediately | Which state toggles (Required, Disabled, Read only, Invalid) the edit panel shows.                                                                |

Item fields change only the item's presentation:

- `disabled`: disables the checkbox and dims the row.
- `readonly`: disables the checkbox and dims it.
- `required`: shows a red `*` and sets `aria-required` on the checkbox. Nothing is enforced.
- `invalid`: error-styles the checkbox and shows `errorMsgForLabel`.
- `link.errorMsgForLink`: shown under the link whenever set.
- Link URLs starting with `javascript:` or `data:` render as `#`.

### Events

None fires for programmatic `checklistData` changes.

| Event                               | `detail`                          | Delivery                          | Fires when                                                                                                                                                                                                                | Notes                                                                                                                                                                                                     |
| ----------------------------------- | --------------------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `aiux-checklist:item-clicked`       | `ChecklistItemClickedDetail`      | Bubbles, composed, not cancelable | The user toggles a checkbox.                                                                                                                                                                                              | `checked` is the new state; `item` is the item as it was. Disabled and read-only items cannot be toggled.                                                                                                 |
| `aiux-checklist:item-link-clicked`  | `ChecklistItemLinkClickedDetail`  | Bubbles, composed, not cancelable | The user clicks an item's link.                                                                                                                                                                                           | With `opensWindow` off, navigate yourself. With it on, the tab opens and the event still fires. `link` is the item's link as given; the `javascript:`/`data:` filter applies only to the rendered `href`. |
| `aiux-checklist:item-added`         | `ChecklistItemAddedDetail`        | Bubbles, composed, not cancelable | The user presses `Enter` in the add-item input with non-blank text.                                                                                                                                                       | `item` has a random UUID `itemId`, the trimmed label, `checked: false`, and an `order` after the last item's. The input clears; append `item` to show it.                                                 |
| `aiux-checklist:item-edited`        | `ChecklistItemEditedDetail`       | Bubbles, composed, not cancelable | Inline rename commits (`Enter` or blur, only when the label changed and is non-blank); the edit panel's Apply or `Enter` in its label field (even when nothing changed); or the item's Remove link button (`link: null`). | `item` is the complete updated item. The panel blocks Apply while the label is blank or link text has no URL. A link with blank URL and text is saved as `link: null`.                                    |
| `aiux-checklist:all-items-edited`   | `ChecklistAllItemsEditedDetail`   | Bubbles, composed, not cancelable | Edit all, then Apply, with every panel valid.                                                                                                                                                                             | `items` is every item in list order, edited or not; replace `checklistData` with it. An invalid panel blocks Apply and nothing fires. Cancel fires nothing.                                               |
| `aiux-checklist:item-deleted`       | `ChecklistItemDeletedDetail`      | Bubbles, composed, not cancelable | The user clicks an item's Delete button.                                                                                                                                                                                  | No confirmation.                                                                                                                                                                                          |
| `aiux-checklist:all-items-deleted`  | `ChecklistAllItemsDeletedDetail`  | Bubbles, composed, not cancelable | The user chooses Delete all.                                                                                                                                                                                              | No confirmation. `items` is every item. `item-deleted` does not fire.                                                                                                                                     |
| `aiux-checklist:all-items-selected` | `ChecklistAllItemsSelectedDetail` | Bubbles, composed, not cancelable | The user chooses Select all.                                                                                                                                                                                              | `items` is every item with `checked: true`, including disabled and read-only ones.                                                                                                                        |
| `aiux-checklist:list-reordered`     | `ChecklistListReorderedDetail`    | Bubbles, composed, not cancelable | A drag or keyboard reorder drops an item at a new position.                                                                                                                                                               | `checklistData` is the full reordered list with reassigned `order` values; replace `checklistData` with it. Not fired when dropped in place.                                                              |

### Slots

None.

### Methods

None.

### Data shapes

```ts
interface ChecklistItem {
  itemId: string; // unique; rows are keyed by it
  checked: boolean;
  label?: string; // default ''
  order?: number; // default 0; ascending display order
  required?: boolean; // default false
  disabled?: boolean; // default false
  readonly?: boolean; // default false
  invalid?: boolean; // default false
  errorMsgForLabel?: string; // shown when invalid
  link?: ChecklistItemLink | null; // default null
}

interface ChecklistItemLink {
  url: string;
  text?: string; // displayed text; url when omitted
  errorMsgForLink?: string;
}

interface ChecklistEditOptions {
  required: boolean;
  disabled: boolean;
  readonly: boolean;
  invalid: boolean;
}

interface ChecklistItemClickedDetail {
  checked: boolean;
  itemId: string;
  item: ChecklistItem;
}

interface ChecklistItemLinkClickedDetail {
  itemId: string;
  link: ChecklistItemLink;
  item: ChecklistItem;
}

interface ChecklistItemAddedDetail {
  item: ChecklistItem;
}
interface ChecklistItemEditedDetail {
  item: ChecklistItem;
}
interface ChecklistItemDeletedDetail {
  item: ChecklistItem;
}
interface ChecklistAllItemsEditedDetail {
  items: ChecklistItem[];
}
interface ChecklistAllItemsDeletedDetail {
  items: ChecklistItem[];
}
interface ChecklistAllItemsSelectedDetail {
  items: ChecklistItem[];
}

interface ChecklistListReorderedDetail {
  checklistData: ChecklistItem[];
  delta: ChecklistReorderDelta;
}

interface ChecklistReorderDelta {
  reorderedFromIndex: number; // moved item's old index
  reorderedToIndex: number; // moved item's new index
  movedUp: number[]; // old indices of items that shifted up one
  movedDown: number[]; // old indices of items that shifted down one
  updatedItems: ChecklistItem[]; // items whose order changed, moved item included, in new order
}
```

Items in event details have every optional field filled with its default.
The package's only export is the element class `AIUXChecklist` (named and
default).

## Integration details

### SSR

The header, items, empty state, and add-item input render on the server.
Announcements and right-to-left footer layout start in the browser.

### Sizing and layout

`display: block`; fills its container's width and grows with its items (no
internal scrolling).

## Accessibility, localization, and customization

- **Accessibility:** items form a list; each checkbox is named by its label
  ("Checklist item" when blank). Edit and delete buttons show on hover or
  focus. Double-click rename is mouse-only; the Edit item button is the
  keyboard path. Reorder by keyboard on an item's grip: `Enter`/`Space` to
  pick up, `ArrowUp`/`ArrowDown` to move, `Enter`/`Space` to drop, `Escape`
  or moving focus to cancel. `Escape` in the rename input or the edit
  panel's label field cancels the edit. The menu
  supports arrow keys, `Home`/`End`, and `Escape` (focus returns to the menu
  button). Adds, edits, deletes, reorders, Select all, Delete all, and Edit
  all results are announced.
- **Localization:** built-in labels, placeholders, validation messages, and
  announcements are localized. Item labels, link text, error messages, and
  the title properties are yours to translate. Prefixes are always Latin
  `A`–`Z` or Western digits.
- **Customization:** no CSS parts or custom properties; the element uses the
  page's DaisyUI theme. Use `hide-border` to drop the card frame.
