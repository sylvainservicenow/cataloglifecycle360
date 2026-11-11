# Accessible Canvas-Based Interfaces

This document provides accessibility techniques for canvas-based applications where users create, arrange, and connect visual elements. These patterns apply to flowchart builders, diagram tools, WYSIWYG editors, and similar interfaces.

---

## Overview

Canvas-based interfaces present unique accessibility challenges because they rely heavily on visual spatial relationships and pointer-based interactions. This guide covers two primary interface types:

1. **Node-Based Flowcharts** — Users create shapes and connect them with arrows to represent workflows, decision trees, or data flows
2. **WYSIWYG Palette/Canvas Applications** — Users place and arrange content elements in a freeform layout

Both interface types share common accessibility requirements while having distinct semantic structures.

---

## Implementation Approach

Canvas interfaces contain a lot of interacting pieces. Implement in three stages rather than all at once — each stage is independently testable:

1. **Stage 1 — Structure:** HTML, ARIA roles, and semantic labels for all canvas nodes and controls. Verify with a screen reader before writing any JS.
2. **Stage 2 — Keyboard navigation:** Arrow-key focus movement between nodes, Enter to open item actions, Escape to return. Roving tabindex for the canvas item list.
3. **Stage 3 — Live region announcements:** Focus announcements (node type, label, connections), mode entry/exit messages, and action confirmations.

This staged approach keeps each step reviewable and prevents output truncation from hiding broken keyboard or live region code.

---

## Shared Requirements

All canvas-based interfaces must address these core accessibility needs.

### Adding Items to the Canvas

Provide keyboard-accessible methods for creating new canvas elements.

#### Pattern A: Click-to-Create from Canvas Items

Add buttons directly on existing canvas items that spawn new connected elements.

```html
<div
  class="canvas-item"
  role="listitem"
  tabindex="0"
  aria-label="Decision: Check inventory, position row 2 column 1"
>
  <div class="item-content">
    <span class="item-label">Check inventory</span>
  </div>

  <!-- Add buttons appear on focus/hover -->
  <div class="add-controls" role="group" aria-label="Add connected item">
    <button
      class="add-button add-right"
      aria-label="Add item to the right"
      aria-haspopup="true"
    >
      <span aria-hidden="true">+</span>
    </button>
    <button
      class="add-button add-below"
      aria-label="Add item below"
      aria-haspopup="true"
    >
      <span aria-hidden="true">+</span>
    </button>
  </div>
</div>
```

When activated, the add button opens a palette picker:

```html
<div role="dialog" aria-label="Choose item type" aria-modal="true">
  <ul role="listbox" aria-label="Item types">
    <li role="option" tabindex="0">Process</li>
    <li role="option" tabindex="-1">Decision</li>
    <li role="option" tabindex="-1">Terminal</li>
    <li role="option" tabindex="-1">Data</li>
  </ul>
</div>
```

**Keyboard Interaction:**
Standard APG Menu behavior

- **Tab** — Move focus to add button when on canvas item
- **Enter/Space** — Open palette picker dialog
- **Arrow keys** — Navigate palette options
- **Enter** — Select item type and create new element
- **Escape** — Close palette without creating

#### Pattern B: Palette-First Creation

Users select an item type from a persistent palette, then it appears at the end of the canvas content.

```html
<aside class="element-palette" role="region" aria-label="Element palette">
  <h2>Add Elements</h2>
  <ul role="listbox" aria-label="Available elements">
    <li role="option" tabindex="0">
      <button aria-label="Add process shape to canvas">
        <span aria-hidden="true" class="shape-icon process"></span>
        Process
      </button>
    </li>
    <li role="option" tabindex="-1">
      <button aria-label="Add decision shape to canvas">
        <span aria-hidden="true" class="shape-icon decision"></span>
        Decision
      </button>
    </li>
    <li role="option" tabindex="-1">
      <button aria-label="Add text block to canvas">
        <span aria-hidden="true" class="shape-icon text"></span>
        Text
      </button>
    </li>
  </ul>
</aside>
```

**Keyboard Interaction:**

- **Tab** — Move focus to palette region
- **Arrow keys** — Navigate palette options
- **Enter/Space** — Add selected item to end of canvas
- Screen reader announces: "Process shape added to canvas at end of content"

