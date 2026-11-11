# Tabs

## Pattern Usage

Tabs are a set of layered sections of content, known as tab panels, that display one panel of content at a time. Each tab panel has an associated tab element that, when activated, displays the panel.

**Activation Modes:**

| Mode      | Description                                                         |
| --------- | ------------------------------------------------------------------- |
| Automatic | Tab panel displays immediately when tab receives focus.             |
| Manual    | Tab panel displays when user activates tab with `Space` or `Enter`. |

## Keyboard Interaction

| Key                   | Function                                                                                                                                         |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `Tab`                 | When focus moves into tab list, places focus on the active tab. `Tab` then moves focus out of the tab list to next element in page tab sequence. |
| `Right Arrow`         | Moves focus to next tab. Wraps from last to first. With automatic activation, shows the associated panel.                                        |
| `Left Arrow`          | Moves focus to previous tab. Wraps from first to last. With automatic activation, shows the associated panel.                                    |
| `Space` or `Enter`    | With manual activation, activates the focused tab and displays its panel.                                                                        |
| `Home` _(Optional)_   | Moves focus to first tab. With automatic activation, shows its panel.                                                                            |
| `End` _(Optional)_    | Moves focus to last tab. With automatic activation, shows its panel.                                                                             |
| `Delete` _(Optional)_ | If tab deletion is allowed, deletes the focused tab and its panel, then moves focus.                                                             |

**Vertical Tabs:** If `aria-orientation="vertical"`, use `Down Arrow` / `Up Arrow` instead of `Right Arrow` / `Left Arrow`.

## WAI-ARIA Roles, States, and Properties

| Requirement                  | Implementation                                                                                |
| ---------------------------- | --------------------------------------------------------------------------------------------- |
| Tablist role                 | Tab list container has role `tablist`.                                                        |
| Tab role                     | Each tab has role `tab` and is contained in the tablist.                                      |
| Tabpanel role                | Each content panel has role `tabpanel`.                                                       |
| Selected state               | Active tab has `aria-selected="true"`. Inactive tabs have `aria-selected="false"`.            |
| Controls reference           | Each tab has `aria-controls` referencing its associated tabpanel.                             |
| Labelled by reference        | Each tabpanel has `aria-labelledby` referencing its associated tab.                           |
| Tablist name _(Optional)_    | If the tablist has a visible label, use `aria-labelledby`. Otherwise, use `aria-label`.       |
| Orientation                  | For vertical tabs, set `aria-orientation="vertical"` on the tablist. Default is `horizontal`. |
| Popup indicator _(Optional)_ | If a tab has a popup menu, set `aria-haspopup="menu"` on the tab.                             |

## Overflow and Reflow

When the tab list contains more tabs than can fit at the current viewport width, use an overflow menu rather than horizontal scrolling or wrapping to a second row.

**Rules:**

- Never allow horizontal scrolling within the tab list — this hides tabs from sighted users and breaks the single-Tab-stop keyboard model
- Never wrap tabs to multiple rows — this creates a confusing visual layout and ambiguous arrow-key navigation
- Collapse overflowing tabs into a "More" menu button at the end of the visible tab list
- The "More" button should have `aria-haspopup="menu"` and open a `role="menu"` with `role="menuitem"` for each hidden tab
- When a hidden tab is selected from the overflow menu, it should become the active tab and swap into the visible tab list (replacing the last visible tab, which moves into the overflow menu)
- At 320px viewport width (WCAG 1.4.10 Reflow), the tab list may need to show only 2-3 tabs with the rest in overflow

**Responsive pattern:**

```css
/* Tab list never scrolls or wraps */
.tablist {
  display: flex;
  overflow: hidden; /* Hide overflowing tabs — JS moves them to the menu */
}

.tab-overflow-button {
  flex-shrink: 0;
  /* Only visible when tabs overflow — toggle via JS */
}
```

```html
<div role="tablist" aria-label="Settings">
  <button role="tab" aria-selected="true">General</button>
  <button role="tab" aria-selected="false">Account</button>
  <!-- Remaining tabs hidden by overflow -->
  <button aria-haspopup="menu" aria-expanded="false">More</button>
</div>
```

---

## Forced Colors Requirements

### Tabs

