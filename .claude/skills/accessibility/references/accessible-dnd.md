# Accessible Drag and Drop: Guidelines & Best Practices

## Core Principle

Every drag-and-drop interaction must have an equivalent keyboard-only and screen-reader-accessible path. Mouse-based drag is the enhancement, not the baseline.

Follow the patterns reference for any ARIA components such as menu, slider, listbox, etc. `skills/accessibility/references/aria-apg-patterns-reference.md`

---

## The 5 Patterns

### 1. Interact with a Canvas (Move & Resize)

Move or resize objects freely on a 2D grid.

| Input        | Interaction                                                                                                                        |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| **Mouse**    | Click and drag the item to move; drag the corner handle to resize                                                                  |
| **Keyboard** | Press Spacebar on the **Move** / **Resize** button to enter that mode, arrow keys to adjust, Spacebar to confirm, Escape to cancel |

- Not all corners of a rectangular object need to be grabbable for keyboard users. Default to the bottom right corner, but adjust as requested.

### 2. Resize in One Dimension

Resize a table column width.

| Input        | Interaction                                                                                 |
| ------------ | ------------------------------------------------------------------------------------------- |
| **Mouse**    | Drag the column divider handle                                                              |
| **Keyboard** | Use a hidden slider from the APG (accessible via assistive tech) with Left/Right arrow keys |

### 3. Move Between Lists (Kanban)

Transfer items across categorized columns.

| Input        | Interaction                                                                                                                                                       |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Mouse**    | Drag items from one column and drop on another                                                                                                                    |
| **Keyboard** | Press spacebar on a **Move** button, arrow keys to move up and down within the same list, and left right to adjacent lists. Spacebar to confirm, Escape to cancel |
| **Keyboard** | Press the item's **Move** button to open a menu of destination lists, arrow keys to select, Enter to confirm, Escape to cancel                                    |

#### 3a. Kanban with Swim Lanes (Arrow-Key Move)

A kanban with **columns** (work item state) and **swim lanes** (rows, typically grouped by owner). Swim lanes are collapsible. The move pattern is "select-then-move" with arrow keys — this section covers that flow. (For the menu-based alternative, see the second Keyboard row in the table above.)

##### Activation

- User focuses a card and presses **Spacebar** on its **Move** button to enter move mode.
- On grab, announce the full context once so the user knows where they are starting from:
  - _"Card 'Refactor login' grabbed. Lane 'Priya Kapoor', column 'In progress', position 2 of 4. Use arrow keys to move, spacebar to drop, escape to cancel."_

##### Keyboard Mapping

Arrow keys match the visual layout — not DOM order. Within a swim lane, columns are arranged left-to-right and cards stack vertically inside each column.

| Key              | Behavior                                                                                             |
| ---------------- | ---------------------------------------------------------------------------------------------------- |
| **Up / Down**    | Move the card up/down within the current column of the current swim lane                             |
| **Left / Right** | Move the card to the adjacent column in the same swim lane                                           |
| **Up at top**    | Cross into the column above in the **previous** swim lane; land at **position Y of Y** (end of list) |
| **Down at end**  | Cross into the column below in the **next** swim lane; land at **position 1 of Y** (start of list)   |
| **Spacebar**     | Drop the card at the current location and exit move mode                                             |
| **Escape**       | Cancel the move, restore original position, exit move mode                                           |

The "Y of Y" / "1 of Y" rule keeps the card visually adjacent to where it came from when crossing a swim lane boundary, so the user's mental model of "I moved one row up" matches the rendered position.

##### Collapsed Swim Lanes

If a destination swim lane is collapsed, expand it as the card enters so the user sees the move land. Announce the expansion as part of the lane-change message: _"Lane 'Sam Lee' expanded. Position 1 of 3 in column 'In review'."_

##### Live-Region Announcements (Focus on the Changed Dimension)

Use a single `aria-live="assertive"` region. Each arrow-key move announces **only the dimension(s) that changed** — repeating unchanged context creates noise and slows the user down.

| Movement                            | Announce                                                                                                 |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Up/Down within same lane and column | Position only: _"Position 3 of 4."_                                                                      |
| Left/Right to adjacent column       | Column + position: _"Column 'In review', position 2 of 5."_                                              |
| Cross into a different swim lane    | Lane + column + position: _"Lane 'Sam Lee', column 'To do', position 1 of 3."_                           |
| Drop                                | Full confirmation: _"Card 'Refactor login' dropped in lane 'Sam Lee', column 'To do', position 1 of 3."_ |
| Cancel (Escape)                     | _"Move cancelled. Card returned to lane 'Priya Kapoor', column 'In progress', position 2 of 4."_         |