---

### Moving Items on the Canvas

Provide keyboard controls for repositioning canvas elements.
Reference `@accessibility/references/accessible-dnd.md` for additional requirements around drag and drop keyboard and screen reader behaviors.

#### Enter Move Mode

Use a layered interaction model where arrow keys first navigate between items, then switch to moving the selected item.

```html
<div
  class="canvas-item selected"
  role="listitem"
  tabindex="0"
  aria-label="Process: Send confirmation, position row 3 column 2"
  aria-grabbed="true"
  data-mode="move"
>
  <!-- Item content -->
</div>
```

**Keyboard Interaction for Movement:**

| Key        | Navigation Mode                  | Move Mode                                |
| ---------- | -------------------------------- | ---------------------------------------- |
| Arrow keys | Move focus between canvas items  | Move selected item in that direction     |
| Enter      | Enter move mode for focused item | Confirm new position, exit move mode     |
| Escape     | —                                | Cancel move, return to original position |
| M          | Enter move mode                  | —                                        |

**Screen Reader Announcements During Move:**

```javascript
// When entering move mode
announceToScreenReader(
  'Move mode. Use arrow keys to move. Enter to confirm, Escape to cancel.'
);

// During movement
announceToScreenReader(
  'Moved to row 3, column 3. Adjacent to: Send email on left, End process below.'
);

// When other items shift
announceToScreenReader("Process 'Validate data' shifted right to column 4.");

// On confirm
announceToScreenReader(
  "Position confirmed. Process 'Send confirmation' now at row 3, column 3."
);

// On cancel
announceToScreenReader('Move cancelled. Returned to original position.');
```

#### Live Region for Movement Updates

```html
<div
  id="canvas-announcements"
  role="status"
  aria-live="polite"
  aria-atomic="false"
  class="sr-only"
>
  <!-- Dynamic announcements inserted here -->
</div>
```

```javascript
function announceToScreenReader(message) {
  const announcer = document.getElementById('canvas-announcements');
  announcer.textContent = message;
}

function moveItem(item, direction) {
  const oldPosition = getPosition(item);
  const newPosition = calculateNewPosition(item, direction);

  // Move the item
  updateItemPosition(item, newPosition);

  // Get information about adjacent items
  const adjacentItems = getAdjacentItems(newPosition);

  // Build comprehensive announcement
  let announcement = `Moved to row ${newPosition.row}, column ${newPosition.col}.`;

  if (adjacentItems.length > 0) {
    const adjacentDescriptions = adjacentItems
      .map(adj => `${adj.label} ${adj.direction}`)
      .join(', ');
    announcement += ` Adjacent to: ${adjacentDescriptions}.`;
  }

  // Announce any items that shifted
  const shiftedItems = getShiftedItems();
  shiftedItems.forEach(shifted => {
    announcement += ` ${shifted.label} shifted ${shifted.direction} to column ${shifted.newCol}.`;
  });

  announceToScreenReader(announcement);
}
```

---

### Navigating Canvas Items

Use a hierarchical navigation model with distinct layers.

#### Navigation Layers

**Layer 1: Canvas Level**
Arrow keys move between canvas items. Focus indicator shows current item.

**Layer 2: Item Actions**
After pressing Enter on an item, arrow keys cycle through available actions for that item.

```html
<div
  class="canvas-item focused"
  role="listitem"
  tabindex="0"
  aria-label="Decision: Check status"
  aria-expanded="true"
  aria-controls="item-actions-1"
>
  <div class="item-content">Check status</div>

  <!-- Action toolbar appears when item is entered -->
  <div
    id="item-actions-1"
    role="toolbar"
    aria-label="Actions for Check status"
    class="item-actions"
  >
    <button tabindex="0" aria-label="Edit label">Edit</button>
    <button tabindex="-1" aria-label="Move item">Move</button>
    <button tabindex="-1" aria-label="Connect to another item">Connect</button>
    <button tabindex="-1" aria-label="Delete item">Delete</button>
  </div>
</div>
```

**Keyboard Interaction:**