```css
@media (forced-colors: active) {
  /* ========================================
     BASE STATE
     ======================================== */
  .tab {
    forced-color-adjust: none;
    background-color: ButtonFace;
    color: ButtonText;
    border: 2px solid ButtonBorder;
  }

  .tab svg,
  .tab [class*='icon'] {
    fill: ButtonText;
    stroke: ButtonText;
  }

  /* ========================================
     HOVER STATE
     ======================================== */
  .tab:hover {
    background-color: Highlight;
    color: HighlightText;
    border-color: Highlight;
  }

  .tab:hover svg,
  .tab:hover [class*='icon'] {
    fill: HighlightText;
    stroke: HighlightText;
  }

  /* ========================================
     FOCUS STATE
     ======================================== */
  .tab:focus,
  .tab:focus-visible {
    background-color: ButtonFace;
    color: ButtonText;
    border-color: Highlight;
    outline: 2px solid Highlight;
    outline-offset: 2px;
  }

  .tab:focus svg,
  .tab:focus-visible svg,
  .tab:focus [class*='icon'],
  .tab:focus-visible [class*='icon'] {
    fill: ButtonText;
    stroke: ButtonText;
  }

  /* ========================================
     FOCUS + HOVER STATE
     ======================================== */
  .tab:focus:hover,
  .tab:focus-visible:hover {
    background-color: Highlight;
    color: HighlightText;
    border-color: Highlight;
    outline: 2px solid Highlight;
    outline-offset: 2px;
  }

  .tab:focus:hover svg,
  .tab:focus-visible:hover svg,
  .tab:focus:hover [class*='icon'],
  .tab:focus-visible:hover [class*='icon'] {
    fill: HighlightText;
    stroke: HighlightText;
  }

  /* ========================================
     ACTIVE STATE
     ======================================== */
  .tab:active {
    background-color: SelectedItem;
    color: SelectedItemText;
    border-color: SelectedItem;
  }

  .tab:active svg,
  .tab:active [class*='icon'] {
    fill: SelectedItemText;
    stroke: SelectedItemText;
  }

  /* ========================================
     DISABLED STATE
     ======================================== */
  .tab:disabled,
  .tab[aria-disabled='true'] {
    background-color: ButtonFace;
    color: GrayText;
    border-color: GrayText;
  }

  .tab:disabled svg,
  .tab[aria-disabled='true'] svg,
  .tab:disabled [class*='icon'],
  .tab[aria-disabled='true'] [class*='icon'] {
    fill: GrayText;
    stroke: GrayText;
  }

  /* ========================================
     SELECTED STATE
     ======================================== */
  .tab[aria-selected='true'],
  .tab.is-active {
    background-color: SelectedItem;
    color: SelectedItemText;
    border-color: ButtonBorder;
  }

  .tab[aria-selected='true'] svg,
  .tab.is-active svg,
  .tab[aria-selected='true'] [class*='icon'],
  .tab.is-active [class*='icon'] {
    fill: SelectedItemText;
    stroke: SelectedItemText;
  }

  /* ========================================
     SELECTED + HOVER STATE
     ======================================== */
  .tab[aria-selected='true']:hover,
  .tab.is-active:hover {
    background-color: SelectedItem;
    color: SelectedItemText;
    border-color: Highlight;
  }

  /* ========================================
     SELECTED + FOCUS STATE
     ======================================== */
  .tab[aria-selected='true']:focus,
  .tab[aria-selected='true']:focus-visible,
  .tab.is-active:focus,
  .tab.is-active:focus-visible {
    background-color: SelectedItem;
    color: SelectedItemText;
    border-color: Highlight;
    outline: 2px solid Highlight;
    outline-offset: 2px;
  }

  /* ========================================
     SELECTED + DISABLED STATE
     ======================================== */
  .tab[aria-selected='true']:disabled,
  .tab[aria-selected='true'][aria-disabled='true'],
  .tab.is-active:disabled,
  .tab.is-active[aria-disabled='true'] {
    background-color: ButtonFace;
    color: GrayText;
    border-color: GrayText;
  }

  .tab[aria-selected='true']:disabled svg,
  .tab[aria-selected='true'][aria-disabled='true'] svg,
  .tab.is-active:disabled svg,
  .tab.is-active[aria-disabled='true'] svg,
  .tab[aria-selected='true']:disabled [class*='icon'],
  .tab[aria-selected='true'][aria-disabled='true'] [class*='icon'],
  .tab.is-active:disabled [class*='icon'],
  .tab.is-active[aria-disabled='true'] [class*='icon'] {
    fill: GrayText;
    stroke: GrayText;
  }
}
```
