# Combobox

> **See also:** The Dropdown component uses this pattern for **selection** (filterable list, `role="combobox"` / `role="listbox"`). For **action** dropdowns (menus with `role="menu"` items), see [`menu-button.md`](menu-button.md).

## Pattern Usage

A combobox is an input widget that has an associated popup. The popup enables users to choose a value for the input from a collection. The popup can be a `listbox`, `grid`, `tree`, or `dialog`.

**Autocomplete Behaviors:**

| Behavior            | `aria-autocomplete` Value | Description                                               |
| ------------------- | ------------------------- | --------------------------------------------------------- |
| No autocomplete     | `none`                    | Popup values are the same regardless of characters typed. |
| List autocomplete   | `list`                    | Popup values are filtered to match typed characters.      |
| Inline autocomplete | `inline`                  | Suggested completion text appears inline in the textbox.  |
| Both                | `both`                    | Combines list filtering with inline completion.           |

## Keyboard Interaction

**Textbox (combobox element):**

| Key                             | Function                                                                             |
| ------------------------------- | ------------------------------------------------------------------------------------ |
| `Down Arrow`                    | If popup is closed, opens popup. If popup is open, moves focus to next option.       |
| `Up Arrow`                      | If popup is closed, opens popup. If popup is open, moves focus to previous option.   |
| `Escape`                        | Closes popup if open. Optionally clears textbox.                                     |
| `Enter`                         | If popup is open and an option is focused, accepts that value. Closes popup.         |
| `Tab`                           | Accepts current value (if any), closes popup, moves focus to next focusable element. |
| `Alt + Down Arrow` _(Optional)_ | Opens popup without moving focus into it.                                            |
| `Alt + Up Arrow` _(Optional)_   | If popup is open, closes it and returns focus to combobox.                           |
| Printable Characters            | Types into textbox; may filter popup options based on autocomplete behavior.         |

**Listbox Popup:**

| Key          | Function                                                |
| ------------ | ------------------------------------------------------- |
| `Down Arrow` | Moves focus to next option.                             |
| `Up Arrow`   | Moves focus to previous option.                         |
| `Home`       | Moves focus to first option.                            |
| `End`        | Moves focus to last option.                             |
| Type-ahead   | Moves focus to option starting with typed character(s). |

## WAI-ARIA Roles, States, and Properties

| Requirement           | Implementation                                                                                                                     |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Combobox role         | The input element has role `combobox`.                                                                                             |
| Popup reference       | `aria-controls` references the popup element (required when popup is visible).                                                     |
| Popup type            | If popup is not a listbox, `aria-haspopup` is set to `grid`, `tree`, or `dialog`. Default is `listbox`.                            |
| Expanded state        | `aria-expanded="false"` when popup is hidden; `aria-expanded="true"` when visible.                                                 |
| Active descendant     | When focus is visually on a popup option but DOM focus remains on combobox, `aria-activedescendant` references the focused option. |
| Autocomplete behavior | `aria-autocomplete` is set to `none`, `list`, `inline`, or `both`.                                                                 |
| Selected option       | In the popup, visually indicated selected option has `aria-selected="true"`.                                                       |
| Accessible name       | Combobox has accessible name via `<label>`, `aria-labelledby`, or `aria-label`.                                                    |

---

## Forced Colors Requirements

A combobox has three distinct parts with different forced-colors treatments:

1. **Input field** — interactive form control; uses the form input pattern (`Field`/`FieldText`, `forced-color-adjust: none`)
2. **Toggle button** (expand/collapse chevron) — interactive; uses the button pattern (`ButtonFace`/`ButtonText`)
3. **Listbox popup container** — non-interactive; uses `Canvas`/`CanvasText` with **no** `forced-color-adjust: none`. Individual **option elements** within it DO use `forced-color-adjust: none` — the container's setting does not reliably cascade to children for color-pair enforcement.

**Critical:** Combobox focus is managed via `aria-activedescendant` — DOM focus stays on the input, not the options. The visually active option (indicated by `aria-activedescendant`) must have both `background-color: Highlight` **and** `color: HighlightText` set explicitly. Setting only the background without the text color leaves the option text as `CanvasText` on a `Highlight` background, which causes the dark-text-on-cyan failure seen in Windows High Contrast Mode. Additionally, option elements must have `forced-color-adjust: none` applied individually — `forced-color-adjust: none` on the container does not reliably cascade to make child color pairs take effect.