| Key              | Layer 1 (Canvas)             | Layer 2 (Item Actions)    |
| ---------------- | ---------------------------- | ------------------------- |
| Arrow Up/Down    | Move to item above/below     | —                         |
| Arrow Left/Right | Move to item left/right      | Cycle through actions     |
| Enter            | Enter Layer 2 (item actions) | Activate focused action   |
| Escape           | Exit canvas navigation       | Return to Layer 1         |
| Tab              | Move to next major region    | Move to next major region |

---

### Screen Reader Announcements

All canvas interactions require announcements for non-visual users.

#### Position and Context Announcements

When focus moves to an item, announce:

1. Item type and label
2. Position (row/column or semantic location)
3. Connection information (for flowcharts)
4. Available actions hint

```javascript
function announceItemFocus(item) {
  const type = item.dataset.type; // "process", "decision", etc.
  const label = item.querySelector('.item-label').textContent;
  const position = getItemPosition(item);
  const connections = getItemConnections(item);

  let announcement = `${type}: ${label}. `;
  announcement += `Position: row ${position.row}, column ${position.col}. `;

  if (connections.incoming.length > 0) {
    announcement += `Incoming from: ${connections.incoming.join(', ')}. `;
  }
  if (connections.outgoing.length > 0) {
    announcement += `Connects to: ${connections.outgoing.join(', ')}. `;
  }

  announcement += `Press Enter for actions.`;

  announceToScreenReader(announcement);
}
```

#### Movement Impact Announcements

When moving items, announce effects on other canvas elements:

```javascript
function announceMovementImpact(movedItem, affectedItems) {
  let announcement = `${movedItem.label} moved to ${movedItem.newPosition}. `;

  affectedItems.forEach(affected => {
    announcement += `${affected.label} ${affected.change}. `;
  });

  // Example output:
  // "Send email moved to row 2, column 3.
  //  Validate data shifted right to column 4.
  //  Connection from Check inventory updated."

  announceToScreenReader(announcement);
}
```

---

## Node-Based Flowcharts

Flowcharts require additional semantic structure to convey the logical relationships between nodes.

### Tree-Structured Flowcharts (Linear/Hierarchical)

When the flowchart has a clear hierarchical structure (like an org chart or decision tree), use nested ARIA lists to convey the semantic relationships.

```html
<div class="flowchart" aria-label="Order processing workflow">
  <!-- Visually hidden description of the overall flow -->
  <div class="sr-only" id="flow-description">
    This flowchart shows the order processing workflow with 8 steps. It starts
    with receiving an order and branches based on inventory status.
  </div>

  <ul
    role="tree"
    aria-describedby="flow-description"
    aria-label="Workflow steps"
  >
    <!-- Root node -->
    <li role="treeitem" aria-expanded="true" aria-level="1" tabindex="0">
      <span class="node terminal">Start: Receive order</span>

      <!-- Child nodes -->
      <ul role="group">
        <li role="treeitem" aria-expanded="true" aria-level="2" tabindex="-1">
          <span class="node process">Process: Validate order</span>

          <ul role="group">
            <li
              role="treeitem"
              aria-expanded="true"
              aria-level="3"
              tabindex="-1"
            >
              <span class="node decision">Decision: In stock?</span>

              <!-- Yes branch -->
              <ul role="group">
                <li role="treeitem" aria-level="4" tabindex="-1">
                  <span class="node process">Yes: Ship order</span>
                  <ul role="group">
                    <li role="treeitem" aria-level="5" tabindex="-1">
                      <span class="node terminal">End: Complete</span>
                    </li>
                  </ul>
                </li>

                <!-- No branch -->
                <li role="treeitem" aria-level="4" tabindex="-1">
                  <span class="node process">No: Backorder</span>
                  <ul role="group">
                    <li role="treeitem" aria-level="5" tabindex="-1">
                      <span class="node process">Notify customer</span>
                    </li>
                  </ul>
                </li>
              </ul>
            </li>
          </ul>
        </li>
      </ul>
    </li>
  </ul>
</div>
```

**Keyboard Interaction for Tree Structure:**

- **Arrow Up/Down** — Move between sibling nodes
- **Arrow Right** — Expand node / move to first child
- **Arrow Left** — Collapse node / move to parent
- **Home** — Move to first node
- **End** — Move to last visible node
- **Enter** — Activate node (open actions)

**Screen Reader Experience:**
The tree structure allows screen readers to announce hierarchy naturally:

