# AIUXControlContentTree

> Source: `@servicenow/aiux-components-control@11.0.22` · `components/controls/docs/usage/aiux-control-content-tree.md`

An accessible, SSR-compatible WAI-ARIA tree-picker form-field control. It works in two modes: **standalone**, where the host supplies `items`/`selectedItems`/`expandedItems` directly and the component dispatches select/toggle/loading events for the host to act on, and **connected**, where the component fetches tree nodes itself from a ServiceNow table hierarchy given `tableName`/`fieldName`/`treePickerConfig`. Mode is auto-detected: setting `tableName` switches the component into connected mode. An orthogonal `variablePicker` flag, meaningful only in connected mode, switches the fetch and empty-state rendering to a dependent-field "variable picker" flow (e.g. for a related-record field's available variables) instead of a general table hierarchy.

**State ownership.** In standalone mode the component is fully controlled: it never mutates `items`/`selectedItems`/`expandedItems`/`loadingItems` itself, it only describes the requested change through `ITEM_SELECT`/`ITEM_TOGGLE`/`LOADING_REQUEST`. If the host ignores one of these events (or updates the wrong array), the tree silently stops responding — a click just re-dispatches the same `ITEM_SELECT` on the same unselected path next time, because the component's own idea of "selected" never advanced. In connected mode this is moot for `items`: the component owns the fetched tree and drives `selectedItems`/`expandedItems` through its internal controller, which is why those three standalone-mode events never bubble out once `tableName` is set.

Built in: WAI-ARIA TreeView keyboard navigation (arrow keys, Home/End, Enter/Space, `*` to expand siblings) with roving-tabindex focus management, single/multi/none selection modes with cascading multi-select, lazy "load more" for partially-loaded subtrees, and — in connected mode — the entire fetch/parse pipeline against the platform's tree-node endpoint. Do not reimplement tree keyboard navigation or the connected-mode fetch logic yourself.

## Import

```js
import '@servicenow/aiux-components-control';
```

## Usage

### Minimal complete example (standalone mode)

```js
import '@servicenow/aiux-components-control';
import {html} from 'lit';
import {AIUXElement} from '@servicenow/aiux/aiux-components-core';

class MyTreeHost extends AIUXElement {
  static properties = {
    selectedItems: {type: Array},
    expandedItems: {type: Array}
  };

  constructor() {
    super();
    this.items = [
      {id: 'root', label: 'Root', children: [{id: 'child', label: 'Child'}]}
    ];
    this.selectedItems = [];
    this.expandedItems = [];
  }

  render() {
    return html`
      <aiux-control-content-tree
        label="Category"
        .items=${this.items}
        .selectedItems=${this.selectedItems}
        .expandedItems=${this.expandedItems}
        @AIUX_CONTROL_CONTENT_TREE#ITEM_SELECT=${e => {
          this.selectedItems = e.detail.selectedItems;
        }}
        @AIUX_CONTROL_CONTENT_TREE#ITEM_TOGGLE=${e => {
          this.expandedItems = e.detail.expanded
            ? [...this.expandedItems, e.detail.path]
            : this.expandedItems.filter(p => p.join() !== e.detail.path.join());
        }}
      ></aiux-control-content-tree>
    `;
  }
}
```

**What happens:** clicking "Child" dispatches `ITEM_SELECT` with `path: ['root', 'child']` and the full recomputed `selectedItems`; the listener above replaces `this.selectedItems` wholesale and the tree re-renders with that node marked selected on the next update — the component itself never flips its own idea of what's selected. Expanding "Root" by clicking its expand/collapse control (or pressing Arrow Right/Left on the focused row) dispatches `ITEM_TOGGLE` with `expanded: true`; the listener appends `['root']` to `expandedItems` rather than replacing the array, because `ITEM_TOGGLE` only ever describes one path changing, not the whole expanded set. Enter/Space on a focused row always dispatches `ITEM_SELECT`, never `ITEM_TOGGLE` — even for a parent node. Keyboard navigation (arrows, Home/End, Enter/Space, `*`) is handled automatically through the same roving-tabindex controller used in connected mode.

