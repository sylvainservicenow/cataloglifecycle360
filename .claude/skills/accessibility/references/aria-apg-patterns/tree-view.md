# Tree View

## Pattern Usage

A tree view widget presents a hierarchical list. Users can expand and collapse parent nodes to show or hide child nodes.

**Terminology:**

| Term            | Definition                                                 |
| --------------- | ---------------------------------------------------------- |
| Node            | An item in the tree.                                       |
| Root node       | Node at the base of the tree; has no parent.               |
| Parent node     | Node that can contain other nodes.                         |
| Child node      | Node contained by a parent.                                |
| End node (leaf) | Node with no children.                                     |
| Open/Closed     | Parent nodes can be expanded (open) or collapsed (closed). |

## Keyboard Interaction

| Key              | Function                                                                                           |
| ---------------- | -------------------------------------------------------------------------------------------------- |
| `Down Arrow`     | Moves focus to the next visible node.                                                              |
| `Up Arrow`       | Moves focus to the previous visible node.                                                          |
| `Right Arrow`    | On closed parent: opens the node. On open parent: moves to first child. On end node: does nothing. |
| `Left Arrow`     | On open parent: closes the node. On child or closed parent: moves focus to parent.                 |
| `Home`           | Moves focus to first node in the tree.                                                             |
| `End`            | Moves focus to last visible node in the tree.                                                      |
| `Enter`          | Activates the node (if actionable).                                                                |
| `Space`          | Toggles selection of the focused node (multi-select). In single-select trees, may select the node. |
| Type-ahead       | Moves focus to node starting with typed character(s).                                              |
| `*` _(Optional)_ | Expands all siblings at the same level as the focused node.                                        |

## WAI-ARIA Roles, States, and Properties

| Requirement           | Implementation                                                                                                                   |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Tree role             | Container has role `tree`.                                                                                                       |
| Treeitem role         | Each node has role `treeitem`.                                                                                                   |
| Group for children    | Parent nodes contain or own an element with role `group` that contains child nodes.                                              |
| Expanded state        | Parent nodes have `aria-expanded="false"` when closed, `aria-expanded="true"` when open. End nodes do not have `aria-expanded`.  |
| Multi-select          | If multi-select, tree has `aria-multiselectable="true"`.                                                                         |
| Selected state        | Selected nodes have `aria-selected="true"` (or `aria-checked="true"`). Unselected selectable nodes have `aria-selected="false"`. |
| Accessible name       | Tree has accessible name via `aria-labelledby` or `aria-label`.                                                                  |
| Level _(Optional)_    | If level info is useful, use `aria-level`. This is computed automatically with proper group nesting.                             |
| Position _(Optional)_ | If position info is useful, use `aria-posinset` and `aria-setsize`.                                                              |