- "Start: Receive order, expanded, level 1, 1 of 1"
- "Process: Validate order, expanded, level 2, 1 of 1"
- "Decision: In stock?, expanded, level 3, has 2 branches"

---

### Non-Linear Flowcharts (Complex Graphs)

When nodes have multiple incoming and outgoing connections that don't form a clear hierarchy, use visually hidden text to describe connections.

```html
<div
  class="flowchart complex"
  role="application"
  aria-label="System integration flowchart"
>
  <div class="sr-only" id="graph-description">
    This flowchart shows a system integration process with 6 interconnected
    nodes. Multiple paths lead to the central validation node.
  </div>

  <div
    class="canvas-area"
    role="list"
    aria-describedby="graph-description"
    aria-label="Flowchart nodes"
  >
    <div
      class="node"
      role="listitem"
      tabindex="0"
      aria-label="API Request"
      data-node-id="node-1"
    >
      <span class="node-label">API Request</span>

      <!-- Visually hidden connection description -->
      <span class="sr-only">
        Connects to: Data validation, Authentication check. No incoming
        connections (start node).
      </span>
    </div>

    <div
      class="node"
      role="listitem"
      tabindex="-1"
      aria-label="Data validation"
      data-node-id="node-2"
    >
      <span class="node-label">Data validation</span>

      <span class="sr-only">
        Incoming from: API Request, Database query, Manual input. Connects to:
        Process data.
      </span>
    </div>

    <div
      class="node"
      role="listitem"
      tabindex="-1"
      aria-label="Authentication check"
      data-node-id="node-3"
    >
      <span class="node-label">Authentication check</span>

      <span class="sr-only">
        Incoming from: API Request. Connects to: Process data (if valid), Error
        handler (if invalid).
      </span>
    </div>

    <div
      class="node"
      role="listitem"
      tabindex="-1"
      aria-label="Database query"
      data-node-id="node-4"
    >
      <span class="node-label">Database query</span>

      <span class="sr-only">
        Incoming from: Process data. Connects to: Data validation (creates
        loop), Response formatter.
      </span>
    </div>

    <!-- Additional nodes... -->
  </div>
</div>
```

#### Connection Management for Non-Linear Graphs

Provide a way to navigate and manage connections:

```html
<div class="node selected" role="listitem" tabindex="0" aria-expanded="true">
  <span class="node-label">Data validation</span>

  <!-- Connection panel appears when node is selected -->
  <div class="connections-panel" role="group" aria-label="Connections">
    <div class="incoming-connections">
      <h4 id="incoming-label">Incoming connections (3)</h4>
      <ul role="listbox" aria-labelledby="incoming-label">
        <li role="option" tabindex="0">
          From: API Request
          <button aria-label="Remove connection from API Request">×</button>
        </li>
        <li role="option" tabindex="-1">
          From: Database query
          <button aria-label="Remove connection from Database query">×</button>
        </li>
        <li role="option" tabindex="-1">
          From: Manual input
          <button aria-label="Remove connection from Manual input">×</button>
        </li>
      </ul>
    </div>

    <div class="outgoing-connections">
      <h4 id="outgoing-label">Outgoing connections (1)</h4>
      <ul role="listbox" aria-labelledby="outgoing-label">
        <li role="option" tabindex="0">
          To: Process data
          <button aria-label="Remove connection to Process data">×</button>
        </li>
      </ul>
      <button class="add-connection" aria-label="Add outgoing connection">
        + Add connection
      </button>
    </div>
  </div>
</div>
```

#### Creating Connections with Keyboard

```javascript
// Connection creation flow
function initiateConnection(sourceNode) {
  announceToScreenReader(
    `Creating connection from ${sourceNode.label}. ` +
      `Use arrow keys to navigate to target node, Enter to connect, Escape to cancel.`
  );

  enterConnectionMode(sourceNode);
}

function completeConnection(sourceNode, targetNode) {
  createConnection(sourceNode, targetNode);

  announceToScreenReader(
    `Connection created from ${sourceNode.label} to ${targetNode.label}. ` +
      `${targetNode.label} now has ${targetNode.incomingCount} incoming connections.`
  );

  exitConnectionMode();
}
```

---

## WYSIWYG Palette/Canvas Applications

WYSIWYG editors use spatial regions to communicate element positions semantically.

### Region-Based Layout Structure