##### Edge Announcements

When an arrow key would move the card past the edge of the board, do not move — announce the edge instead so the user understands why nothing happened. Repeat the current position so the user has not lost their place.

| Edge                                             | Announce                               |
| ------------------------------------------------ | -------------------------------------- |
| Left arrow in the leftmost column                | _"Leftmost column. Position 2 of 4."_  |
| Right arrow in the rightmost column              | _"Rightmost column. Position 2 of 4."_ |
| Up arrow at position 1 of the top swim lane      | _"Top of board. Position 1 of 4."_     |
| Down arrow at position Y of Y of the bottom lane | _"Bottom of board. Position 4 of 4."_  |

##### Empty Columns

When a card enters an empty column, the position is _"position 1 of 1"_ once placed there. Announce the column (and lane, if it also changed) plus _"position 1 of 1."_

### 4. Move from one list to another

Reorder items within a grid-based sortable list.

| Input        | Interaction                                                                                                                                           |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Mouse**    | Click and drag to reorder                                                                                                                             |
| **Keyboard** | Navigate to an item, Spacebar to grab, Up/Down or Left/Right (depending on list orientation) arrows to reposition, Spacebar to drop, Escape to cancel |

### 5. Sort a Listbox

Reorder options inside a `role="listbox"`.

| Input        | Interaction                                                                                                             |
| ------------ | ----------------------------------------------------------------------------------------------------------------------- |
| **Mouse**    | Click to drag and drop between locations                                                                                |
| **Keyboard** | Arrow keys to focus an option, Spacebar to toggle drag-drop mode, arrows to reorder, Spacebar to drop, escape to cancel |

---

## Best Practices Demonstrated

### Aria Live Regions for Real-Time Feedback

- Use a single, visually hidden `<span>` with `aria-live="assertive"` to announce every state change: grabbed, moved, dropped, cancelled.
- Announce **position context** (e.g., _"Item grabbed. Current position in list: 3 of 7"_, _"Object location at 3,2 on the canvas"_).
- Announce **boundaries** (e.g., _"Reached left edge of canvas"_).
- Provide distinct messages for **grab**, **move**, **drop**, and **cancel** actions.

### Keyboard Interaction Model

- **Spacebar** is the universal grab/drop toggle across most patterns.
- **Arrow keys** are used for repositioning while in drag mode.
- **Escape** always cancels and reverts to the previous state.
- **Tab** is trapped during drag mode to prevent focus from leaving the dragged item.
- Provide hidden instructions via `aria-describedby` to the trigger button for move or resize (e.g., _"Press spacebar to grab and re-order"_).

### Semantic HTML & ARIA

- Use `role="listbox"` and `role="option"` with `aria-selected` for sortable listboxes.
- Use `aria-describedby` to link items to their interaction instructions.
- Use `aria-label` and a generic aria `role` for canvas regions (e.g., _"Canvas: 20 by 20"_).
- Visually hide instructions with `sr-only` while keeping them available to screen readers.

### Visual State Indicators

- Apply CSS classes for **grabbed**, **moving**, and **resizing** states.
- Reduce opacity of the original item during mouse drag, following rules for Non-Text Contrast so that these states are visible for users with low vision.
- Highlight drop targets during `dragenter` and remove on `dragleave`.

### Focus Management

- Return focus to the moved element after a keyboard-driven move completes.
- In Kanban, after moving a card to a new column, focus is programmatically set to the card's button in its new location.
- Listbox options manage focus via `tabIndex={0 | -1}` and `componentDidUpdate` auto-focus.

### Cancelability

- Store the previous state before any grab operation.
- **Escape** always restores the original state and announces _"Re-order cancelled"_ or _"Move cancelled"_.

### Alternative Controls for Complex Actions

- When drag-and-drop crosses containers (Kanban), provide a **menu button** as an alternative (not just keyboard shortcuts on the item itself).
- For resize, provide an ARIA `slider` as a fully accessible markup of the visual drag handle.

---

## Implementation Checklist

- [ ] Every mouse drag operation has an equivalent keyboard flow
- [ ] a centralized region using `aria-live="assertive"` announces all state transitions
- [ ] Grab/drop/cancel messages include positional context
- [ ] Spacebar toggles grab, arrows reposition, Escape cancels
- [ ] Focus is managed correctly after every operation
- [ ] Hidden instructions describe the keyboard interaction model
- [ ] Visual indicators reflect grabbed/moving/resizing states
- [ ] Previous state is stored so Escape can fully revert
- [ ] Alternative controls (menus, slider) exist for cross-container or resize operations