### Additional patterns

Connected mode — fetching a table's hierarchy from the platform instead of supplying `items`:

```js
html`
  <aiux-control-content-tree
    .tableName=${'sys_user_group'}
    .fieldName=${'parent'}
    .referenceTable=${'sys_user_group'}
    .dependentValue=${this.parentGroupSysId}
    @AIUX_CONTROL_CONTENT_TREE_CONNECTED#ITEM_CLICKED=${e => {
      this.value = e.detail.value;
    }}
  ></aiux-control-content-tree>
`;
```

Variable-picker sub-mode (still connected mode; requires a dependent value before it shows anything):

```js
html`
  <aiux-control-content-tree
    .tableName=${'sys_user_group'}
    .variablePicker=${true}
    .dependentField=${'assignment_group'}
    .dependentValue=${this.assignmentGroupSysId}
    .dependentFieldLabel=${'Assignment group'}
  ></aiux-control-content-tree>
`;
```

## API

### Properties and attributes

| Property | Attribute | Type | Default | Update behavior | Description |
| --- | --- | --- | --- | --- | --- |
| `items` | — (`attribute: false`, property only) | `TreeItem[]` | `[]` | Read on render (standalone mode only — ignored once `tableName` is set). | Tree data: `{id, label, children?, childrenAvailable?, disabled?, icon?, sublabel?, actionable?, actions?, statuses?, referenceTable?, displayValue?}[]`. |
| `selectedItems` | — (`attribute: false`, property only) | `TreePath[]` (`string[][]`) | `[]` | Read on render (standalone mode only). | Currently selected paths, each an ordered array of node IDs from root to target. |
| `expandedItems` | — (`attribute: false`, property only) | `TreePath[]` | `[]` | Read on render (standalone mode only). | Currently expanded paths. |
| `loadingItems` | — (`attribute: false`, property only) | `LoadingEntry[]` (`{path, error?, errorMessage?}[]`) | `[]` | Read on render (standalone mode only). | Paths currently in a loading state (e.g. after a "load more" request). |
| `select` | `select` | `'single' \| 'multi' \| 'none'` | `'single'` | Read on every selection computation. | Selection mode. `'none'` disables selection entirely. |
| `ariaLabel` | `aria-label` | `string` | `''` | Read on render; falls back to a localized "Tree" label when empty. | Accessible label for the tree. |
| `overflow` | `overflow` | `'wrap' \| 'truncate'` | `'wrap'` | Read on render. | How long labels are handled. |
| `size` | `size` | `'sm' \| 'md'` | `'md'` | Read on render. | Visual density. |
| `showDividers` | `showdividers` | `boolean` | `false` | Read on render. | Whether dividers are drawn between top-level items. |
| `searchTerm` | `searchterm` | `string` | `''` | Read on render (passed to the tree renderer for highlighting/filtering). | Current search term. |
| `triggerIcon` | `triggericon` | `'chevron' \| 'caret' \| 'plus-minus'` | `'chevron'` | Read on render. | Expand/collapse icon style. |
| `tableName` | `tablename` | `string` | `''` | Setting a non-empty value switches the component into connected mode; triggers `firstUpdated` bootstrap and subsequent prop pushes to the connected controller. | Source table whose hierarchy to fetch (connected mode only). |
| `fieldName` | `fieldname` | `string` | `''` | Forwarded to the connected controller on change. | Field on `tableName` used to build the tree request. |
| `referenceTable` | `referencetable` | `string` | `''` | Forwarded to the connected controller on change. | Reference table whose parent/child hierarchy is walked. |
| `targetTable` | `targettable` | `string` | `''` | Forwarded to the connected controller on change; defaults to `referenceTable` when empty. | Table whose records are actually returned, when it differs from `referenceTable` (e.g. `sys_user_group` hierarchy returning `sys_user` records). |
| `dependentField` | `dependentfield` | `string` | `''` | Forwarded to the connected controller on change. | The dependent field name driving this tree (e.g. an assignment group field). |
| `dependentValue` | `dependentvalue` | `string` | `''` | A change refetches connected-mode data; required before the variable-picker sub-mode shows any content. | The dependent field's current value. |
| `dependentDisplayValue` | `dependentdisplayvalue` | `string` | `''` | Read on render (shown as a header in the variable-picker sub-mode). | Display value for `dependentValue`. |
| `dependentFieldLabel` | `dependentfieldlabel` | `string` | `''` | Read on render (used in the variable-picker's empty-state prompt). | Label of the dependent field, for the "Select ⟨label⟩ to add variables" prompt. |
| `treePickerConfig` | — (`attribute: false`, property only) | `TreePickerConfig \| null` (`{processor?, params?, targetPath?, filter?: {type?, reference?}}`) | `null` | Forwarded to the connected controller; `processor`/`params`/`filter` all affect the fetch request. | API configuration for connected-mode/variable-picker fetches. |
| `domainId` | `domainid` | `string` | `''` | Forwarded to the connected controller. | Domain scoping for the fetch. |
| `query` | `query` | `string` | `''` | Forwarded to the connected controller. | Additional encoded query for the fetch. |
| `variablePicker` | `variablepicker` | `boolean` | `false` | Forwarded to the connected controller; only has effect when `tableName` is also set. | Switches connected mode into the dependent-field variable-picker flow. |
| `height` | `height` | `number` (px) | Package's `DEFAULT_HEIGHT` constant | Read on render as an inline height style (skipped entirely when `fitToParent` is true). | Fixed pixel height of the tree box. |
| `fitToParent` | `fit-to-parent` | `boolean` | `false` | Reflects. Read on render; when true, `height` is ignored and CSS `:host([fit-to-parent])` rules fill the ancestor-provided height instead. | Fills an ancestor's layout height instead of a fixed pixel `height`. |

None of the connected-mode string properties above (`tableName`, `fieldName`, etc.) declare an explicit `attribute:` option, so per Lit's default their HTML attribute is the property name lowercased as a single word (e.g. `tableName` → `tablename`, not `table-name`) — bind them as JS properties (`.tableName=`) in Lit templates to avoid relying on that casing; only `ariaLabel` (`aria-label`) and `fitToParent` (`fit-to-parent`) have explicit kebab-case attributes.

Also inherits the full shared form-field identity surface from `AIUXControlElement` (`value`, `label`, `name`, `readonly`, `disabled`, `required`, `invalid`, `autofocus`, `nowId`, `controlStyles`, layout/messages/decoration/NACM properties, etc.) — `readonly` gates the inline read-only display view.

### Events

All standalone-mode events below are dispatched via the shared `dispatchAction()` helper (`bubbles: true, composed: true, cancelable: true`, `detail` always also includes `name` and an optional `meta`).

| Event | `detail` | Delivery | Fires when | Notes |
| --- | --- | --- | --- | --- |
| `AIUX_CONTROL_CONTENT_TREE#ITEM_SELECT` | `{path: TreePath, item: TreeItem, selectedItems: TreePath[]}` | Bubbles, composed, cancelable | A node is selected/deselected (click, Enter, or Space) — standalone mode only. | In connected mode this action type is intercepted internally and does not bubble out; use `ITEM_CLICKED` instead. |
| `AIUX_CONTROL_CONTENT_TREE#ITEM_TOGGLE` | `{path: TreePath, item: TreeItem, expanded: boolean}` | Bubbles, composed, cancelable | A parent node is expanded or collapsed — standalone mode only. | Intercepted internally in connected mode. |
| `AIUX_CONTROL_CONTENT_TREE#LOADING_REQUEST` | `{path: TreePath, item: TreeItem}` | Bubbles, composed, cancelable | A node with unloaded children (`childrenAvailable > children.length`) is expanded, or its "load more" control is used — standalone mode only. | Intercepted internally in connected mode. |
| `AIUX_CONTROL_CONTENT_TREE#LOADING_CANCELLED` | `{path: TreePath, item: TreeItem}` | Bubbles, composed, cancelable | A node that was loading is collapsed before loading completes — standalone mode only. | |
| `AIUX_CONTROL_CONTENT_TREE#ACTION_CLICKED` | `{path: TreePath, item: TreeItem, action: TreeItemAction}` | Bubbles, composed, cancelable | A per-item action button (from `item.actions`) is clicked. | Fires in both standalone and connected mode — not intercepted. |
| `AIUX_CONTROL_CONTENT_TREE_CONNECTED#ITEM_CLICKED` | `{value: string, displayValue: string, name: string, meta?: any}` | Bubbles, composed, cancelable | Connected mode only. Fires when: a leaf node is clicked; a parent node is clicked and `item.actionable` is true (expand-only clicks on a non-actionable parent never fire it); or a node is selected via keyboard (Enter/Space), which resolves the same way a click does. | **Gotcha:** a hierarchy can mix record types — e.g. a group tree whose nodes are both child groups and their member users. Clicking a node whose class doesn't match the field's target table does not commit that node; it walks up one level and commits its *parent* instead, mirroring the platform's own group-tree picking rule. So clicking a user nested under a group reports the group's `value`, not the user's — don't assume `detail.value` always matches the node you clicked. |

### Slots

None.

### Methods

None beyond the standard `focus()` override (moves DOM focus to the current roving-tabindex tree item) and `reset()` inherited from the base control.

## Integration details

### Platform requirements

Connected mode (including the variable-picker sub-mode) fetches from the platform's legacy XML tree-node endpoint (`/xmlhttp.do`), parsing the XML response client-side — this requires the same session/endpoint access as other legacy tree-picker UI, not a GraphQL endpoint.

### SSR

Guarded with `isServer` in the two places that would otherwise touch browser-only APIs: the keyboard-navigation controller skips attaching its `keydown` listener on the server, and the connected-mode fetch controller returns an empty result immediately on the server rather than calling `fetch()`/`DOMParser`. Standalone mode has no server-only dependencies.

### Lifecycle

In connected mode, `firstUpdated()` bootstraps the connected controller once; `willUpdate()` forwards every changed property to it, but it only re-fetches when `dependentValue` actually changes. `updated()` also drains any "pending item clicked" recorded by the controller and turns it into the `ITEM_CLICKED` event.

### Sizing and layout

`height` sets a fixed pixel height on the tree box; setting `fitToParent` switches to filling an ancestor-provided height instead via `:host([fit-to-parent])` CSS rules (the same pattern used by `html-editor`/`journal-input`). The variable-picker sub-mode and `fitToParent` both apply a bordered, scrollable box layout; plain connected/standalone rendering is a simple bordered container.

## Accessibility, localization, and customization

Implements the full WAI-ARIA TreeView keyboard pattern: Arrow Up/Down move focus between visible nodes, Arrow Right expands a collapsed parent or moves into its first child, Arrow Left collapses an expanded parent or moves to its parent, Enter/Space selects, Home/End jump to the first/last visible node, and `*` expands all siblings at the current level — with roving `tabindex` so only the focused node is tab-stoppable. The default `aria-label` ("Tree") and the variable-picker's empty-state prompts are produced via `@lit/localize`'s `msg()`, so they follow the host locale; item `label`/`sublabel`/action labels are supplied by the host or fetched from the server and are not translated by this control. There are no documented CSS parts or custom properties for external theming beyond the standard shared control layout classes.