Use ARIA regions with accessible names to describe the canvas layout areas:

```html
<div class="wysiwyg-canvas" aria-label="Page layout editor">
  <div class="sr-only" id="layout-description">
    Page layout with 3 columns. Use Tab to move between columns, arrow keys to
    navigate items within a column.
  </div>

  <!-- Column 1 -->
  <section
    class="canvas-column"
    role="region"
    aria-label="Column 1 of 3, left side"
    aria-describedby="col1-contents"
  >
    <span id="col1-contents" class="sr-only">
      Contains 2 items: Header image, Navigation menu
    </span>

    <div class="column-items" role="list">
      <div
        class="canvas-item"
        role="listitem"
        tabindex="0"
        aria-label="Header image, position 1 of 2 in column 1"
      >
        <img src="header.jpg" alt="Company logo header banner" />
      </div>

      <div
        class="canvas-item"
        role="listitem"
        tabindex="-1"
        aria-label="Navigation menu, position 2 of 2 in column 1"
      >
        <nav aria-label="Main navigation">
          <!-- Nav content -->
        </nav>
      </div>
    </div>

    <button class="add-to-column" aria-label="Add element to column 1">
      + Add element
    </button>
  </section>

  <!-- Column 2 -->
  <section
    class="canvas-column"
    role="region"
    aria-label="Column 2 of 3, center"
    aria-describedby="col2-contents"
  >
    <span id="col2-contents" class="sr-only">
      Contains 3 items: Hero text, Feature cards, Call to action button
    </span>

    <div class="column-items" role="list">
      <div
        class="canvas-item"
        role="listitem"
        tabindex="-1"
        aria-label="Hero text block, position 1 of 3 in column 2"
      >
        <!-- Content -->
      </div>

      <div
        class="canvas-item"
        role="listitem"
        tabindex="-1"
        aria-label="Feature cards, position 2 of 3 in column 2"
      >
        <!-- Content -->
      </div>

      <div
        class="canvas-item"
        role="listitem"
        tabindex="-1"
        aria-label="Call to action button, position 3 of 3 in column 2"
      >
        <!-- Content -->
      </div>
    </div>

    <button class="add-to-column" aria-label="Add element to column 2">
      + Add element
    </button>
  </section>

  <!-- Column 3 -->
  <section
    class="canvas-column"
    role="region"
    aria-label="Column 3 of 3, right side"
    aria-describedby="col3-contents"
  >
    <span id="col3-contents" class="sr-only">
      Contains 1 item: Sidebar widget
    </span>

    <div class="column-items" role="list">
      <div
        class="canvas-item"
        role="listitem"
        tabindex="-1"
        aria-label="Sidebar widget, position 1 of 1 in column 3"
      >
        <!-- Content -->
      </div>
    </div>

    <button class="add-to-column" aria-label="Add element to column 3">
      + Add element
    </button>
  </section>
</div>
```

### Moving Items Between Regions

When moving items in a WYSIWYG editor, announce the region context:

```javascript
function moveItemToColumn(item, targetColumn, position) {
  const sourceColumn = item.closest('.canvas-column');
  const sourceColumnLabel = sourceColumn.getAttribute('aria-label');
  const targetColumnLabel = targetColumn.getAttribute('aria-label');

  // Perform the move
  insertItemAtPosition(targetColumn, item, position);

  // Announce the change
  let announcement = `${item.label} moved from ${sourceColumnLabel} `;
  announcement += `to ${targetColumnLabel}, position ${position}. `;

  // Announce items that shifted
  const shiftedItems = getShiftedItemsInColumn(targetColumn);
  if (shiftedItems.length > 0) {
    announcement += `Items shifted: `;
    shiftedItems.forEach(shifted => {
      announcement += `${shifted.label} now at position ${shifted.newPosition}. `;
    });
  }

  announceToScreenReader(announcement);
}
```

### Freeform Positioning

For canvas applications without column structures, use coordinate-based announcements:

```html
<div
  class="freeform-canvas"
  role="application"
  aria-label="Design canvas, 1920 by 1080 pixels"
>
  <div
    class="canvas-item"
    role="img"
    tabindex="0"
    aria-label="Blue rectangle, position left 100 pixels, top 50 pixels, width 200 pixels, height 100 pixels"
    style="left: 100px; top: 50px; width: 200px; height: 100px;"
  ></div>

  <div
    class="canvas-item"
    role="img"
    tabindex="-1"
    aria-label="Text box: Welcome, position left 350 pixels, top 200 pixels"
    style="left: 350px; top: 200px;"
  >
    <span>Welcome</span>
  </div>
</div>
```

**Movement announcements for freeform canvas:**

```javascript
function announceFreformMove(item, newX, newY) {
  const nearbyItems = findNearbyItems(item, newX, newY, (threshold = 50));

  let announcement = `Moved to left ${newX} pixels, top ${newY} pixels. `;

  if (nearbyItems.length > 0) {
    announcement += `Near: `;
    nearbyItems.forEach(nearby => {
      const direction = getRelativeDirection(newX, newY, nearby.x, nearby.y);
      announcement += `${nearby.label} ${direction}. `;
    });
  }

  // Check for snap points or guides
  const snapInfo = checkSnapPoints(newX, newY);
  if (snapInfo.snapped) {
    announcement += `Snapped to ${snapInfo.description}. `;
  }

  announceToScreenReader(announcement);
}
```

---

## Implementation Checklist

### Keyboard Access

- [ ] All canvas items reachable via keyboard
- [ ] Clear focus indicators on all interactive elements
- [ ] Layered navigation model implemented (canvas → item → actions)
- [ ] Move mode with arrow keys
- [ ] Escape key returns to previous layer
- [ ] Keyboard shortcuts documented and discoverable

### Screen Reader Support

- [ ] Live region for dynamic announcements
- [ ] Position information included in item labels
- [ ] Connection information announced (for flowcharts)
- [ ] Movement impact on other items announced
- [ ] Region/column context provided (for WYSIWYG)
- [ ] Action hints provided on focus

### Semantic Structure

- [ ] Tree structure used for hierarchical flowcharts
- [ ] List structure used for flat collections
- [ ] Regions with accessible names for layout areas
- [ ] Hidden text describes connections in complex graphs

### Adding Items

- [ ] Keyboard-accessible add buttons on canvas items
- [ ] Palette region with keyboard navigation
- [ ] New item placement announced

### WCAG 2.2 Compliance

All A and AA are requirements, but these are particularly important.

- [ ] 2.1.1 Keyboard — All functionality keyboard accessible
- [ ] 2.1.2 No Keyboard Trap — Escape always available
- [ ] 2.4.3 Focus Order — Logical navigation sequence
- [ ] 2.4.7 Focus Visible — Clear focus indicators
- [ ] 4.1.2 Name, Role, Value — Proper ARIA implementation
- [ ] 4.1.3 Status Messages — Live region announcements

---

## Zoom and Pan Controls

For canvas-based tools, maps, and other 2D interfaces that require scrolling/panning, add explicit zoom and pan controls. Pinch gestures may conflict with browser zoom, so provide single-pointer alternatives to meet WCAG 2.5.1 (Pointer Gestures).

- Provide keyboard-accessible zoom in/out and pan buttons
- Announce the current zoom level via `aria-live="polite"`
- Group controls with `role="toolbar"` and `role="group"` with `aria-label`
- Ensure all control buttons meet minimum 44x44px touch target size
- Include a "Reset view" button to return to default zoom/position

```html
<!-- Minimal controls for canvas/map interfaces -->
<div role="toolbar" aria-label="Canvas controls">
  <div role="group" aria-label="Zoom">
    <button aria-label="Zoom in">+</button>
    <span aria-live="polite">100%</span>
    <button aria-label="Zoom out">−</button>
    <button aria-label="Reset zoom">⊙</button>
  </div>
</div>
```

---

## Testing Procedures

### Keyboard Testing

1. Tab through all interactive elements — verify logical order
2. Navigate canvas items with arrow keys — verify all items reachable
3. Enter and exit item action mode — verify layer transitions work
4. Move items with keyboard — verify announcements include adjacent items
5. Add new items via both methods — verify placement and announcements

### Screen Reader Testing

1. Navigate to canvas — verify overview description announced
2. Move between items — verify position and connections announced
3. Enter move mode — verify mode change announced
4. Move item — verify new position and affected items announced
5. Navigate WYSIWYG columns — verify region context announced