```css
@media (forced-colors: active) {
  /* ========================================
     INPUT FIELD
     ======================================== */
  .combobox-input {
    forced-color-adjust: none;
    background-color: Field;
    color: FieldText;
    border: 2px solid ButtonBorder;
  }

  .combobox-input::placeholder {
    color: GrayText;
  }

  .combobox-input:hover {
    border-color: Highlight;
  }

  .combobox-input:focus,
  .combobox-input:focus-visible {
    border-color: Highlight;
    outline: 2px solid Highlight;
    outline-offset: 2px;
  }

  /* ========================================
     TOGGLE BUTTON (expand/collapse chevron)
     ======================================== */
  .combobox-toggle {
    forced-color-adjust: none;
    background-color: ButtonFace;
    color: ButtonText;
    border: 2px solid ButtonBorder;
  }

  .combobox-toggle svg,
  .combobox-toggle [class*='icon'] {
    fill: ButtonText;
    stroke: ButtonText;
  }

  .combobox-toggle:hover {
    background-color: Highlight;
    color: HighlightText;
    border-color: Highlight;
  }

  .combobox-toggle:hover svg,
  .combobox-toggle:hover [class*='icon'] {
    fill: HighlightText;
    stroke: HighlightText;
  }

  .combobox-toggle:focus,
  .combobox-toggle:focus-visible {
    border-color: Highlight;
    outline: 2px solid Highlight;
    outline-offset: 2px;
  }

  /* ========================================
     LISTBOX POPUP - CONTAINER
     Non-interactive container: Canvas, no forced-color-adjust: none
     ======================================== */
  .combobox-listbox {
    background-color: Canvas;
    border: 2px solid CanvasText;
  }

  /* ========================================
     LISTBOX POPUP - OPTIONS (default state)
     forced-color-adjust: none required on each option so explicit color
     pairs (Highlight/HighlightText, SelectedItem/SelectedItemText) apply
     reliably — the container's forced-color-adjust does not cascade here.
     ======================================== */
  .combobox-option {
    forced-color-adjust: none;
    background-color: Canvas;
    color: CanvasText;
  }

  /* ========================================
     LISTBOX POPUP - ACTIVE OPTION (hover / keyboard cursor)
     The option pointed to by aria-activedescendant on the input.
     Highlight = focus/hover. SelectedItem = actual selection. Do NOT conflate.
     Must set BOTH background-color AND color — pairing is not automatic.
     ======================================== */
  .combobox-option.is-active,
  .combobox-option:hover {
    forced-color-adjust: none;
    background-color: Highlight;
    color: HighlightText;
  }

  /* ========================================
     LISTBOX POPUP - SELECTED OPTION
     aria-selected="true" means the option IS selected (committed value).
     In multi-select comboboxes, multiple options can carry aria-selected="true"
     simultaneously. Use SelectedItem/SelectedItemText, not Highlight.
     ======================================== */
  .combobox-option[aria-selected='true'] {
    background-color: SelectedItem;
    color: SelectedItemText;
  }

  /* ========================================
     LISTBOX POPUP - SELECTED + ACTIVE
     When the keyboard cursor lands on an already-selected option.
     Keep SelectedItem background; add Highlight outline for cursor visibility.
     ======================================== */
  .combobox-option[aria-selected='true'].is-active,
  .combobox-option[aria-selected='true']:hover {
    forced-color-adjust: none;
    background-color: SelectedItem;
    color: SelectedItemText;
    outline: 2px solid Highlight;
    outline-offset: -2px;
  }

  /* ========================================
     SEARCH MATCH HIGHLIGHTING
     ======================================== */
  .combobox-option mark,
  .combobox-option .match {
    background-color: Mark;
    color: MarkText;
  }

  /* ========================================
     DISABLED / NO RESULTS STATE
     ======================================== */
  .combobox-option[aria-disabled='true'],
  .combobox-no-results {
    color: GrayText;
  }
}
```
